// E-mailteksten voor gasten (NL/EN/DE/FR) en meldingen voor de beheerder (NL).
export const LANGS = ['nl', 'en', 'de', 'fr'];
const LOCALE = { nl: 'nl-NL', en: 'en-GB', de: 'de-DE', fr: 'fr-FR' };

const T = {
  nl: {
    hello: (n) => `Beste ${n},`,
    request_received: { subject: (r) => `Uw boekingsaanvraag ${r} is ontvangen`, intro: 'Bedankt voor uw aanvraag. Wij controleren deze zo snel mogelijk en sturen u daarna een bevestiging. Uw aanvraag is pas definitief na onze bevestiging.' },
    confirmed: { subject: (r) => `Bevestiging van uw boeking ${r}`, intro: 'Goed nieuws: uw boeking is bevestigd. Wij kijken ernaar uit u te verwelkomen.' },
    updated: { subject: (r) => `Uw boeking ${r} is gewijzigd`, intro: 'Uw boeking is gewijzigd. Hieronder vindt u de actuele gegevens.' },
    cancelled: { subject: (r) => `Annulering van boeking ${r}`, intro: 'Uw boeking is geannuleerd. Hieronder vindt u de gegevens van de geannuleerde boeking.' },
    declined: { subject: (r) => `Uw boekingsaanvraag ${r}`, intro: 'Helaas kunnen wij uw aanvraag niet bevestigen. Neem gerust contact met ons op voor andere data.' },
    reminder: { subject: (r) => `Tot binnenkort! Uw verblijf (${r})`, intro: 'Wij zien u binnenkort graag. Hierbij nog even de gegevens van uw verblijf.' },
    labels: { ref: 'Boekingsnummer', unit: 'Appartement', arrival: 'Aankomst', departure: 'Vertrek', nights: 'Nachten', guests: 'Gasten', total: 'Totaalprijs', from: 'vanaf', until: 'tot', manage: 'Uw boeking bekijken of annuleren', policy: 'Annuleringsvoorwaarden', remarks: 'Uw opmerkingen', status: 'Status', pending: 'Aanvraag – wacht op bevestiging', reason: 'Toelichting' },
    outro: 'Met vriendelijke groet,',
    contact: 'Vragen? Beantwoord deze e-mail of bel',
  },
  en: {
    hello: (n) => `Dear ${n},`,
    request_received: { subject: (r) => `We have received your booking request ${r}`, intro: 'Thank you for your request. We will review it as soon as possible and send you a confirmation. Your request is only final once we have confirmed it.' },
    confirmed: { subject: (r) => `Confirmation of your booking ${r}`, intro: 'Good news: your booking is confirmed. We look forward to welcoming you.' },
    updated: { subject: (r) => `Your booking ${r} has been changed`, intro: 'Your booking has been changed. Please find the current details below.' },
    cancelled: { subject: (r) => `Cancellation of booking ${r}`, intro: 'Your booking has been cancelled. Below are the details of the cancelled booking.' },
    declined: { subject: (r) => `Your booking request ${r}`, intro: 'Unfortunately we are unable to confirm your request. Feel free to contact us about other dates.' },
    reminder: { subject: (r) => `See you soon! Your stay (${r})`, intro: 'We look forward to seeing you soon. Here are the details of your stay once more.' },
    labels: { ref: 'Booking number', unit: 'Apartment', arrival: 'Arrival', departure: 'Departure', nights: 'Nights', guests: 'Guests', total: 'Total price', from: 'from', until: 'until', manage: 'View or cancel your booking', policy: 'Cancellation policy', remarks: 'Your remarks', status: 'Status', pending: 'Request – awaiting confirmation', reason: 'Note' },
    outro: 'Kind regards,',
    contact: 'Questions? Reply to this e-mail or call',
  },
  de: {
    hello: (n) => `Guten Tag ${n},`,
    request_received: { subject: (r) => `Ihre Buchungsanfrage ${r} ist eingegangen`, intro: 'Vielen Dank für Ihre Anfrage. Wir prüfen sie so schnell wie möglich und senden Ihnen anschließend eine Bestätigung. Ihre Anfrage ist erst nach unserer Bestätigung verbindlich.' },
    confirmed: { subject: (r) => `Bestätigung Ihrer Buchung ${r}`, intro: 'Gute Nachricht: Ihre Buchung ist bestätigt. Wir freuen uns auf Ihren Besuch.' },
    updated: { subject: (r) => `Ihre Buchung ${r} wurde geändert`, intro: 'Ihre Buchung wurde geändert. Unten finden Sie die aktuellen Angaben.' },
    cancelled: { subject: (r) => `Stornierung der Buchung ${r}`, intro: 'Ihre Buchung wurde storniert. Unten finden Sie die Angaben der stornierten Buchung.' },
    declined: { subject: (r) => `Ihre Buchungsanfrage ${r}`, intro: 'Leider können wir Ihre Anfrage nicht bestätigen. Kontaktieren Sie uns gerne für andere Termine.' },
    reminder: { subject: (r) => `Bis bald! Ihr Aufenthalt (${r})`, intro: 'Wir freuen uns, Sie bald begrüßen zu dürfen. Hier noch einmal die Angaben zu Ihrem Aufenthalt.' },
    labels: { ref: 'Buchungsnummer', unit: 'Apartment', arrival: 'Anreise', departure: 'Abreise', nights: 'Nächte', guests: 'Gäste', total: 'Gesamtpreis', from: 'ab', until: 'bis', manage: 'Buchung ansehen oder stornieren', policy: 'Stornierungsbedingungen', remarks: 'Ihre Anmerkungen', status: 'Status', pending: 'Anfrage – wartet auf Bestätigung', reason: 'Hinweis' },
    outro: 'Mit freundlichen Grüßen,',
    contact: 'Fragen? Antworten Sie auf diese E-Mail oder rufen Sie an:',
  },
  fr: {
    hello: (n) => `Bonjour ${n},`,
    request_received: { subject: (r) => `Votre demande de réservation ${r} a bien été reçue`, intro: 'Merci pour votre demande. Nous la vérifions au plus vite et vous enverrons ensuite une confirmation. Votre demande ne devient définitive qu’après notre confirmation.' },
    confirmed: { subject: (r) => `Confirmation de votre réservation ${r}`, intro: 'Bonne nouvelle : votre réservation est confirmée. Nous avons hâte de vous accueillir.' },
    updated: { subject: (r) => `Votre réservation ${r} a été modifiée`, intro: 'Votre réservation a été modifiée. Vous trouverez ci-dessous les informations à jour.' },
    cancelled: { subject: (r) => `Annulation de la réservation ${r}`, intro: 'Votre réservation a été annulée. Vous trouverez ci-dessous les détails de la réservation annulée.' },
    declined: { subject: (r) => `Votre demande de réservation ${r}`, intro: 'Malheureusement, nous ne pouvons pas confirmer votre demande. N’hésitez pas à nous contacter pour d’autres dates.' },
    reminder: { subject: (r) => `À bientôt ! Votre séjour (${r})`, intro: 'Nous nous réjouissons de vous accueillir bientôt. Voici à nouveau les détails de votre séjour.' },
    labels: { ref: 'Numéro de réservation', unit: 'Appartement', arrival: 'Arrivée', departure: 'Départ', nights: 'Nuits', guests: 'Personnes', total: 'Prix total', from: 'à partir de', until: 'jusqu’à', manage: 'Voir ou annuler votre réservation', policy: 'Conditions d’annulation', remarks: 'Vos remarques', status: 'Statut', pending: 'Demande – en attente de confirmation', reason: 'Remarque' },
    outro: 'Cordialement,',
    contact: 'Des questions ? Répondez à cet e-mail ou appelez le',
  },
};

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function fmtDate(d, lang = 'nl') {
  return new Intl.DateTimeFormat(LOCALE[lang] || 'nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T00:00:00Z'));
}
export function fmtMoney(cents, lang = 'nl') {
  return new Intl.NumberFormat(LOCALE[lang] || 'nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function layout(title, innerHtml) {
  return `<!doctype html><html><body style="margin:0;background:#f3efe7;font-family:Helvetica,Arial,sans-serif;color:#13201c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe7;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff">
<tr><td style="background:#0f3d36;color:#f3efe7;padding:22px 28px;font-family:Georgia,serif;font-size:24px">InnVenlo <i style="opacity:.75">Apartments</i></td></tr>
<tr><td style="padding:28px;font-size:16px;line-height:1.6">${innerHtml}</td></tr>
<tr><td style="padding:16px 28px;background:#13201c;color:#f3efe7b3;font-size:12px">${esc(title)}</td></tr>
</table></td></tr></table></body></html>`;
}

function detailRows(lang, b, settings) {
  const L = T[lang].labels;
  const rows = [
    [L.ref, b.reference],
    [L.unit, b.unit_name],
    [L.arrival, `${fmtDate(b.check_in, lang)}, ${L.from} ${settings.check_in_from}`],
    [L.departure, `${fmtDate(b.check_out, lang)}, ${L.until} ${settings.check_out_until}`],
    [L.nights, String(b.nights)],
    [L.guests, String(b.guests_count)],
    [L.total, fmtMoney(b.total_cents, lang)],
  ];
  if (b.status === 'new') rows.push([L.status, L.pending]);
  if (b.remarks) rows.push([L.remarks, b.remarks]);
  return rows;
}

// Bouwt een gastmail. kind: request_received | confirmed | updated | cancelled | declined | reminder
export function guestMail(kind, b, settings, { manageUrl, reason } = {}) {
  const lang = T[b.language] ? b.language : 'nl';
  const t = T[lang];
  const L = t.labels;
  const rows = detailRows(lang, b, settings);
  const policy = (settings.cancellation_policy && settings.cancellation_policy[lang]) || '';
  const showManage = manageUrl && !['cancelled', 'declined'].includes(kind);
  const showPolicy = policy && !['cancelled', 'declined'].includes(kind);
  const name = b.first_name || '';

  const text = [
    t.hello(name), '', t[kind].intro, '',
    ...(reason ? [`${L.reason}: ${reason}`, ''] : []),
    ...rows.map(([k, v]) => `${k}: ${v}`), '',
    ...(showManage ? [`${L.manage}: ${manageUrl}`, ''] : []),
    ...(showPolicy ? [`${L.policy}: ${policy}`, ''] : []),
    `${t.contact} ${settings.property_phone}.`, '',
    t.outro, settings.property_name, settings.property_address,
  ].join('\n');

  const html = layout(settings.property_name, `
<p>${esc(t.hello(name))}</p><p>${esc(t[kind].intro)}</p>
${reason ? `<p><strong>${esc(L.reason)}:</strong> ${esc(reason)}</p>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;border-top:1px solid #13201c26">
${rows.map(([k, v]) => `<tr><td style="padding:9px 0;border-bottom:1px solid #13201c26;color:#5d6a65;font-size:13px;text-transform:uppercase;letter-spacing:.08em;width:42%">${esc(k)}</td><td style="padding:9px 0;border-bottom:1px solid #13201c26">${esc(v)}</td></tr>`).join('')}
</table>
${showManage ? `<p><a href="${esc(manageUrl)}" style="display:inline-block;background:#13201c;color:#f3efe7;padding:12px 18px;text-decoration:none;font-size:13px;letter-spacing:.1em;text-transform:uppercase">${esc(L.manage)}</a></p>` : ''}
${showPolicy ? `<p style="font-size:14px;color:#5d6a65"><strong>${esc(L.policy)}:</strong> ${esc(policy)}</p>` : ''}
<p style="font-size:14px;color:#5d6a65">${esc(t.contact)} ${esc(settings.property_phone)}.</p>
<p>${esc(t.outro)}<br>${esc(settings.property_name)}<br>${esc(settings.property_address)}</p>`);

  return { subject: t[kind].subject(b.reference), text, html };
}

// Melding voor de beheerder (Nederlands)
export function adminMail(kind, b, settings, { adminUrl, extra } = {}) {
  const titles = {
    admin_new_request: `Nieuwe boekingsaanvraag ${b?.reference} – actie nodig`,
    admin_guest_cancelled: `Gast heeft boeking ${b?.reference} geannuleerd`,
    admin_ical_conflict: `Let op: mogelijke dubbele boeking (${extra?.unitName})`,
    admin_test: 'Testmail van het InnVenlo-boekingssysteem',
  };
  const lines = [];
  if (b) {
    lines.push(
      ['Boekingsnummer', b.reference], ['Appartement', b.unit_name],
      ['Aankomst', fmtDate(b.check_in, 'nl')], ['Vertrek', fmtDate(b.check_out, 'nl')],
      ['Nachten', String(b.nights)], ['Gasten', String(b.guests_count)], ['Totaal', fmtMoney(b.total_cents, 'nl')],
      ['Naam', `${b.first_name || ''} ${b.last_name || ''}`.trim()], ['E-mail', b.email || ''], ['Telefoon', b.phone || ''],
      ['Taal', b.language], ['Opmerkingen', b.remarks || '–'],
    );
  }
  const intro = {
    admin_new_request: 'Er is een nieuwe boekingsaanvraag binnengekomen. De data zijn voorlopig vastgehouden. Bevestig of wijs de aanvraag af in het beheerdashboard.',
    admin_guest_cancelled: 'De gast heeft de boeking zelf geannuleerd via de beheerlink. De data zijn weer vrijgegeven.',
    admin_ical_conflict: extra?.message || '',
    admin_test: 'Als u deze e-mail ontvangt, werkt de e-mailinstelling van het boekingssysteem.',
  }[kind];
  const text = [intro, '', ...lines.map(([k, v]) => `${k}: ${v}`), '', adminUrl ? `Beheer: ${adminUrl}` : ''].join('\n');
  const html = layout('Beheerdersmelding', `<p>${esc(intro)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0">${lines.map(([k, v]) => `<tr><td style="padding:6px 0;color:#5d6a65;width:38%">${esc(k)}</td><td style="padding:6px 0">${esc(v)}</td></tr>`).join('')}</table>
${adminUrl ? `<p><a href="${esc(adminUrl)}" style="color:#b2552d">Openen in het beheerdashboard</a></p>` : ''}`);
  return { subject: titles[kind], text, html };
}
