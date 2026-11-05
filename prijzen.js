// ============================================================
//  VANAF-PRIJZEN – pas alleen de bedragen hieronder aan.
//  Euro per nacht, zonder €-teken. De hele website past zich aan.
// ============================================================
window.INNVENLO_PRIJZEN = {
  'one-bedroom': 90,
  'deluxe': 90
};

// ---- Hieronder niets aanpassen ----
(() => {
  'use strict';
  const LOC = { nl: 'nl-NL', en: 'en-GB', de: 'de-DE', fr: 'fr-FR' };
  const TXT = {
    nl: (p) => `vanaf ${p} per nacht`, en: (p) => `from ${p} per night`,
    de: (p) => `ab ${p} pro Nacht`, fr: (p) => `à partir de ${p} par nuit`
  };
  const TOTAL = {
    nl: (n, p) => `vanaf ${p} voor ${n} ${n === 1 ? 'nacht' : 'nachten'} · exacte prijs in de bevestiging`,
    en: (n, p) => `from ${p} for ${n} ${n === 1 ? 'night' : 'nights'} · exact price in the confirmation`,
    de: (n, p) => `ab ${p} für ${n} ${n === 1 ? 'Nacht' : 'Nächte'} · genauer Preis in der Bestätigung`,
    fr: (n, p) => `à partir de ${p} pour ${n} ${n === 1 ? 'nuit' : 'nuits'} · prix exact dans la confirmation`
  };
  const lang = () => { const l = (document.documentElement.lang || 'nl').slice(0, 2); return TXT[l] ? l : 'nl'; };
  const eur = (v) => new Intl.NumberFormat(LOC[lang()], { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
  window.innVenloVanaf = (apt) => { const v = window.INNVENLO_PRIJZEN[apt]; return v ? TXT[lang()](eur(v)) : ''; };
  window.innVenloTotaal = (apt, nights) => { const v = window.INNVENLO_PRIJZEN[apt]; return v && nights > 0 ? TOTAL[lang()](nights, eur(v * nights)) : ''; };
  const KORT = { nl: (p) => `v.a. ${p} p.n.`, en: (p) => `from ${p}/night`, de: (p) => `ab ${p}/Nacht`, fr: (p) => `dès ${p}/nuit` };
  window.innVenloKort = (apt) => { const v = window.INNVENLO_PRIJZEN[apt]; return v ? KORT[lang()](eur(v)) : ''; };
  const fill = () => {
    document.querySelectorAll('[data-vanaf]').forEach((el) => { el.textContent = window.innVenloVanaf(el.dataset.vanaf); });
    document.querySelectorAll('[data-vanaf-kort]').forEach((el) => { el.textContent = window.innVenloKort(el.dataset.vanafKort); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill); else fill();
  document.addEventListener('langchange', fill);
})();
