import { tx } from '../db.js';
import { diffDays, isDate, todayIn } from '../lib/dates.js';
import { AppError, bad, conflict, forbidden, notFound } from '../lib/errors.js';
import { bookingReference, randomToken, sha256 } from '../lib/security.js';
import { audit } from './audit.js';
import { checkRules, computePrice, getUnit, isFree, ratePeriods } from './availability.js';
import { queueAdminMail, queueGuestMail } from './email.js';
import { getSettings } from './settings.js';

export const STATUSES = ['new', 'confirmed', 'cancelled', 'completed', 'no_show'];

export async function loadBooking(db, id) {
  const { rows } = await db.query(
    `SELECT b.*, (b.check_out - b.check_in) AS nights, u.name AS unit_name, u.slug AS unit_slug,
            g.first_name, g.last_name, g.email, g.phone, g.anonymized_at
       FROM bookings b JOIN units u ON u.id = b.unit_id JOIN guests g ON g.id = b.guest_id
      WHERE b.id = $1`, [id]);
  return rows[0] || null;
}

const manageUrl = (cfg, token) => (token ? `${cfg.publicSiteUrl}/boeken.html#beheer=${token}` : null);

function mapDbError(err) {
  if (err.code === '23P01') return conflict('dates_unavailable', 'Deze periode is niet (meer) beschikbaar');
  if (err.code === '23505' && /guests_email/.test(err.constraint || '')) return conflict('email_in_use', 'Dit e-mailadres hoort al bij een andere klant');
  return err;
}

async function upsertGuest(db, g) {
  if (g.email) {
    const { rows } = await db.query(
      `INSERT INTO guests (first_name, last_name, email, phone, language) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ((lower(email))) WHERE email IS NOT NULL
       DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
                     phone = COALESCE(EXCLUDED.phone, guests.phone), language = EXCLUDED.language,
                     updated_at = now(), anonymized_at = NULL
       RETURNING id`, [g.firstName, g.lastName, g.email, g.phone || null, g.language || 'nl']);
    return rows[0].id;
  }
  const { rows } = await db.query(
    'INSERT INTO guests (first_name, last_name, phone, language) VALUES ($1, $2, $3, $4) RETURNING id',
    [g.firstName, g.lastName, g.phone || null, g.language || 'nl']);
  return rows[0].id;
}

/**
 * Nieuwe boeking. Volgorde binnen één transactie:
 * 1) appartement vergrendelen (FOR UPDATE) -> gelijktijdige aanvragen voor hetzelfde appartement wachten op elkaar
 * 2) regels + beschikbaarheid (boekingen én blokkades) controleren
 * 3) invoegen; de EXCLUDE-constraint in de database is de laatste, absolute garantie tegen overlap
 * 4) e-mails in de wachtrij zetten
 */
