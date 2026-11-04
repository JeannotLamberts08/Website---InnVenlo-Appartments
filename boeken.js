/* InnVenlo – boekingsmodule (geen externe afhankelijkheden). Praat uitsluitend met de eigen boekingsserver. */
(() => {
  'use strict';
  const metaApi = document.querySelector('meta[name="booking-api"]')?.content || '';
  const API = ['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:3100' : metaApi.replace(/\/$/, '');

  // ---------- Vertalingen ----------
  const I18N = {
    nl: {
      navHome: 'Home', navApartments: 'Appartementen', navBook: 'Boeken', navContact: 'Contact',
      title: 'Direct boeken', intro: 'Kies uw appartement en uw data. U boekt rechtstreeks bij ons, zonder tussenpersoon. Wij bevestigen uw aanvraag zo snel mogelijk per e-mail.',
      chooseUnit: '1. Kies uw appartement', loading: 'Beschikbaarheid laden…', guests: 'Aantal gasten', guest1: 'gast', guestN: 'gasten',
      chooseDates: '2. Kies aankomst en vertrek', legendFree: 'Beschikbaar', legendBusy: 'Bezet', legendSel: 'Uw keuze',
      back: '← Terug naar data', yourDetails: '3. Uw gegevens', firstName: 'Voornaam', lastName: 'Achternaam', email: 'E-mailadres', phone: 'Telefoonnummer',
      remarks: 'Opmerkingen (optioneel)', consent: 'Ik ga akkoord met de annuleringsvoorwaarden en met het verwerken van mijn gegevens voor deze boeking.',
      privacy: 'Wij gebruiken uw gegevens uitsluitend voor uw verblijf en bewaren ze niet langer dan nodig.', submit: 'Boekingsaanvraag versturen',
      offline: 'Online boeken is op dit moment niet beschikbaar. U kunt boeken via Booking.com of Airbnb, of neem contact met ons op.',
      perNight: 'per nacht', maxGuests: (n) => `max. ${n} gasten`, from: 'vanaf', until: 'tot',
      pickArrival: 'Kies uw aankomstdatum.', pickDeparture: (n) => `Kies uw vertrekdatum (minimaal ${n} nachten).`, selected: (n) => `${n} ${n === 1 ? 'nacht' : 'nachten'} geselecteerd.`,
      notDeparture: (n) => `Deze vertrekdatum is niet mogelijk. Minimaal ${n} nachten en geen bezette nachten tussendoor.`,
      summary: 'Uw verblijf', unit: 'Appartement', arrival: 'Aankomst', departure: 'Vertrek', nights: 'Nachten', total: 'Totaal', cleaning: 'Schoonmaakkosten', tax: 'Toeristenbelasting',
      noDates: 'Selecteer uw data in de kalender.', next: 'Verder naar uw gegevens', policy: 'Annuleringsvoorwaarden', approval: 'U ontvangt eerst een bevestiging van ons; pas daarna is uw boeking definitief.',
      checking: 'Beschikbaarheid controleren…',
      doneTitle: (n) => `Bedankt${n ? ', ' + n : ''}!`, doneLead: 'Uw boekingsaanvraag is ontvangen. Wij controleren deze zo snel mogelijk en sturen u een bevestiging per e-mail. Uw boeking is definitief na onze bevestiging.',
      doneLeadConfirmed: 'Uw boeking is bevestigd. U ontvangt een bevestiging per e-mail.', reference: 'Boekingsnummer', manageLink: 'Boeking bekijken of annuleren', status: 'Status',
      st_new: 'Aanvraag – wacht op bevestiging', st_confirmed: 'Bevestigd', st_cancelled: 'Geannuleerd', st_completed: 'Afgerond', st_no_show: 'Niet verschenen',
      manageTitle: 'Uw boeking', cancelBtn: 'Boeking annuleren', cancelConfirm: 'Weet u zeker dat u deze boeking wilt annuleren? Dit kan niet ongedaan worden gemaakt.',
      cancelled: 'Uw boeking is geannuleerd. U ontvangt een bevestiging per e-mail.', cannotCancel: (d) => `Online annuleren is mogelijk tot ${d} dagen voor aankomst. Neem voor wijzigingen of annuleren contact met ons op.`,
      changeInfo: 'Wilt u iets wijzigen? Neem contact met ons op via telefoon of e-mail.', manageNotFound: 'Deze boekingslink is ongeldig of verlopen.', newBooking: 'Nieuwe boeking maken',
      err: {
        dates_unavailable: 'Helaas, deze data zijn zojuist door iemand anders geboekt. Kies andere data.', min_nights: 'Het minimum aantal nachten is niet gehaald.', max_nights: 'Het maximum aantal nachten is overschreden.',
        too_soon: 'Deze aankomstdatum is te kort dag.', too_far_ahead: 'Zo ver vooruit kan nog niet geboekt worden.', too_many_guests: 'Te veel gasten voor dit appartement.',
        booking_disabled: 'Online boeken is tijdelijk gesloten.', rate_limited: 'Te veel pogingen. Probeer het over enkele minuten opnieuw.', too_many_requests: 'U heeft al meerdere openstaande aanvragen. Neem contact met ons op.',
        validation: 'Controleer de ingevulde gegevens.', spam_suspected: 'Uw aanvraag kon niet worden verwerkt. Probeer het opnieuw.', network: 'Geen verbinding met de boekingsserver. Probeer het opnieuw.',
        arrival_day_not_allowed: 'Aankomst is op deze dag niet mogelijk.', departure_day_not_allowed: 'Vertrek is op deze dag niet mogelijk.', forbidden: 'Online annuleren is niet meer mogelijk; neem contact op.',
        fields: 'Vul alle verplichte velden correct in.', consent: 'Ga akkoord met de voorwaarden om verder te gaan.', default: 'Er ging iets mis. Probeer het opnieuw.',
      },
    },
    en: {
      navHome: 'Home', navApartments: 'Apartments', navBook: 'Book', navContact: 'Contact',
      title: 'Book direct', intro: 'Choose your apartment and dates. You book directly with us, without intermediaries. We will confirm your request by e-mail as soon as possible.',
      chooseUnit: '1. Choose your apartment', loading: 'Loading availability…', guests: 'Number of guests', guest1: 'guest', guestN: 'guests',
      chooseDates: '2. Choose arrival and departure', legendFree: 'Available', legendBusy: 'Booked', legendSel: 'Your selection',
      back: '← Back to dates', yourDetails: '3. Your details', firstName: 'First name', lastName: 'Last name', email: 'E-mail address', phone: 'Phone number',
      remarks: 'Remarks (optional)', consent: 'I agree to the cancellation policy and to the processing of my data for this booking.',
      privacy: 'We only use your data for your stay and do not keep it longer than necessary.', submit: 'Send booking request',
      offline: 'Online booking is currently unavailable. You can book via Booking.com or Airbnb, or contact us.',
      perNight: 'per night', maxGuests: (n) => `max. ${n} guests`, from: 'from', until: 'until',
      pickArrival: 'Choose your arrival date.', pickDeparture: (n) => `Choose your departure date (minimum ${n} nights).`, selected: (n) => `${n} ${n === 1 ? 'night' : 'nights'} selected.`,
      notDeparture: (n) => `This departure date is not possible. Minimum ${n} nights and no booked nights in between.`,
      summary: 'Your stay', unit: 'Apartment', arrival: 'Arrival', departure: 'Departure', nights: 'Nights', total: 'Total', cleaning: 'Cleaning fee', tax: 'Tourist tax',
      noDates: 'Select your dates in the calendar.', next: 'Continue to your details', policy: 'Cancellation policy', approval: 'You will first receive a confirmation from us; only then is your booking final.',
      checking: 'Checking availability…',
      doneTitle: (n) => `Thank you${n ? ', ' + n : ''}!`, doneLead: 'Your booking request has been received. We will review it as soon as possible and send you a confirmation by e-mail. Your booking is final after our confirmation.',
      doneLeadConfirmed: 'Your booking is confirmed. You will receive a confirmation by e-mail.', reference: 'Booking number', manageLink: 'View or cancel booking', status: 'Status',
      st_new: 'Request – awaiting confirmation', st_confirmed: 'Confirmed', st_cancelled: 'Cancelled', st_completed: 'Completed', st_no_show: 'No-show',
      manageTitle: 'Your booking', cancelBtn: 'Cancel booking', cancelConfirm: 'Are you sure you want to cancel this booking? This cannot be undone.',
      cancelled: 'Your booking has been cancelled. You will receive a confirmation by e-mail.', cannotCancel: (d) => `Online cancellation is possible up to ${d} days before arrival. Please contact us for changes or cancellations.`,
      changeInfo: 'Want to change something? Please contact us by phone or e-mail.', manageNotFound: 'This booking link is invalid or has expired.', newBooking: 'Make a new booking',
      err: {
        dates_unavailable: 'Sorry, these dates have just been booked by someone else. Please choose other dates.', min_nights: 'The minimum number of nights has not been met.', max_nights: 'The maximum number of nights has been exceeded.',
        too_soon: 'This arrival date is too soon.', too_far_ahead: 'Bookings this far ahead are not yet possible.', too_many_guests: 'Too many guests for this apartment.',
        booking_disabled: 'Online booking is temporarily closed.', rate_limited: 'Too many attempts. Please try again in a few minutes.', too_many_requests: 'You already have several open requests. Please contact us.',
        validation: 'Please check the information entered.', spam_suspected: 'Your request could not be processed. Please try again.', network: 'No connection to the booking server. Please try again.',
        arrival_day_not_allowed: 'Arrival is not possible on this day.', departure_day_not_allowed: 'Departure is not possible on this day.', forbidden: 'Online cancellation is no longer possible; please contact us.',
        fields: 'Please complete all required fields correctly.', consent: 'Please accept the terms to continue.', default: 'Something went wrong. Please try again.',
      },
    },
    de: {
      navHome: 'Home', navApartments: 'Apartments', navBook: 'Buchen', navContact: 'Kontakt',
      title: 'Direkt buchen', intro: 'Wählen Sie Ihr Apartment und Ihre Reisedaten. Sie buchen direkt bei uns, ohne Vermittler. Wir bestätigen Ihre Anfrage so schnell wie möglich per E-Mail.',
      chooseUnit: '1. Apartment wählen', loading: 'Verfügbarkeit wird geladen…', guests: 'Anzahl Gäste', guest1: 'Gast', guestN: 'Gäste',
      chooseDates: '2. Anreise und Abreise wählen', legendFree: 'Verfügbar', legendBusy: 'Belegt', legendSel: 'Ihre Auswahl',
      back: '← Zurück zu den Daten', yourDetails: '3. Ihre Angaben', firstName: 'Vorname', lastName: 'Nachname', email: 'E-Mail-Adresse', phone: 'Telefonnummer',
      remarks: 'Anmerkungen (optional)', consent: 'Ich akzeptiere die Stornierungsbedingungen und die Verarbeitung meiner Daten für diese Buchung.',
      privacy: 'Wir verwenden Ihre Daten ausschließlich für Ihren Aufenthalt und speichern sie nicht länger als nötig.', submit: 'Buchungsanfrage senden',
      offline: 'Online-Buchung ist derzeit nicht verfügbar. Sie können über Booking.com oder Airbnb buchen oder uns kontaktieren.',
      perNight: 'pro Nacht', maxGuests: (n) => `max. ${n} Gäste`, from: 'ab', until: 'bis',
      pickArrival: 'Wählen Sie Ihr Anreisedatum.', pickDeparture: (n) => `Wählen Sie Ihr Abreisedatum (mindestens ${n} Nächte).`, selected: (n) => `${n} ${n === 1 ? 'Nacht' : 'Nächte'} ausgewählt.`,
      notDeparture: (n) => `Dieses Abreisedatum ist nicht möglich. Mindestens ${n} Nächte und keine belegten Nächte dazwischen.`,
      summary: 'Ihr Aufenthalt', unit: 'Apartment', arrival: 'Anreise', departure: 'Abreise', nights: 'Nächte', total: 'Gesamt', cleaning: 'Endreinigung', tax: 'Kurtaxe',
      noDates: 'Wählen Sie Ihre Daten im Kalender.', next: 'Weiter zu Ihren Angaben', policy: 'Stornierungsbedingungen', approval: 'Sie erhalten zuerst eine Bestätigung von uns; erst dann ist Ihre Buchung verbindlich.',
      checking: 'Verfügbarkeit wird geprüft…',
      doneTitle: (n) => `Vielen Dank${n ? ', ' + n : ''}!`, doneLead: 'Ihre Buchungsanfrage ist eingegangen. Wir prüfen sie so schnell wie möglich und senden Ihnen eine Bestätigung per E-Mail. Ihre Buchung ist nach unserer Bestätigung verbindlich.',
      doneLeadConfirmed: 'Ihre Buchung ist bestätigt. Sie erhalten eine Bestätigung per E-Mail.', reference: 'Buchungsnummer', manageLink: 'Buchung ansehen oder stornieren', status: 'Status',
      st_new: 'Anfrage – wartet auf Bestätigung', st_confirmed: 'Bestätigt', st_cancelled: 'Storniert', st_completed: 'Abgeschlossen', st_no_show: 'Nicht erschienen',
      manageTitle: 'Ihre Buchung', cancelBtn: 'Buchung stornieren', cancelConfirm: 'Möchten Sie diese Buchung wirklich stornieren? Dies kann nicht rückgängig gemacht werden.',
      cancelled: 'Ihre Buchung wurde storniert. Sie erhalten eine Bestätigung per E-Mail.', cannotCancel: (d) => `Online-Stornierung ist bis ${d} Tage vor Anreise möglich. Für Änderungen oder Stornierungen kontaktieren Sie uns bitte.`,
      changeInfo: 'Möchten Sie etwas ändern? Kontaktieren Sie uns telefonisch oder per E-Mail.', manageNotFound: 'Dieser Buchungslink ist ungültig oder abgelaufen.', newBooking: 'Neue Buchung',
      err: {
        dates_unavailable: 'Leider wurden diese Daten soeben von jemand anderem gebucht. Bitte wählen Sie andere Daten.', min_nights: 'Die Mindestanzahl an Nächten ist nicht erreicht.', max_nights: 'Die maximale Anzahl an Nächten ist überschritten.',
        too_soon: 'Dieses Anreisedatum ist zu kurzfristig.', too_far_ahead: 'So weit im Voraus kann noch nicht gebucht werden.', too_many_guests: 'Zu viele Gäste für dieses Apartment.',
        booking_disabled: 'Online-Buchung ist vorübergehend geschlossen.', rate_limited: 'Zu viele Versuche. Bitte versuchen Sie es in einigen Minuten erneut.', too_many_requests: 'Sie haben bereits mehrere offene Anfragen. Bitte kontaktieren Sie uns.',
        validation: 'Bitte prüfen Sie Ihre Angaben.', spam_suspected: 'Ihre Anfrage konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.', network: 'Keine Verbindung zum Buchungsserver. Bitte versuchen Sie es erneut.',
        arrival_day_not_allowed: 'Anreise ist an diesem Tag nicht möglich.', departure_day_not_allowed: 'Abreise ist an diesem Tag nicht möglich.', forbidden: 'Online-Stornierung ist nicht mehr möglich; bitte kontaktieren Sie uns.',
        fields: 'Bitte füllen Sie alle Pflichtfelder korrekt aus.', consent: 'Bitte akzeptieren Sie die Bedingungen, um fortzufahren.', default: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
      },
    },
    fr: {
      navHome: 'Accueil', navApartments: 'Appartements', navBook: 'Réserver', navContact: 'Contact',
      title: 'Réserver en direct', intro: 'Choisissez votre appartement et vos dates. Vous réservez directement chez nous, sans intermédiaire. Nous confirmons votre demande par e-mail dans les plus brefs délais.',
      chooseUnit: '1. Choisissez votre appartement', loading: 'Chargement des disponibilités…', guests: 'Nombre de personnes', guest1: 'personne', guestN: 'personnes',
      chooseDates: '2. Choisissez l’arrivée et le départ', legendFree: 'Disponible', legendBusy: 'Occupé', legendSel: 'Votre choix',
      back: '← Retour aux dates', yourDetails: '3. Vos coordonnées', firstName: 'Prénom', lastName: 'Nom', email: 'Adresse e-mail', phone: 'Téléphone',
      remarks: 'Remarques (facultatif)', consent: 'J’accepte les conditions d’annulation et le traitement de mes données pour cette réservation.',
      privacy: 'Nous utilisons vos données uniquement pour votre séjour et ne les conservons pas plus longtemps que nécessaire.', submit: 'Envoyer la demande',
      offline: 'La réservation en ligne est actuellement indisponible. Vous pouvez réserver via Booking.com ou Airbnb, ou nous contacter.',
      perNight: 'par nuit', maxGuests: (n) => `max. ${n} personnes`, from: 'à partir de', until: 'jusqu’à',
      pickArrival: 'Choisissez votre date d’arrivée.', pickDeparture: (n) => `Choisissez votre date de départ (minimum ${n} nuits).`, selected: (n) => `${n} ${n === 1 ? 'nuit' : 'nuits'} sélectionnée(s).`,
      notDeparture: (n) => `Cette date de départ n’est pas possible. Minimum ${n} nuits et aucune nuit occupée entre les deux.`,
      summary: 'Votre séjour', unit: 'Appartement', arrival: 'Arrivée', departure: 'Départ', nights: 'Nuits', total: 'Total', cleaning: 'Frais de ménage', tax: 'Taxe de séjour',
      noDates: 'Sélectionnez vos dates dans le calendrier.', next: 'Continuer', policy: 'Conditions d’annulation', approval: 'Vous recevrez d’abord une confirmation de notre part ; votre réservation devient alors définitive.',
      checking: 'Vérification des disponibilités…',
      doneTitle: (n) => `Merci${n ? ', ' + n : ''} !`, doneLead: 'Votre demande de réservation a bien été reçue. Nous la vérifions au plus vite et vous enverrons une confirmation par e-mail. Votre réservation est définitive après notre confirmation.',
      doneLeadConfirmed: 'Votre réservation est confirmée. Vous recevrez une confirmation par e-mail.', reference: 'Numéro de réservation', manageLink: 'Voir ou annuler la réservation', status: 'Statut',
      st_new: 'Demande – en attente de confirmation', st_confirmed: 'Confirmée', st_cancelled: 'Annulée', st_completed: 'Terminée', st_no_show: 'Non présenté',
      manageTitle: 'Votre réservation', cancelBtn: 'Annuler la réservation', cancelConfirm: 'Voulez-vous vraiment annuler cette réservation ? Cette action est irréversible.',
      cancelled: 'Votre réservation a été annulée. Vous recevrez une confirmation par e-mail.', cannotCancel: (d) => `L’annulation en ligne est possible jusqu’à ${d} jours avant l’arrivée. Contactez-nous pour toute modification ou annulation.`,
      changeInfo: 'Vous souhaitez modifier quelque chose ? Contactez-nous par téléphone ou e-mail.', manageNotFound: 'Ce lien de réservation est invalide ou a expiré.', newBooking: 'Nouvelle réservation',
      err: {
        dates_unavailable: 'Désolé, ces dates viennent d’être réservées. Veuillez choisir d’autres dates.', min_nights: 'Le nombre minimum de nuits n’est pas atteint.', max_nights: 'Le nombre maximum de nuits est dépassé.',
        too_soon: 'Cette date d’arrivée est trop proche.', too_far_ahead: 'Il n’est pas encore possible de réserver aussi loin.', too_many_guests: 'Trop de personnes pour cet appartement.',
        booking_disabled: 'La réservation en ligne est temporairement fermée.', rate_limited: 'Trop de tentatives. Réessayez dans quelques minutes.', too_many_requests: 'Vous avez déjà plusieurs demandes en cours. Contactez-nous.',
        validation: 'Veuillez vérifier les informations saisies.', spam_suspected: 'Votre demande n’a pas pu être traitée. Réessayez.', network: 'Pas de connexion au serveur de réservation. Réessayez.',
        arrival_day_not_allowed: 'Arrivée impossible ce jour-là.', departure_day_not_allowed: 'Départ impossible ce jour-là.', forbidden: 'L’annulation en ligne n’est plus possible ; contactez-nous.',
        fields: 'Veuillez remplir correctement tous les champs obligatoires.', consent: 'Veuillez accepter les conditions pour continuer.', default: 'Une erreur s’est produite. Réessayez.',
      },
    },
  };
  const LOCALE = { nl: 'nl-NL', en: 'en-GB', de: 'de-DE', fr: 'fr-FR' };

  // ---------- Hulpfuncties ----------
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const addDays = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const diffDays = (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000);
  const weekday = (s) => new Date(s + 'T00:00:00Z').getUTCDay();
  const monthStart = (s) => s.slice(0, 8) + '01';
  const addMonths = (s, n) => { const d = new Date(monthStart(s) + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); };

  let lang = (() => { try { const l = localStorage.getItem('lang'); if (I18N[l]) return l; } catch {} const n = (navigator.language || 'nl').slice(0, 2); return I18N[n] ? n : 'nl'; })();
  const t = (k, ...a) => { const v = I18N[lang][k] ?? I18N.nl[k]; return typeof v === 'function' ? v(...a) : v; };
  const errText = (code) => I18N[lang].err[code] || I18N[lang].err.default;
  const fmtDate = (d, opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) => new Intl.DateTimeFormat(LOCALE[lang], { ...opts, timeZone: 'UTC' }).format(new Date(d + 'T00:00:00Z'));
  const money = (c) => new Intl.NumberFormat(LOCALE[lang], { style: 'currency', currency: 'EUR', minimumFractionDigits: c % 100 ? 2 : 0 }).format(c / 100);

  async function api(path, body) {
    let res;
    try {
      res = await fetch(API + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
    } catch { throw Object.assign(new Error('network'), { code: 'network' }); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.message || 'error'), { code: data.error || 'default', status: res.status, data });
    return data;
  }

  // ---------- Status ----------
  const S = { cfg: null, unit: null, guests: 2, view: null, avail: {}, checkIn: null, checkOut: null, quote: null, quoteSeq: 0, formShownAt: 0, months: 2, last: null };

  function show(id) {
    for (const el of document.querySelectorAll('.bk-step')) el.hidden = el.id !== id;
  }
  function globalMsg(text) {
    const el = $('#bk-global');
    el.hidden = !text;
    el.textContent = text || '';
  }

  // ---------- Taal ----------
  function applyLang() {
    document.documentElement.lang = lang;
    $('.current-language').textContent = lang.toUpperCase();
    for (const el of document.querySelectorAll('[data-t]')) { const v = t(el.dataset.t); if (typeof v === 'string') el.textContent = v; }
    for (const b of document.querySelectorAll('.language-dropdown button')) b.classList.toggle('active', b.dataset.lang === lang);
    if (S.cfg) { renderUnits(); renderGuests(); renderCalendar(); renderSummary(); }
    if (S.last) S.last();
  }
  function setupLanguageSwitch() {
    const sw = $('.language-switch');
    const btn = $('.language-current');
    btn.addEventListener('click', () => { const o = sw.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
    document.addEventListener('click', (e) => { if (!sw.contains(e.target)) { sw.classList.remove('open'); btn.setAttribute('aria-expanded', false); } });
    for (const b of document.querySelectorAll('.language-dropdown button')) {
      b.addEventListener('click', () => { lang = b.dataset.lang; try { localStorage.setItem('lang', lang); } catch {} sw.classList.remove('open'); applyLang(); });
    }
  }

  // ---------- Appartement en gasten ----------
  function unitCfg() { return S.cfg.units.find((u) => u.slug === S.unit); }
  function renderUnits() {
    $('#unit-list').innerHTML = S.cfg.units.map((u) => `<label class="bk-unit"><input type="radio" name="unit" value="${esc(u.slug)}"${u.slug === S.unit ? ' checked' : ''}>
      <strong>${esc(u.name)}</strong><span>${money(u.basePriceCents)} ${esc(t('perNight'))} · ${esc(t('maxGuests', u.maxGuests))}</span></label>`).join('');
    for (const r of document.querySelectorAll('input[name=unit]')) r.addEventListener('change', () => selectUnit(r.value));
  }
  function renderGuests() {
    const max = unitCfg()?.maxGuests || 1;
    if (S.guests > max) S.guests = max;
    $('#guests').innerHTML = Array.from({ length: max }, (_, i) => `<option value="${i + 1}"${i + 1 === S.guests ? ' selected' : ''}>${i + 1} ${esc(i ? t('guestN') : t('guest1'))}</option>`).join('');
  }
  async function selectUnit(slug) {
    S.unit = slug;
    renderGuests();
    await loadAvailability();
    // Bestaande selectie behouden als die ook in dit appartement vrij is
    if (S.checkIn && S.checkOut && !rangeOk(S.checkIn, S.checkOut)) { S.checkIn = S.checkOut = null; }
    renderCalendar();
    updateQuote();
  }

  // ---------- Beschikbaarheid ----------
  async function loadAvailability(force = false) {
    if (S.avail[S.unit] && !force) return;
    const from = S.cfg.today;
    const to = addDays(from, Math.min(S.cfg.rules.windowDays + 31, 399));
    $('#cal-hint').textContent = t('loading');
    const data = await api(`/api/public/availability?unit=${encodeURIComponent(S.unit)}&from=${from}&to=${to}`);
    S.avail[S.unit] = { busy: new Set(data.unavailable), rates: data.rates, to };
  }
  const R = () => S.cfg.rules;
  const busy = (d) => S.avail[S.unit]?.busy.has(d);
  const firstArrival = () => addDays(S.cfg.today, R().leadDays);
  const lastArrival = () => addDays(S.cfg.today, R().windowDays);
  function minNightsFor(ci) {
    let m = R().minNights;
    for (const p of S.avail[S.unit]?.rates || []) if (p.minNights != null && p.start <= ci && ci < p.end) m = p.minNights;
    return m;
  }
  function arrivalOk(d) {
    return d >= firstArrival() && d <= lastArrival() && !busy(d) && R().arrivalWeekdays.includes(weekday(d));
  }
  function rangeOk(ci, co) {
    if (!arrivalOk(ci) || co <= ci) return false;
    const n = diffDays(ci, co);
    if (n < minNightsFor(ci) || n > R().maxNights || !R().departureWeekdays.includes(weekday(co))) return false;
    const end = addDays(co, R().bufferDays);
    for (let d = ci; d < end; d = addDays(d, 1)) if (busy(d)) return false;
    return true;
  }

  // ---------- Kalender ----------
  function renderCalendar() {
    if (!S.avail[S.unit]) return;
    S.months = matchMedia('(max-width: 900px)').matches ? 1 : 2;
    const minView = monthStart(S.cfg.today);
    const maxView = monthStart(lastArrival());
    if (!S.view || S.view < minView) S.view = minView;
    if (S.view > maxView) S.view = maxView;
    $('#cal-prev').disabled = S.view <= minView;
    $('#cal-next').disabled = addMonths(S.view, S.months - 1) >= maxView;
    const picking = S.checkIn && !S.checkOut ? 'out' : 'in';
    const dows = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(LOCALE[lang], { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1 + i))));
    let html = '';
    for (let m = 0; m < 2; m++) {
      const first = addMonths(S.view, m);
      const title = new Intl.DateTimeFormat(LOCALE[lang], { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(first + 'T00:00:00Z'));
      const offset = (weekday(first) + 6) % 7; // maandag eerst
      const daysIn = diffDays(first, addMonths(first, 1));
      let cells = dows.map((d) => `<span class="bk-dow">${esc(d)}</span>`).join('');
      for (let i = 0; i < offset; i++) cells += '<span class="bk-day out"></span>';
      for (let i = 0; i < daysIn; i++) {
        const d = addDays(first, i);
        const cls = ['bk-day'];
        let enabled;
        if (d < S.cfg.today) cls.push('past');
        else if (busy(d)) cls.push('busy');
        if (d === S.cfg.today) cls.push('today');
        if (picking === 'out') {
          enabled = d > S.checkIn ? rangeOk(S.checkIn, d) : arrivalOk(d);
          if (enabled && busy(d)) cls.push('co-ok');
          if (!enabled && d > S.checkIn) enabled = arrivalOk(d) || !busy(d); // laat klikken toe voor uitleg of nieuwe aankomst
        } else enabled = arrivalOk(d);
        if (d === S.checkIn) cls.push('sel-start');
        if (d === S.checkOut) cls.push('sel-end');
        if (S.checkIn && S.checkOut && d > S.checkIn && d < S.checkOut) cls.push('in-range');
        const label = fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        cells += `<button type="button" class="${cls.join(' ')}" data-d="${d}"${enabled && d >= S.cfg.today ? '' : ' disabled'} aria-label="${esc(label)}"${d === S.checkIn || d === S.checkOut ? ' aria-pressed="true"' : ''}>${i + 1}</button>`;
      }
      html += `<div class="bk-month"><h3>${esc(title)}</h3><div class="bk-grid">${cells}</div></div>`;
    }
    $('#calendar').innerHTML = html;
    const hint = $('#cal-hint');
    hint.classList.remove('warn');
    hint.textContent = !S.checkIn ? t('pickArrival') : !S.checkOut ? t('pickDeparture', minNightsFor(S.checkIn)) : t('selected', diffDays(S.checkIn, S.checkOut));
  }
  function clickDay(d) {
    if (!S.checkIn || S.checkOut || d <= S.checkIn) {
      if (!arrivalOk(d)) return;
      S.checkIn = d; S.checkOut = null;
    } else if (rangeOk(S.checkIn, d)) {
      S.checkOut = d;
    } else {
      renderCalendar();
      const hint = $('#cal-hint');
      hint.textContent = t('notDeparture', minNightsFor(S.checkIn));
      hint.classList.add('warn');
      return;
    }
    renderCalendar();
    updateQuote();
  }

  // ---------- Samenvatting en prijs ----------
  async function updateQuote() {
    S.quote = null;
    renderSummary();
    if (!S.checkIn || !S.checkOut) return;
    const seq = ++S.quoteSeq;
    try {
      const q = await api('/api/public/quote', { unit: S.unit, checkIn: S.checkIn, checkOut: S.checkOut, guests: S.guests });
      if (seq !== S.quoteSeq) return;
      S.quote = q;
      if (!q.available && q.errors.includes('dates_unavailable')) {
        await loadAvailability(true);
        S.checkOut = null;
        renderCalendar();
        $('#cal-hint').textContent = errText('dates_unavailable');
        $('#cal-hint').classList.add('warn');
      }
    } catch (e) {
      if (seq === S.quoteSeq) S.quote = { available: false, errors: [e.code] };
    }
    renderSummary();
  }
  function summaryHtml(withButton) {
    const u = unitCfg();
    const r = R();
    const rows = [[t('unit'), u?.name || '–']];
    if (S.checkIn) rows.push([t('arrival'), `${fmtDate(S.checkIn)}<br><span class="small">${esc(t('from'))} ${r.checkInFrom}</span>`]);
    if (S.checkOut) rows.push([t('departure'), `${fmtDate(S.checkOut)}<br><span class="small">${esc(t('until'))} ${r.checkOutUntil}</span>`]);
    rows.push([t('guests'), String(S.guests)]);
    const q = S.quote;
    if (q?.price) {
      const p = q.price;
      rows.push([t('nights'), `${p.nights} × ${money(Math.round(p.lodgingCents / p.nights))}`]);
      if (p.cleaningCents) rows.push([t('cleaning'), money(p.cleaningCents)]);
      if (p.touristTaxCents) rows.push([t('tax'), money(p.touristTaxCents)]);
    }
    const ready = S.checkIn && S.checkOut && q?.available;
    const err = q && !q.available && q.errors?.length ? `<p class="bk-err">${esc(errText(q.errors[0]))}</p>` : '';
    return `<h2>${esc(t('summary'))}</h2>
      <dl>${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${k === t('unit') || k === t('guests') ? esc(v) : v}</dd></div>`).join('')}
      ${q?.price ? `<div><dt>${esc(t('total'))}</dt><dd class="tot">${money(q.price.totalCents)}</dd></div>` : ''}</dl>
      ${!S.checkIn || !S.checkOut ? `<p class="small">${esc(t('noDates'))}</p>` : !q ? `<p class="small">${esc(t('checking'))}</p>` : ''}
      ${err}
      ${withButton ? `<button type="button" class="btn solid" id="to-details"${ready ? '' : ' disabled'}>${esc(t('next'))}</button>` : ''}
      ${S.cfg.requireApproval ? `<p class="small">${esc(t('approval'))}</p>` : ''}
      <p class="small"><strong>${esc(t('policy'))}:</strong> ${esc(r.cancellationPolicy?.[lang] || '')}</p>`;
  }
  function renderSummary() {
    $('#summary').innerHTML = summaryHtml(true);
    $('#summary2').innerHTML = summaryHtml(false);
    $('#to-details')?.addEventListener('click', toDetails);
  }

  // ---------- Gegevens en verzenden ----------
  function toDetails() {
    if (!(S.checkIn && S.checkOut && S.quote?.available)) return;
    show('step-details');
    globalMsg('');
    if (!S.formShownAt) S.formShownAt = Date.now();
    $('#booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => $('#firstName').focus({ preventScroll: true }), 300);
  }
  function validateForm() {
    let ok = true;
    for (const id of ['firstName', 'lastName', 'email', 'phone']) {
      const el = $('#' + id);
      el.value = el.value.trim();
      const valid = el.checkValidity() && el.value !== '' && (id !== 'phone' || /^[+0-9 ()./-]{6,25}$/.test(el.value));
      el.setAttribute('aria-invalid', valid ? 'false' : 'true');
      ok &&= valid;
    }
    return ok;
  }
  async function submit(e) {
    e.preventDefault();
    const errEl = $('#form-error');
    errEl.hidden = true;
    if (!validateForm()) { errEl.textContent = errText('fields'); errEl.hidden = false; return; }
    if (!$('#consent').checked) { errEl.textContent = errText('consent'); errEl.hidden = false; return; }
    const btn = $('#submit-btn');
    btn.setAttribute('aria-busy', 'true');
    try {
      const res = await api('/api/public/bookings', {
        unit: S.unit, checkIn: S.checkIn, checkOut: S.checkOut, guests: S.guests,
        firstName: $('#firstName').value, lastName: $('#lastName').value, email: $('#email').value, phone: $('#phone').value,
        remarks: $('#remarks').value.trim() || undefined, language: lang, consent: true, website: $('#website').value,
        elapsedMs: Date.now() - S.formShownAt,
      });
      renderDone(res, $('#firstName').value);
    } catch (err) {
      if (err.code === 'dates_unavailable') {
        await loadAvailability(true).catch(() => {});
        S.checkOut = null; S.quote = null;
        show('step-select');
        renderCalendar(); renderSummary();
        globalMsg(errText('dates_unavailable'));
        $('#booking').scrollIntoView({ behavior: 'smooth' });
      } else {
        errEl.textContent = errText(err.code);
        errEl.hidden = false;
      }
    } finally {
      btn.removeAttribute('aria-busy');
    }
  }
  function detailList(b) {
    return `<dl>
      <div><dt>${esc(t('reference'))}</dt><dd class="bk-ref">${esc(b.reference)}</dd></div>
      <div><dt>${esc(t('status'))}</dt><dd>${esc(t('st_' + b.status))}</dd></div>
      <div><dt>${esc(t('unit'))}</dt><dd>${esc(b.unit)}</dd></div>
      <div><dt>${esc(t('arrival'))}</dt><dd>${esc(fmtDate(b.checkIn))}</dd></div>
      <div><dt>${esc(t('departure'))}</dt><dd>${esc(fmtDate(b.checkOut))}</dd></div>
      <div><dt>${esc(t('nights'))}</dt><dd>${b.nights}</dd></div>
      <div><dt>${esc(t('guests'))}</dt><dd>${b.guests}</dd></div>
      <div><dt>${esc(t('total'))}</dt><dd>${money(b.totalCents)}</dd></div></dl>`;
  }
  function renderDone(b, name) {
    S.last = () => renderDone(b, name);
    const el = $('#step-done');
    el.innerHTML = `<div class="bk-ok"><h2>${esc(t('doneTitle', name))}</h2></div>
      <p class="bk-lead">${esc(b.status === 'confirmed' ? t('doneLeadConfirmed') : t('doneLead'))}</p>
      ${detailList(b)}
      ${b.manageToken ? `<a class="btn" href="#beheer=${encodeURIComponent(b.manageToken)}" id="goto-manage">${esc(t('manageLink'))}</a>` : ''}`;
    show('step-done');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- Eigen boeking beheren ----------
  async function renderManage(token) {
    const el = $('#step-manage');
    show('step-manage');
    el.innerHTML = `<p>${esc(t('loading'))}</p>`;
    try {
      const b = await api('/api/public/manage', { token });
      S.last = () => drawManage(b, token);
      drawManage(b, token);
    } catch (e) {
      S.last = null;
      el.innerHTML = `<p class="bk-err">${esc(e.code === 'network' ? errText('network') : t('manageNotFound'))}</p><a class="btn" href="boeken.html">${esc(t('newBooking'))}</a>`;
    }
  }
  function drawManage(b, token, msg) {
    const el = $('#step-manage');
    const active = ['new', 'confirmed'].includes(b.status);
    el.innerHTML = `<h2>${esc(t('manageTitle'))}</h2>${msg ? `<p class="bk-ok">${esc(msg)}</p>` : ''}${detailList(b)}
      ${active && b.canCancel ? `<button class="btn" type="button" id="cancel-btn">${esc(t('cancelBtn'))}</button>` : ''}
      ${active && !b.canCancel ? `<p class="small">${esc(t('cannotCancel', b.freeCancellationDays))}</p>` : ''}
      ${active ? `<p class="small">${esc(t('changeInfo'))} ${esc(S.cfg?.contact?.phone || '')}</p>` : ''}
      <div class="bk-err" id="cancel-err" hidden></div>
      <a class="btn" href="boeken.html">${esc(t('newBooking'))}</a>`;
    $('#cancel-btn')?.addEventListener('click', async (ev) => {
      if (!confirm(t('cancelConfirm'))) return;
      ev.target.setAttribute('aria-busy', 'true');
      try {
        await api('/api/public/manage/cancel', { token });
        const fresh = await api('/api/public/manage', { token });
        S.last = () => drawManage(fresh, token);
        drawManage(fresh, token, t('cancelled'));
      } catch (e) {
        const err = $('#cancel-err');
        err.textContent = errText(e.code);
        err.hidden = false;
        ev.target.removeAttribute('aria-busy');
      }
    });
  }

  // ---------- Opstarten ----------
  function route() {
    const m = /beheer=([A-Za-z0-9_-]{30,100})/.exec(location.hash);
    if (m) { renderManage(m[1]); return true; }
    return false;
  }
  async function init() {
    setupLanguageSwitch();
    applyLang();
    $('#calendar').addEventListener('click', (e) => { const b = e.target.closest('button[data-d]'); if (b && !b.disabled) clickDay(b.dataset.d); });
    $('#cal-prev').addEventListener('click', () => { S.view = addMonths(S.view, -1); renderCalendar(); });
    $('#cal-next').addEventListener('click', () => { S.view = addMonths(S.view, 1); renderCalendar(); });
    $('#guests').addEventListener('change', (e) => { S.guests = Number(e.target.value); renderSummary(); updateQuote(); });
    $('#back-to-select').addEventListener('click', () => { show('step-select'); S.last = null; });
    $('#details-form').addEventListener('submit', submit);
    matchMedia('(max-width: 900px)').addEventListener('change', renderCalendar);
    window.addEventListener('hashchange', () => { if (!route()) { show('step-select'); S.last = null; } });

    try {
      S.cfg = await api('/api/public/config');
    } catch {
      show('step-offline');
      return;
    }
    if (route()) return;
    if (!S.cfg.bookingEnabled || !S.cfg.units.length) { show('step-offline'); globalMsg(errText('booking_disabled')); return; }
    const wanted = new URLSearchParams(location.search).get('unit');
    S.unit = S.cfg.units.some((u) => u.slug === wanted) ? wanted : S.cfg.units[0].slug;
    renderUnits();
    try { await selectUnit(S.unit); } catch { show('step-offline'); return; }
    renderSummary();
  }
  init();
})();
