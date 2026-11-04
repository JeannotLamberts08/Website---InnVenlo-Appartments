// Hulpfuncties voor kalenderdatums ('YYYY-MM-DD'), altijd in UTC gerekend zodat zomertijd geen rol speelt.
const RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDate(s) {
  if (typeof s !== 'string' || !RE.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
export function addDays(s, n) {
  const d = new Date(s + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function diffDays(a, b) {
  return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000);
}
// 0 = zondag ... 6 = zaterdag
export function weekday(s) {
  return new Date(s + 'T00:00:00Z').getUTCDay();
}
export function todayIn(tz = 'Europe/Amsterdam', now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function* nights(checkIn, checkOut) {
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) yield d;
}
