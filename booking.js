/* Boekbalk in de hero: datumvalidatie en doorsturen naar het boekingssysteem. */
(function () {
  'use strict';

  var CONFIG = {
    // [TODO: boekings-URL] — URL van het eigen boekingssysteem (direct boeken).
    bookingUrl: '',
    // [TODO: parameternamen van het boekingssysteem bevestigen]
    params: { checkin: 'checkin', checkout: 'checkout', guests: 'guests' },
    // Tijdelijke route zolang bookingUrl leeg is: aanvraag via het bestaande WhatsApp-nummer.
    fallbackWhatsApp: '31648742693'
  };

  var form = document.getElementById('boeken');
  if (!form) return;
  var inEl = form.querySelector('#bb-in');
  var outEl = form.querySelector('#bb-out');
  var guestsEl = form.querySelector('#bb-guests');
  var errEl = form.querySelector('#bb-err');

  function iso(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function parse(v) {
    var p = v.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function addDays(v, n) {
    var d = parse(v);
    d.setDate(d.getDate() + n);
    return iso(d);
  }
  function nl(v) {
    var p = v.split('-');
    return p[2] + '-' + p[1] + '-' + p[0];
  }

  var today = iso(new Date());
  inEl.min = today;
  outEl.min = addDays(today, 1);

  function setError(msg, field) {
    errEl.textContent = msg || '';
    [inEl, outEl].forEach(function (el) { el.removeAttribute('aria-invalid'); });
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    }
  }

  inEl.addEventListener('change', function () {
    if (!inEl.value) return;
    var minOut = addDays(inEl.value, 1);
    outEl.min = minOut;
    if (!outEl.value || outEl.value < minOut) outEl.value = minOut;
    setError('');
  });
  outEl.addEventListener('change', function () { setError(''); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var a = inEl.value, b = outEl.value;
    if (!a) return setError('Kies een aankomstdatum.', inEl);
    if (a < today) return setError('De aankomstdatum kan niet in het verleden liggen.', inEl);
    if (!b) return setError('Kies een vertrekdatum.', outEl);
    if (b <= a) return setError('De vertrekdatum moet na de aankomstdatum liggen.', outEl);
    setError('');

    var g = guestsEl.value;
    if (CONFIG.bookingUrl) {
      var url = new URL(CONFIG.bookingUrl, location.href);
      url.searchParams.set(CONFIG.params.checkin, a);
      url.searchParams.set(CONFIG.params.checkout, b);
      url.searchParams.set(CONFIG.params.guests, g);
      location.href = url.toString();
      return;
    }
    var text = 'Hallo, ik wil graag direct boeken bij InnVenlo Apartments.\n' +
      'Aankomst: ' + nl(a) + '\nVertrek: ' + nl(b) + '\nGasten: ' + g + '\n' +
      'Wat is de beschikbaarheid en prijs?';
    location.href = 'https://wa.me/' + CONFIG.fallbackWhatsApp + '?text=' + encodeURIComponent(text);
  });

  // "Boek direct"-knoppen: naar de boekbalk en focus op aankomst.
  document.querySelectorAll('a[href="#boeken"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      form.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      inEl.focus({ preventScroll: true });
    });
  });
})();
