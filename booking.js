/* Boekbalk: datumvalidatie en doorsturen naar Booking.com met de gekozen waarden.
   De form-action bevat de boekings-URL; de velden checkin, checkout en group_adults
   gaan als queryparameters mee (Booking.com-formaat). */
(function () {
  var form = document.getElementById('boeken');
  if (!form) return;
  var inEl = document.getElementById('bb-in');
  var outEl = document.getElementById('bb-out');
  var err = document.getElementById('bb-err');

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDays(s, n) { var p = s.split('-'); return iso(new Date(+p[0], +p[1] - 1, +p[2] + n)); }

  var today = iso(new Date());
  inEl.min = today;
  outEl.min = addDays(today, 1);
  form.noValidate = true;

  inEl.addEventListener('change', function () {
    if (!inEl.value) return;
    var min = addDays(inEl.value, 1);
    outEl.min = min;
    if (!outEl.value || outEl.value < min) outEl.value = min;
    check(false);
  });
  outEl.addEventListener('change', function () { check(false); });

  function check(show) {
    var msg = '', field = null;
    if (!inEl.value) { msg = 'Kies een aankomstdatum.'; field = inEl; }
    else if (inEl.value < today) { msg = 'De aankomstdatum kan niet in het verleden liggen.'; field = inEl; }
    else if (!outEl.value) { msg = 'Kies een vertrekdatum.'; field = outEl; }
    else if (outEl.value <= inEl.value) { msg = 'De vertrekdatum moet na de aankomstdatum liggen.'; field = outEl; }
    inEl.setAttribute('aria-invalid', field === inEl ? 'true' : 'false');
    outEl.setAttribute('aria-invalid', field === outEl ? 'true' : 'false');
    if (show || !msg) err.textContent = msg;
    return field;
  }

  form.addEventListener('submit', function (e) {
    var field = check(true);
    if (field) { e.preventDefault(); field.focus(); }
  });
})();
