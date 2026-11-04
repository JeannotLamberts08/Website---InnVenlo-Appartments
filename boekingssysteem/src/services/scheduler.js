import { tx } from '../db.js';
import { audit } from './audit.js';
import { processOutbox, queueGuestMail } from './email.js';
import { syncAllFeeds } from './ical.js';
import { getSettings } from './settings.js';
import { loadBooking } from './bookings.js';

// Herinneringen: verstuurd zodra het moment 'X uur voor aankomst (incheckttijd)' is aangebroken.
// De voorwaardelijke UPDATE ... RETURNING zorgt dat elke herinnering precies één keer wordt verstuurd.
export async function sendReminders(pool, ctx) {
  const { cfg } = ctx;
  let count = 0;
  await tx(pool, async (db) => {
    const s = await getSettings(db);
    for (const n of [1, 2]) {
      if (!s[`reminder${n}_enabled`]) continue;
      const { rows } = await db.query(
        `UPDATE bookings b SET reminder${n}_sent_at = now()
          WHERE status = 'confirmed' AND reminder${n}_sent_at IS NULL
            AND ((check_in + $1::time) AT TIME ZONE 'Europe/Amsterdam') - make_interval(hours => $2) <= now()
            AND ((check_in + $1::time) AT TIME ZONE 'Europe/Amsterdam') > now()
            AND NOT (b.created_at > ((check_in + $1::time) AT TIME ZONE 'Europe/Amsterdam') - make_interval(hours => $2))
          RETURNING id`, [s.check_in_from, s[`reminder${n}_hours_before`]]);
      for (const r of rows) {
        const b = await loadBooking(db, r.id);
        if (b.email) { await queueGuestMail(db, cfg, s, 'reminder', b); count++; }
      }
    }
  });
  return count;
}

// Bevestigde boekingen waarvan de vertrekdatum voorbij is -> Afgerond
export async function autoComplete(pool) {
  return tx(pool, async (db) => {
    const s = await getSettings(db);
    if (!s.auto_complete) return 0;
    const { rowCount } = await db.query(
      `UPDATE bookings SET status = 'completed', updated_at = now()
        WHERE status = 'confirmed' AND check_out < (now() AT TIME ZONE 'Europe/Amsterdam')::date`);
    return rowCount;
  });
}

// AVG: persoonsgegevens anonimiseren na de bewaartermijn; oude e-mails, sessies en logregels opruimen.
export async function applyRetention(pool) {
  return tx(pool, async (db) => {
    const s = await getSettings(db);
    const months = s.retention_months;
    const { rows } = await db.query(
      `UPDATE guests g SET first_name = 'Geanonimiseerd', last_name = NULL, email = NULL, phone = NULL,
              anonymized_at = now(), updated_at = now()
        WHERE anonymized_at IS NULL
          AND EXISTS (SELECT 1 FROM bookings b WHERE b.guest_id = g.id)
          AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.guest_id = g.id
                           AND (b.check_out > CURRENT_DATE - make_interval(months => $1) OR b.status IN ('new','confirmed')))
        RETURNING id`, [months]);
    if (rows.length) {
      const ids = rows.map((r) => r.id);
      await db.query('UPDATE bookings SET remarks = NULL, manage_token_hash = NULL WHERE guest_id = ANY($1)', [ids]);
      await db.query('DELETE FROM booking_notes WHERE booking_id IN (SELECT id FROM bookings WHERE guest_id = ANY($1))', [ids]);
      await audit(db, { actor: 'systeem', action: 'retention.anonymize', details: { guests: ids.length, months } });
    }
    await db.query(`DELETE FROM email_outbox WHERE status <> 'pending' AND created_at < now() - interval '90 days'`);
    await db.query('DELETE FROM sessions WHERE expires_at < now()');
    await db.query(`DELETE FROM audit_log WHERE created_at < now() - make_interval(months => GREATEST($1, 24))`, [months]);
    return rows.length;
  });
}

// Eenvoudige planner in hetzelfde proces. Een advisory lock voorkomt dubbel werk als er ooit twee instanties draaien.
export function startScheduler(pool, ctx, transport) {
  const { log } = ctx;
  const timers = [];
  const guarded = (lockId, name, fn) => async () => {
    const c = await pool.connect().catch(() => null);
    if (!c) return;
    try {
      const { rows } = await c.query('SELECT pg_try_advisory_lock($1) AS ok', [lockId]);
      if (!rows[0].ok) return;
      try { await fn(); } finally { await c.query('SELECT pg_advisory_unlock($1)', [lockId]); }
    } catch (err) {
      log.error({ err: err.message }, `Geplande taak ${name} mislukt`);
    } finally {
      c.release();
    }
  };
  const every = (ms, f) => { timers.push(setInterval(f, ms)); setTimeout(f, 5000); };
  every(30_000, guarded(8101, 'e-mail', () => processOutbox(pool, ctx.cfg, transport, log)));
  every(10 * 60_000, guarded(8102, 'herinneringen', async () => { await sendReminders(pool, ctx); await autoComplete(pool); }));
  every(6 * 3600_000, guarded(8103, 'bewaartermijn', () => applyRetention(pool)));
  let lastSync = 0;
  every(60_000, guarded(8104, 'ical', async () => {
    const s = await getSettings(pool);
    if (Date.now() - lastSync < s.ical_sync_minutes * 60_000) return;
    lastSync = Date.now();
    await syncAllFeeds(pool, ctx);
  }));
  return () => timers.forEach(clearInterval);
}
