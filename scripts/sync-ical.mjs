// Haalt de iCal-feeds van Airbnb/Booking.com op en schrijft alleen de bezette
// datumbereiken naar data/bezetting.json. Draait in GitHub Actions (geen CORS,
// iCal-URL's blijven geheim in repository secrets).
//
// Secret ICAL_FEEDS (JSON), bijvoorbeeld:
// {"one-bedroom":["https://www.airbnb.nl/calendar/ical/...ics","https://ical.booking.com/v1/export?t=..."],
//  "deluxe":["https://www.airbnb.nl/calendar/ical/...ics"]}
import { writeFile, mkdir } from "node:fs/promises";

const feeds = JSON.parse(process.env.ICAL_FEEDS || "{}");
if (!Object.keys(feeds).length) throw new Error("ICAL_FEEDS secret ontbreekt of is leeg");

const toIso = (v) => `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
const today = new Date().toISOString().slice(0, 10);

function parseIcs(text) {
  const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/); // unfold
  const events = [];
  let ev = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") ev = {};
    else if (line === "END:VEVENT") { if (ev?.start && ev?.end) events.push(ev); ev = null; }
    else if (ev) {
      const m = line.match(/^(DTSTART|DTEND)[^:]*:(\d{8})/);
      if (m) ev[m[1] === "DTSTART" ? "start" : "end"] = toIso(m[2]);
    }
  }
  return events; // end = vertrekdag (exclusief), conform iCal
}

function merge(ranges) {
  const sorted = ranges.filter((r) => r.end > today && r.end > r.start)
    .sort((a, b) => a.start.localeCompare(b.start));
  const out = [];
  for (const r of sorted) {
    const last = out.at(-1);
    if (last && r.start <= last.end) { if (r.end > last.end) last.end = r.end; }
    else out.push({ start: r.start, end: r.end });
  }
  return out;
}

const result = { updated: new Date().toISOString(), apartments: {} };
for (const [id, urls] of Object.entries(feeds)) {
  const all = [];
  for (const url of [].concat(urls)) {
    const res = await fetch(url, { headers: { "User-Agent": "calendar-sync/1.0" } });
    if (!res.ok) throw new Error(`Feed voor "${id}" gaf HTTP ${res.status}`); // oude data blijft staan
    const text = await res.text();
    if (!text.includes("BEGIN:VCALENDAR")) throw new Error(`Feed voor "${id}" is geen iCal`);
    all.push(...parseIcs(text));
  }
  result.apartments[id] = merge(all);
}

await mkdir("data", { recursive: true });
await writeFile("data/bezetting.json", JSON.stringify(result, null, 2) + "\n");
console.log("Bijgewerkt:", Object.fromEntries(Object.entries(result.apartments).map(([k, v]) => [k, v.length])));
