import { tx } from '../db.js';
import { addDays, isDate, todayIn } from '../lib/dates.js';
import { audit } from './audit.js';
import { queueAdminMail } from './email.js';
import { getSettings } from './settings.js';

// --- Parser (RFC 5545, beperkt tot wat Airbnb en Booking.com gebruiken: VEVENT met DTSTART/DTEND/UID/SUMMARY) ---
function unfold(text) {
  return text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
}
function toDate(value, tz = 'Europe/Amsterdam') {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(value.trim());
  if (!m) return null;
  if (!m[4]) return `${m[1]}-${m[2]}-${m[3]}`;
  // Tijdstip -> kalenderdatum in Nederlandse tijd
  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7] ? 'Z' : ''}`;
  if (!m[7]) return iso.slice(0, 10);
  return todayIn(tz, new Date(iso));
}

export function parseIcal(text) {
  const events = [];
  let cur = null;
  for (const line of unfold(text).split('\n')) {
    if (line === 'BEGIN:VEVENT') cur = {};
    else if (line === 'END:VEVENT') {
      if (cur?.start) {
        if (!cur.end || cur.end <= cur.start) cur.end = addDays(cur.start, 1);
        if (cur.status !== 'CANCELLED') events.push(cur);
      }
      cur = null;
    } else if (cur) {
      const idx = line.indexOf(':');
      if (idx < 0) continue;
      const name = line.slice(0, idx).split(';')[0].toUpperCase();
      const value = line.slice(idx + 1);
      if (name === 'DTSTART') cur.start = toDate(value);
      else if (name === 'DTEND') cur.end = toDate(value);
      else if (name === 'UID') cur.uid = value.trim().slice(0, 300);
      else if (name === 'SUMMARY') cur.summary = value.trim().replace(/\\,/g, ',').slice(0, 200);
      else if (name === 'STATUS') cur.status = value.trim().toUpperCase();
    }
  }
  return events.filter((e) => isDate(e.start) && isDate(e.end));
}

async function fetchText(url, timeoutMs = 15000, maxBytes = 3_000_000) {
  const u = new URL(url);
  if (u.protocol !== 'https:') throw new Error('Alleen https-adressen zijn toegestaan');
  const res = await fetch(u, { signal: AbortSignal.timeout(timeoutMs), redirect: 'follow', headers: { 'User-Agent': 'InnVenlo-Boekingssysteem/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBytes) throw new Error('Kalenderbestand is te groot');
  const text = buf.toString('utf8');
  if (!text.includes('BEGIN:VCALENDAR')) throw new Error('Geen geldig iCal-bestand');
  return text;
}

/**
 * Importeert één externe agenda: vervangt de geïmporteerde blokkades van deze koppeling door de actuele stand.
 * Overlapt een externe reservering met een eigen actieve boeking, dan krijgt de beheerder direct een waarschuwing.
 */
export async function syncFeed(pool, ctx, feedId, { fetcher = fetchText } = {}) {
  const { cfg, log } = ctx;
  const feed = (await pool.query('SELECT f.*, u.name AS unit_name FROM ical_feeds f JOIN units u ON u.id = f.unit_id WHERE f.id = $1', [feedId])).rows[0];
  if (!feed || !feed.import_url) return { skipped: true };
  try {
    const events = parseIcal(await fetcher(feed.import_url));
    const today = todayIn(cfg.timezone);
    const relevant = events.filter((e) => e.end >= addDays(today, -1));
    const result = await tx(pool, async (db) => {
      await db.query('SELECT 1 FROM units WHERE id = $1 FOR UPDATE', [feed.unit_id]);
      const before = new Set((await db.query('SELECT external_uid, start_date, end_date FROM blocks WHERE feed_id = $1', [feedId])).rows.map((r) => `${r.external_uid}|${r.start_date}|${r.end_date}`));
      await db.query('DELETE FROM blocks WHERE feed_id = $1', [feedId]);
      const conflicts = [];
      for (const e of relevant) {
        await db.query(
          `INSERT INTO blocks (unit_id, start_date, end_date, reason, source, feed_id, external_uid) VALUES ($1, $2, $3, $4, 'ical', $5, $6)`,
          [feed.unit_id, e.start, e.end, `${feed.name}${e.summary ? ': ' + e.summary : ''}`.slice(0, 200), feedId, e.uid || null]);
        if (before.has(`${e.uid || null}|${e.start}|${e.end}`)) continue; // al bekend; niet opnieuw waarschuwen
        const { rows } = await db.query(
          `SELECT reference, check_in, check_out FROM bookings WHERE unit_id = $1 AND status IN ('new','confirmed')
             AND occupancy && daterange($2::date, $3::date, '[)')`, [feed.unit_id, e.start, e.end]);
        for (const r of rows) conflicts.push({ ...r, ext: e });
      }
      await db.query(`UPDATE ical_feeds SET last_sync_at = now(), last_status = 'ok', last_error = NULL WHERE id = $1`, [feedId]);
      if (conflicts.length) {
        const settings = await getSettings(db);
        const message = `Bij de synchronisatie met ${feed.name} (${feed.unit_name}) zijn externe reserveringen gevonden die overlappen met eigen boekingen:\n` +
          conflicts.map((c) => `- ${c.reference} (${c.check_in} t/m ${c.check_out}) overlapt met ${feed.name} ${c.ext.start} – ${c.ext.end}`).join('\n') +
          '\nControleer dit direct en neem zo nodig contact op met de gast.';
        await queueAdminMail(db, cfg, settings, 'admin_ical_conflict', null, { unitName: feed.unit_name, message });
        await audit(db, { actor: 'systeem', action: 'ical.conflict', entity: 'ical_feed', entityId: feedId, details: { conflicts: conflicts.map((c) => c.reference) } });
      }
      return { imported: relevant.length, conflicts: conflicts.length };
    });
    return result;
  } catch (err) {
    await pool.query(`UPDATE ical_feeds SET last_sync_at = now(), last_status = 'error', last_error = $2 WHERE id = $1`, [feedId, String(err.message).slice(0, 500)]);
    log?.warn?.({ feedId, err: err.message }, 'iCal-synchronisatie mislukt');
    return { error: err.message };
  }
}

export async function syncAllFeeds(pool, ctx) {
  const { rows } = await pool.query('SELECT id FROM ical_feeds WHERE active AND import_url IS NOT NULL');
  for (const r of rows) await syncFeed(pool, ctx, r.id);
  return rows.length;
}

// --- Export ---
function icsDate(d) {
  return d.replace(/-/g, '');
}
function icsEscape(s) {
  return String(s).replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
}

/**
 * Bouwt de iCal-export voor een appartement. Bevat GEEN persoonsgegevens, alleen 'Bezet'-periodes.
 * excludeFeedId: blokkades die uit die koppeling komen worden weggelaten, zodat een kanaal zijn eigen reserveringen
 * niet terugkrijgt (voorkomt echo-lussen tussen Airbnb, Booking.com en dit systeem).
 */
export async function buildExport(db, unitId, { excludeFeedId = null, tz = 'Europe/Amsterdam' } = {}) {
  const since = addDays(todayIn(tz), -30);
  const { rows } = await db.query(
    `SELECT 'b' || id AS uid, lower(occupancy) AS s, upper(occupancy) AS e FROM bookings
      WHERE unit_id = $1 AND status IN ('new','confirmed') AND check_out >= $2
     UNION ALL
     SELECT 'k' || id, start_date, end_date FROM blocks
      WHERE unit_id = $1 AND end_date >= $2 AND (feed_id IS NULL OR $3::int IS NULL OR feed_id <> $3)
     ORDER BY 2`, [unitId, since, excludeFeedId]);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//InnVenlo//Boekingssysteem//NL', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const r of rows) {
    lines.push('BEGIN:VEVENT', `UID:${r.uid}-${unitId}@innvenlo.nl`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(r.s)}`, `DTEND;VALUE=DATE:${icsDate(r.e)}`, `SUMMARY:${icsEscape('Bezet – InnVenlo')}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
