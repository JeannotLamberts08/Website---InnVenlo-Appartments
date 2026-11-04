import { addDays, diffDays, isDate, todayIn } from '../lib/dates.js';
import { AppError, bad, notFound } from '../lib/errors.js';
import { checkRules, computePrice, getUnit, minNightsFor, ratePeriods, unavailableNights } from '../services/availability.js';
import { createBooking, findByManageToken, guestCanCancel, guestCancel } from '../services/bookings.js';
import { buildExport } from '../services/ical.js';
import { getSettings } from '../services/settings.js';

const DATE = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' };
const LANG = { type: 'string', enum: ['nl', 'en', 'de', 'fr'] };

export default async function publicRoutes(app, { pool, cfg, log }) {
  const ctx = { cfg, log };

  // Openbare regels en appartementen voor de boekingspagina
  app.get('/api/public/config', async () => {
    const s = await getSettings(pool);
    const { rows } = await pool.query('SELECT slug, name, max_guests, base_price_cents FROM units WHERE active ORDER BY sort_order, id');
    return {
      bookingEnabled: s.booking_enabled,
      requireApproval: s.require_approval,
      today: todayIn(cfg.timezone),
      units: rows.map((u) => ({ slug: u.slug, name: u.name, maxGuests: u.max_guests, basePriceCents: u.base_price_cents })),
      rules: {
        minNights: s.min_nights, maxNights: s.max_nights, windowDays: s.booking_window_days, leadDays: s.min_lead_days,
        arrivalWeekdays: s.arrival_weekdays, departureWeekdays: s.departure_weekdays, bufferDays: s.buffer_days,
        checkInFrom: s.check_in_from, checkInUntil: s.check_in_until, checkOutFrom: s.check_out_from, checkOutUntil: s.check_out_until,
        cleaningFeeCents: s.cleaning_fee_cents, touristTaxCentsPppn: s.tourist_tax_cents_pppn,
        freeCancellationDays: s.free_cancellation_days, cancellationPolicy: s.cancellation_policy,
      },
      contact: { phone: s.property_phone, name: s.property_name },
    };
  });

  // Bezette nachten (alleen datums, geen gegevens over wie er verblijft) + afwijkende prijzen
  app.get('/api/public/availability', {
    schema: { querystring: { type: 'object', required: ['unit', 'from', 'to'], properties: { unit: { type: 'string', maxLength: 40 }, from: DATE, to: DATE } } },
  }, async (req) => {
    const { unit: slug, from, to } = req.query;
    if (!isDate(from) || !isDate(to) || to <= from || diffDays(from, to) > 400) throw bad('invalid_range', 'Ongeldige periode');
    const unit = await getUnit(pool, { slug });
    if (!unit || !unit.active) throw notFound('Appartement niet gevonden');
    const [unavailable, periods] = await Promise.all([unavailableNights(pool, unit.id, from, to), ratePeriods(pool, unit.id, from, to)]);
    return {
      unit: unit.slug, from, to, unavailable,
      rates: periods.map((p) => ({ start: p.start_date, end: p.end_date, priceCents: p.price_cents, minNights: p.min_nights })),
    };
  });

  const stayProps = { unit: { type: 'string', maxLength: 40 }, checkIn: DATE, checkOut: DATE, guests: { type: 'integer', minimum: 1, maximum: 20 } };

  app.post('/api/public/quote', {
    schema: { body: { type: 'object', additionalProperties: false, required: ['unit', 'checkIn', 'checkOut', 'guests'], properties: stayProps } },
  }, async (req) => {
    const { unit: slug, checkIn, checkOut, guests } = req.body;
    if (!isDate(checkIn) || !isDate(checkOut)) return { available: false, errors: ['invalid_dates'], price: null };
    const s = await getSettings(pool);
    const unit = await getUnit(pool, { slug });
    if (!unit || !unit.active) throw notFound('Appartement niet gevonden');
    const periods = await ratePeriods(pool, unit.id, checkIn, checkOut);
    const errors = checkRules({ unit, settings: s, periods, checkIn, checkOut, guestsCount: guests, tz: cfg.timezone });
    if (!errors.length) {
      const taken = await unavailableNights(pool, unit.id, checkIn, addDays(checkOut, s.buffer_days));
      if (taken.length) errors.push('dates_unavailable');
    }
    const price = errors.includes('invalid_dates') || errors.includes('checkout_before_checkin') ? null : computePrice(unit, periods, s, checkIn, checkOut, guests);
    return { available: errors.length === 0, errors, minNights: minNightsFor(periods, s, checkIn), price };
  });

  // Boekingsaanvraag. Server-side validatie, honeypot, tijdcontrole en rate-limit tegen spam.
  app.post('/api/public/bookings', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
    schema: {
      body: {
        type: 'object', additionalProperties: false,
        required: ['unit', 'checkIn', 'checkOut', 'guests', 'firstName', 'lastName', 'email', 'phone', 'consent'],
        properties: {
          ...stayProps,
          firstName: { type: 'string', minLength: 1, maxLength: 80 },
          lastName: { type: 'string', minLength: 1, maxLength: 80 },
          email: { type: 'string', format: 'email', maxLength: 200 },
          phone: { type: 'string', pattern: '^[+0-9 ()./-]{6,25}$' },
          remarks: { type: 'string', maxLength: 1000 },
          language: LANG,
          consent: { type: 'boolean', const: true },
          website: { type: 'string', maxLength: 200 },   // honeypot: moet leeg blijven
          elapsedMs: { type: 'integer', minimum: 0 },
        },
      },
    },
  }, async (req, reply) => {
    const b = req.body;
    if (b.website || (b.elapsedMs ?? 0) < 2500) throw new AppError(400, 'spam_suspected', 'Aanvraag niet geaccepteerd');
    const clean = (s) => (s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
    const firstName = clean(b.firstName);
    const lastName = clean(b.lastName);
    if (!firstName || !lastName) throw bad('validation', 'Naam is verplicht');
    const { booking, manageToken } = await createBooking(pool, ctx, {
      unit: b.unit, checkIn: b.checkIn, checkOut: b.checkOut, guestsCount: b.guests,
      firstName, lastName, email: b.email.trim().toLowerCase(), phone: clean(b.phone),
      remarks: (b.remarks || '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim() || null,
      language: b.language || 'nl',
    }, { ip: req.ipHash });
    reply.code(201);
    return {
      reference: booking.reference, status: booking.status, unit: booking.unit_name,
      checkIn: booking.check_in, checkOut: booking.check_out, nights: booking.nights, guests: booking.guests_count,
      totalCents: booking.total_cents, manageToken,
    };
  });

  const tokenBody = { type: 'object', additionalProperties: false, required: ['token'], properties: { token: { type: 'string', minLength: 30, maxLength: 100 } } };

  app.post('/api/public/manage', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } }, schema: { body: tokenBody } }, async (req) => {
    const b = await findByManageToken(pool, req.body.token);
    if (!b) throw notFound('Boeking niet gevonden');
    const s = await getSettings(pool);
    return {
      reference: b.reference, status: b.status, unit: b.unit_name, checkIn: b.check_in, checkOut: b.check_out,
      nights: b.nights, guests: b.guests_count, totalCents: b.total_cents, firstName: b.first_name,
      canCancel: guestCanCancel(b, s, cfg.timezone),
      freeCancellationDays: b.policy_snapshot?.free_cancellation_days ?? s.free_cancellation_days,
    };
  });

  app.post('/api/public/manage/cancel', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } }, schema: { body: tokenBody } }, async (req) => {
    const b = await guestCancel(pool, ctx, req.body.token, req.ipHash);
    return { reference: b.reference, status: b.status };
  });

  // iCal-export (geheime URL per appartement of per kanaal)
  app.get('/ical/unit/:token', async (req, reply) => {
    const token = String(req.params.token).replace(/\.ics$/, '');
    const { rows } = await pool.query('SELECT id FROM units WHERE ical_export_token = $1', [token]);
    if (!rows[0]) throw notFound();
    reply.type('text/calendar; charset=utf-8').header('Cache-Control', 'no-store');
    return buildExport(pool, rows[0].id, { tz: cfg.timezone });
  });
  app.get('/ical/feed/:token', async (req, reply) => {
    const token = String(req.params.token).replace(/\.ics$/, '');
    const { rows } = await pool.query('SELECT id, unit_id FROM ical_feeds WHERE export_token = $1', [token]);
    if (!rows[0]) throw notFound();
    reply.type('text/calendar; charset=utf-8').header('Cache-Control', 'no-store');
    return buildExport(pool, rows[0].unit_id, { excludeFeedId: rows[0].id, tz: cfg.timezone });
  });

  app.get('/health', async () => {
    await pool.query('SELECT 1');
    return { ok: true };
  });
}
