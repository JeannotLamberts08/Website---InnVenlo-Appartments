import { addDays, diffDays, isDate, nights, todayIn, weekday } from '../lib/dates.js';

// Statussen die nachten bezet houden (gelijk aan de WHERE van de database-constraint)
export const ACTIVE_STATUSES = ['new', 'confirmed', 'completed'];

export async function getUnit(db, { id, slug }, { forUpdate = false } = {}) {
  const where = id != null ? 'id = $1' : 'slug = $1';
  const { rows } = await db.query(`SELECT * FROM units WHERE ${where}${forUpdate ? ' FOR UPDATE' : ''}`, [id ?? slug]);
  return rows[0] || null;
}

// Alle nachten in [from, to) die niet boekbaar zijn, inclusief bufferdagen. Geeft alleen datums terug, nooit gastgegevens.
export async function unavailableNights(db, unitId, from, to, { excludeBookingId = null } = {}) {
  const { rows } = await db.query(
    `SELECT lower(occupancy) AS s, upper(occupancy) AS e FROM bookings
      WHERE unit_id = $1 AND status = ANY($4) AND occupancy && daterange($2::date, $3::date, '[)')
        AND ($5::int IS NULL OR id <> $5)
     UNION ALL
     SELECT start_date, end_date FROM blocks
      WHERE unit_id = $1 AND daterange(start_date, end_date, '[)') && daterange($2::date, $3::date, '[)')`,
    [unitId, from, to, ACTIVE_STATUSES, excludeBookingId],
  );
  const set = new Set();
  for (const r of rows) {
    const s = r.s < from ? from : r.s;
    const e = r.e > to ? to : r.e;
    for (const d of nights(s, e)) set.add(d);
  }
  return [...set].sort();
}

export async function ratePeriods(db, unitId, from, to) {
  const { rows } = await db.query(
    `SELECT id, start_date, end_date, price_cents, min_nights, note FROM rate_periods
      WHERE unit_id = $1 AND start_date < $3 AND end_date > $2 ORDER BY start_date, id`,
    [unitId, from, to],
  );
  return rows;
}

// Prijsberekening per nacht. Bij overlappende periodes geldt de laatst aangemaakte.
export function computePrice(unit, periods, settings, checkIn, checkOut, guestsCount) {
  const perNight = [];
  for (const d of nights(checkIn, checkOut)) {
    let price = unit.base_price_cents;
    for (const p of periods) {
      if (p.price_cents != null && p.start_date <= d && d < p.end_date) price = p.price_cents;
    }
    perNight.push({ date: d, cents: price });
  }
  const n = perNight.length;
  const lodging = perNight.reduce((a, x) => a + x.cents, 0);
  const cleaning = settings.cleaning_fee_cents || 0;
  const touristTax = (settings.tourist_tax_cents_pppn || 0) * n * guestsCount;
  return { nights: n, perNight, lodgingCents: lodging, cleaningCents: cleaning, touristTaxCents: touristTax, totalCents: lodging + cleaning + touristTax };
}

// Minimum aantal nachten: periode-uitzondering op de aankomstdatum gaat voor de algemene instelling.
export function minNightsFor(periods, settings, checkIn) {
  let min = settings.min_nights;
  for (const p of periods) if (p.min_nights != null && p.start_date <= checkIn && checkIn < p.end_date) min = p.min_nights;
  return min;
}

// Controleert alle boekingsregels. Geeft een lijst foutcodes terug (leeg = in orde).
// Beheerders kunnen de regels (niet de bezetting) overslaan met skipRules.
export function checkRules({ unit, settings, periods, checkIn, checkOut, guestsCount, skipRules = false, tz }) {
  const errors = [];
  if (!isDate(checkIn) || !isDate(checkOut)) return ['invalid_dates'];
  if (checkOut <= checkIn) return ['checkout_before_checkin'];
  if (!unit || (!unit.active && !skipRules)) return ['unit_unavailable'];
  if (!Number.isInteger(guestsCount) || guestsCount < 1) errors.push('invalid_guests');
  else if (guestsCount > unit.max_guests) errors.push('too_many_guests');
  if (skipRules) return errors;

  const today = todayIn(tz);
  const n = diffDays(checkIn, checkOut);
  if (!settings.booking_enabled) errors.push('booking_disabled');
  if (diffDays(today, checkIn) < settings.min_lead_days) errors.push('too_soon');
  if (diffDays(today, checkIn) > settings.booking_window_days) errors.push('too_far_ahead');
  if (n < minNightsFor(periods, settings, checkIn)) errors.push('min_nights');
  if (n > settings.max_nights) errors.push('max_nights');
  if (!settings.arrival_weekdays.includes(weekday(checkIn))) errors.push('arrival_day_not_allowed');
  if (!settings.departure_weekdays.includes(weekday(checkOut))) errors.push('departure_day_not_allowed');
  return errors;
}

// Is de periode (inclusief buffer) vrij? Wordt binnen de transactie aangeroepen nadat het appartement is vergrendeld.
export async function isFree(db, unitId, checkIn, checkOut, bufferDays, excludeBookingId = null) {
  // Eigen nachten + buffer mogen niet overlappen met bezette nachten (incl. buffer) van anderen.
  const taken = await unavailableNights(db, unitId, checkIn, addDays(checkOut, bufferDays), { excludeBookingId });
  return taken.length === 0;
}
