// Systeeminstellingen: standaardwaarden in code, aanpassingen in de database (tabel settings).
export const DEFAULT_SETTINGS = {
  booking_enabled: true,
  require_approval: true,          // aanvragen eerst goedkeuren (status Nieuw -> Bevestigd)
  min_nights: 2,
  max_nights: 28,
  booking_window_days: 365,        // maximaal zo ver vooruit boeken
  min_lead_days: 1,                // minimaal aantal dagen tussen vandaag en aankomst
  arrival_weekdays: [0, 1, 2, 3, 4, 5, 6],
  departure_weekdays: [0, 1, 2, 3, 4, 5, 6],
  buffer_days: 0,                  // vrije dagen na vertrek (schoonmaak)
  check_in_from: '14:00',
  check_in_until: '22:00',
  check_out_from: '09:00',
  check_out_until: '11:00',
  cleaning_fee_cents: 0,
  tourist_tax_cents_pppn: 0,       // toeristenbelasting per persoon per nacht
  free_cancellation_days: 7,
  cancellation_policy: {
    nl: 'Gratis annuleren tot 7 dagen voor aankomst. Bij latere annulering neemt u contact met ons op.',
    en: 'Free cancellation up to 7 days before arrival. For later cancellations, please contact us.',
    de: 'Kostenlose Stornierung bis 7 Tage vor Anreise. Bei späterer Stornierung kontaktieren Sie uns bitte.',
    fr: "Annulation gratuite jusqu'à 7 jours avant l'arrivée. Pour une annulation plus tardive, veuillez nous contacter.",
  },
  reminder1_enabled: true,
  reminder1_hours_before: 24,
  reminder2_enabled: false,
  reminder2_hours_before: 168,
  auto_complete: true,             // bevestigde boekingen na vertrek automatisch op Afgerond
  retention_months: 24,            // persoonsgegevens anonimiseren zoveel maanden na vertrek
  max_open_requests_per_email: 3,
  admin_notify_email: 'jamb.lamberts@ziggo.nl',
  property_name: 'InnVenlo Apartments',
  property_address: 'Helbeek 25, 5911 CV Venlo',
  property_phone: '+31 6 48742693',
  ical_sync_minutes: 30,
};

// Validatie per sleutel: [type, extra controle]
const RULES = {
  booking_enabled: 'bool', require_approval: 'bool', reminder1_enabled: 'bool', reminder2_enabled: 'bool', auto_complete: 'bool',
  min_nights: [1, 365], max_nights: [1, 365], booking_window_days: [1, 1095], min_lead_days: [0, 365],
  buffer_days: [0, 14], cleaning_fee_cents: [0, 1000000], tourist_tax_cents_pppn: [0, 100000],
  free_cancellation_days: [0, 365], reminder1_hours_before: [1, 720], reminder2_hours_before: [1, 2160],
  retention_months: [1, 120], max_open_requests_per_email: [1, 50], ical_sync_minutes: [10, 1440],
  check_in_from: 'time', check_in_until: 'time', check_out_from: 'time', check_out_until: 'time',
  arrival_weekdays: 'weekdays', departure_weekdays: 'weekdays',
  cancellation_policy: 'i18n',
  admin_notify_email: 'email', property_name: 'text', property_address: 'text', property_phone: 'text',
};

export function validateSetting(key, value) {
  const rule = RULES[key];
  if (!rule) return `Onbekende instelling: ${key}`;
  if (rule === 'bool') return typeof value === 'boolean' ? null : `${key}: ja/nee verwacht`;
  if (Array.isArray(rule)) return Number.isInteger(value) && value >= rule[0] && value <= rule[1] ? null : `${key}: geheel getal ${rule[0]}–${rule[1]} verwacht`;
  if (rule === 'time') return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? null : `${key}: tijd UU:MM verwacht`;
  if (rule === 'weekdays') return Array.isArray(value) && value.length > 0 && value.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) ? null : `${key}: minstens één weekdag`;
  if (rule === 'i18n') return value && typeof value === 'object' && ['nl', 'en', 'de', 'fr'].every((l) => typeof value[l] === 'string' && value[l].length <= 2000) ? null : `${key}: tekst per taal verwacht`;
  if (rule === 'email') return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : `${key}: geldig e-mailadres verwacht`;
  if (rule === 'text') return typeof value === 'string' && value.length <= 300 ? null : `${key}: tekst verwacht`;
  return null;
}

export async function getSettings(db) {
  const { rows } = await db.query('SELECT key, value FROM settings');
  const s = structuredClone(DEFAULT_SETTINGS);
  for (const r of rows) if (r.key in s) s[r.key] = r.value;
  return s;
}

export async function saveSettings(db, patch) {
  const errors = [];
  for (const [k, v] of Object.entries(patch)) {
    const e = validateSetting(k, v);
    if (e) errors.push(e);
  }
  const merged = { ...(await getSettings(db)), ...patch };
  if (merged.min_nights > merged.max_nights) errors.push('Minimum aantal nachten is groter dan het maximum');
  if (errors.length) return { errors };
  for (const [k, v] of Object.entries(patch)) {
    await db.query(
      'INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, now()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()',
      [k, JSON.stringify(v)],
    );
  }
  return { settings: merged };
}