export async function createBooking(pool, ctx, input, { admin = null, ip = null } = {}) {
  const { cfg } = ctx;
  try {
    return await tx(pool, async (db) => {
      if (!isDate(input.checkIn) || !isDate(input.checkOut)) throw new AppError(422, 'invalid_dates', 'Ongeldige datum', { errors: ['invalid_dates'] });
      const settings = await getSettings(db);
      const unit = await getUnit(db, input.unitId != null ? { id: input.unitId } : { slug: input.unit }, { forUpdate: true });
      if (!unit) throw bad('unit_unavailable', 'Onbekend appartement');
      const periods = await ratePeriods(db, unit.id, input.checkIn, input.checkOut);
      const errors = checkRules({ unit, settings, periods, checkIn: input.checkIn, checkOut: input.checkOut, guestsCount: input.guestsCount, skipRules: !!admin, tz: cfg.timezone });
      if (errors.length) throw new AppError(422, errors[0], 'Boeking voldoet niet aan de voorwaarden', { errors });

      if (!admin && input.email) {
        const { rows } = await db.query(
          `SELECT count(*) AS n FROM bookings b JOIN guests g ON g.id = b.guest_id
            WHERE lower(g.email) = lower($1) AND b.status = 'new'`, [input.email]);
        if (rows[0].n >= settings.max_open_requests_per_email) throw new AppError(429, 'too_many_requests', 'Te veel openstaande aanvragen');
      }

      const bufferDays = settings.buffer_days;
      if (!(await isFree(db, unit.id, input.checkIn, input.checkOut, bufferDays))) throw conflict('dates_unavailable', 'Deze periode is niet (meer) beschikbaar');

      const price = computePrice(unit, periods, settings, input.checkIn, input.checkOut, input.guestsCount);
      const total = admin && Number.isInteger(input.totalCents) ? input.totalCents : price.totalCents;
      const guestId = await upsertGuest(db, input);
      const token = input.email ? randomToken(32) : null;
      const status = admin ? (input.status || 'confirmed') : (settings.require_approval ? 'new' : 'confirmed');
      if (!['new', 'confirmed'].includes(status)) throw bad('invalid_status', 'Een nieuwe boeking is Nieuw of Bevestigd');

      let id;
      for (let attempt = 0; ; attempt++) {
        try {
          await db.query('SAVEPOINT ins');
          const { rows } = await db.query(
            `INSERT INTO bookings (reference, unit_id, guest_id, check_in, check_out, buffer_days, guests_count, status, source,
                                   total_cents, price_breakdown, remarks, language, policy_snapshot, manage_token_hash, consent_at, confirmed_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8::booking_status,$9,$10,$11,$12,$13,$14,$15,$16, CASE WHEN $8::booking_status = 'confirmed' THEN now() END)
             RETURNING id`,
            [bookingReference(), unit.id, guestId, input.checkIn, input.checkOut, bufferDays, input.guestsCount, status,
              admin ? 'admin' : 'website', total, JSON.stringify(price), input.remarks || null, input.language || 'nl',
              JSON.stringify({ free_cancellation_days: settings.free_cancellation_days, text: settings.cancellation_policy?.[input.language || 'nl'] }),
              token ? sha256(token) : null, admin ? null : new Date()]);
          id = rows[0].id;
          await db.query('RELEASE SAVEPOINT ins');
          break;
        } catch (e) {
          await db.query('ROLLBACK TO SAVEPOINT ins');
          if (e.code === '23505' && /reference/.test(e.constraint || '') && attempt < 5) continue; // zeldzame botsing van referentie
          throw e;
        }
      }

      const booking = await loadBooking(db, id);
      const notify = admin ? input.notifyGuest !== false : true;
      if (notify && booking.email) {
        await queueGuestMail(db, cfg, settings, status === 'confirmed' ? 'confirmed' : 'request_received', booking, { manageUrl: manageUrl(cfg, token) });
      }
      if (!admin) await queueAdminMail(db, cfg, settings, 'admin_new_request', booking);
      await audit(db, { admin, actor: admin ? undefined : 'gast (website)', action: 'booking.create', entity: 'booking', entityId: id,
        details: { reference: booking.reference, unit: unit.slug, checkIn: booking.check_in, checkOut: booking.check_out, status }, ip });
      return { booking, manageToken: token };
    });
  } catch (e) {
    throw mapDbError(e);
  }
}

// Wijzigen door beheerder (data, appartement, gasten, prijs, opmerkingen, klantgegevens).
export async function updateBooking(pool, ctx, id, patch, { admin, ip }) {
  const { cfg } = ctx;
  try {
    return await tx(pool, async (db) => {
      const settings = await getSettings(db);
      const cur = (await db.query('SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [id])).rows[0];
      if (!cur) throw notFound('Boeking niet gevonden');
      if ((patch.checkIn && !isDate(patch.checkIn)) || (patch.checkOut && !isDate(patch.checkOut))) throw new AppError(422, 'invalid_dates', 'Ongeldige datum');
      const next = {
        unitId: patch.unitId ?? cur.unit_id,
        checkIn: patch.checkIn ?? cur.check_in,
        checkOut: patch.checkOut ?? cur.check_out,
        guestsCount: patch.guestsCount ?? cur.guests_count,
      };
      const unit = await getUnit(db, { id: next.unitId }, { forUpdate: true });
      const errs = checkRules({ unit, settings, periods: [], ...next, skipRules: true, tz: cfg.timezone });
      if (errs.length) throw new AppError(422, errs[0], 'Ongeldige wijziging', { errors: errs });

      const datesChanged = next.unitId !== cur.unit_id || next.checkIn !== cur.check_in || next.checkOut !== cur.check_out || next.guestsCount !== cur.guests_count;
      const active = ['new', 'confirmed', 'completed'].includes(cur.status);
      if (datesChanged && active && !(await isFree(db, next.unitId, next.checkIn, next.checkOut, cur.buffer_days, id))) {
        throw conflict('dates_unavailable', 'De nieuwe periode is niet beschikbaar');
      }
      let total = cur.total_cents;
      let breakdown = cur.price_breakdown;
      if (Number.isInteger(patch.totalCents)) total = patch.totalCents;
      else if (datesChanged) {
        const periods = await ratePeriods(db, unit.id, next.checkIn, next.checkOut);
        breakdown = computePrice(unit, periods, settings, next.checkIn, next.checkOut, next.guestsCount);
        total = breakdown.totalCents;
      }
      await db.query(
        `UPDATE bookings SET unit_id=$2, check_in=$3, check_out=$4, guests_count=$5, total_cents=$6, price_breakdown=$7,
                remarks = CASE WHEN $8::boolean THEN $9 ELSE remarks END, language = COALESCE($10, language),
                reminder1_sent_at = CASE WHEN $11 THEN NULL ELSE reminder1_sent_at END,
                reminder2_sent_at = CASE WHEN $11 THEN NULL ELSE reminder2_sent_at END, updated_at = now()
          WHERE id = $1`,
        [id, next.unitId, next.checkIn, next.checkOut, next.guestsCount, total, JSON.stringify(breakdown),
          patch.remarks !== undefined, patch.remarks ?? null, patch.guest?.language ?? null, next.checkIn !== cur.check_in]);
      if (patch.guest) {
        const g = patch.guest;
        await db.query(
          `UPDATE guests SET first_name = COALESCE($2, first_name), last_name = COALESCE($3, last_name),
                  email = CASE WHEN $4::boolean THEN $5 ELSE email END, phone = CASE WHEN $6::boolean THEN $7 ELSE phone END,
                  language = COALESCE($8, language), updated_at = now() WHERE id = $1`,
          [cur.guest_id, g.firstName ?? null, g.lastName ?? null, g.email !== undefined, g.email || null, g.phone !== undefined, g.phone || null, g.language ?? null]);
      }
      const booking = await loadBooking(db, id);
      let token = null;
      if (patch.notifyGuest && booking.email && ['new', 'confirmed'].includes(booking.status)) {
        token = randomToken(32); // nieuwe beheerlink; de oude vervalt
        await db.query('UPDATE bookings SET manage_token_hash = $2 WHERE id = $1', [id, sha256(token)]);
        await queueGuestMail(db, cfg, settings, 'updated', booking, { manageUrl: manageUrl(cfg, token) });
      }
      const changed = {};
      for (const k of ['unit_id', 'check_in', 'check_out', 'guests_count', 'total_cents']) if (String(cur[k]) !== String(booking[k])) changed[k] = [cur[k], booking[k]];
      await audit(db, { admin, action: 'booking.update', entity: 'booking', entityId: id, details: { reference: booking.reference, changed, guestDataChanged: !!patch.guest, notified: !!token }, ip });
      return booking;
    });
  } catch (e) {
    throw mapDbError(e);
  }
}

export async function changeStatus(pool, ctx, id, { status, notifyGuest = true, reason = null }, { admin, ip }) {
  const { cfg } = ctx;
  if (!STATUSES.includes(status)) throw bad('invalid_status', 'Onbekende status');
  try {
    return await tx(pool, async (db) => {
      const settings = await getSettings(db);
      const cur = (await db.query('SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [id])).rows[0];
      if (!cur) throw notFound('Boeking niet gevonden');
      if (cur.status === status) return loadBooking(db, id);
      // Heractiveren van een geannuleerde boeking: opnieuw beschikbaarheid controleren
      if (['cancelled', 'no_show'].includes(cur.status) && ['new', 'confirmed', 'completed'].includes(status)) {
        await getUnit(db, { id: cur.unit_id }, { forUpdate: true });
        if (!(await isFree(db, cur.unit_id, cur.check_in, cur.check_out, cur.buffer_days, id))) throw conflict('dates_unavailable', 'De periode is inmiddels bezet');
      }
      await db.query(
        `UPDATE bookings SET status = $2::booking_status, updated_at = now(),
                confirmed_at = CASE WHEN $2::booking_status = 'confirmed' THEN now() ELSE confirmed_at END,
                cancelled_at = CASE WHEN $2::booking_status = 'cancelled' THEN now() ELSE NULL END,
                cancelled_by = CASE WHEN $2::booking_status = 'cancelled' THEN 'host' ELSE NULL END,
                cancel_reason = CASE WHEN $2::booking_status = 'cancelled' THEN $3::text ELSE NULL END
          WHERE id = $1`, [id, status, reason]);
      const booking = await loadBooking(db, id);
      if (notifyGuest && booking.email) {
        if (status === 'confirmed') {
          const token = randomToken(32);
          await db.query('UPDATE bookings SET manage_token_hash = $2 WHERE id = $1', [id, sha256(token)]);
          await queueGuestMail(db, cfg, settings, 'confirmed', booking, { manageUrl: manageUrl(cfg, token) });
        } else if (status === 'cancelled') {
          await queueGuestMail(db, cfg, settings, cur.status === 'new' ? 'declined' : 'cancelled', booking, { reason });
        }
      }
      await audit(db, { admin, action: 'booking.status', entity: 'booking', entityId: id, details: { reference: booking.reference, from: cur.status, to: status, notified: !!notifyGuest }, ip });
      return booking;
    });
  } catch (e) {
    throw mapDbError(e);
  }
}

// Gast bekijkt zijn eigen boeking via de geheime link. Alleen het token geeft toegang; geen opsomming mogelijk.
export async function findByManageToken(db, token) {
  if (typeof token !== 'string' || token.length < 30 || token.length > 100) return null;
  const { rows } = await db.query('SELECT id FROM bookings WHERE manage_token_hash = $1', [sha256(token)]);
  return rows[0] ? loadBooking(db, rows[0].id) : null;
}

export function guestCanCancel(booking, settings, tz) {
  if (!['new', 'confirmed'].includes(booking.status)) return false;
  const days = booking.policy_snapshot?.free_cancellation_days ?? settings.free_cancellation_days;
  return diffDays(todayIn(tz), booking.check_in) >= days;
}

export async function guestCancel(pool, ctx, token, ip) {
  const { cfg } = ctx;
  return tx(pool, async (db) => {
    const settings = await getSettings(db);
    const b0 = await findByManageToken(db, token);
    if (!b0) throw notFound('Boeking niet gevonden');
    await db.query('SELECT 1 FROM bookings WHERE id = $1 FOR UPDATE', [b0.id]);
    const b = await loadBooking(db, b0.id);
    if (!guestCanCancel(b, settings, cfg.timezone)) throw forbidden('Online annuleren is niet (meer) mogelijk; neem contact op');
    await db.query(
      `UPDATE bookings SET status = 'cancelled', cancelled_at = now(), cancelled_by = 'guest', updated_at = now() WHERE id = $1`, [b.id]);
    const booking = await loadBooking(db, b.id);
    await queueGuestMail(db, cfg, settings, 'cancelled', booking);
    await queueAdminMail(db, cfg, settings, 'admin_guest_cancelled', booking);
    await audit(db, { actor: 'gast (beheerlink)', action: 'booking.guest_cancel', entity: 'booking', entityId: b.id, details: { reference: b.reference }, ip });
    return booking;
  });
}

// Veilige verwijderprocedure: alleen eigenaar, alleen niet-actieve of afgelopen boekingen, met bevestiging via het boekingsnummer.
export async function deleteBooking(pool, ctx, id, confirmReference, { admin, ip }) {
  return tx(pool, async (db) => {
    const b = (await db.query('SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [id])).rows[0];
    if (!b) throw notFound('Boeking niet gevonden');
    if (confirmReference !== b.reference) throw bad('confirm_mismatch', 'Typ het boekingsnummer ter bevestiging');
    const today = todayIn(ctx.cfg.timezone);
    if (['new', 'confirmed'].includes(b.status) && b.check_out >= today) throw conflict('still_active', 'Annuleer de boeking eerst voordat u deze verwijdert');
    await db.query('DELETE FROM bookings WHERE id = $1', [id]);
    const left = await db.query('SELECT 1 FROM bookings WHERE guest_id = $1 LIMIT 1', [b.guest_id]);
    if (!left.rowCount) await db.query('DELETE FROM guests WHERE id = $1', [b.guest_id]);
    await audit(db, { admin, action: 'booking.delete', entity: 'booking', entityId: id, details: { reference: b.reference, status: b.status, checkIn: b.check_in, checkOut: b.check_out }, ip });
    return { deleted: true };
  });
}
