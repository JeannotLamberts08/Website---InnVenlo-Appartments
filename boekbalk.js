/* Boekbalk: datumvalidatie en doorsturen naar het boekingssysteem.
   Configuratie staat als data-attributen op <form id="boeken"> in index.html. */
(function () {
  var form = document.getElementById('boeken');
  var mbar = document.querySelector('.mbar');

  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function addDays(isoStr, n) {
    var p = isoStr.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setDate(d.getDate() + n);
    return iso(d);
  }
  function nl(isoStr) {
    var p = isoStr.split('-');
    return p[2] + '-' + p[1] + '-' + p[0];
  }

  if (form) {
    var ci = form.querySelector('#bb-in');
    var co = form.querySelector('#bb-out');
    var guests = form.querySelector('#bb-guests');
    var msg = form.querySelector('#bb-msg');
    var today = iso(new Date());

    ci.min = today;
    co.min = addDays(today, 1);

    ci.addEventListener('change', function () {
      if (!ci.value) return;
      if (ci.value < today) ci.value = today;
      var minOut = addDays(ci.value, 1);
      co.min = minOut;
      if (!co.value || co.value < minOut) co.value = minOut;
      msg.textContent = '';
    });
    co.addEventListener('change', function () { msg.textContent = ''; });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var error = '';
      if (!ci.value) error = 'Kies een aankomstdatum.';
      else if (ci.value < today) error = 'De aankomstdatum ligt in het verleden.';
      else if (!co.value) error = 'Kies een vertrekdatum.';
      else if (co.value <= ci.value) error = 'De vertrekdatum moet na de aankomstdatum liggen.';

      if (error) {
        msg.className = 'bb-msg err';
        msg.textContent = error;
        (!ci.value || ci.value < today ? ci : co).focus();
        return;
      }

      var base = (form.dataset.bookingUrl || '').trim();
      if (!base) {
        // [TODO: boekings-URL] Nog geen boekingssysteem gekoppeld.
        msg.className = 'bb-msg';
        msg.textContent = 'Boekingssysteem nog niet gekoppeld [TODO: boekings-URL]. Gekozen: ' +
          nl(ci.value) + ' t/m ' + nl(co.value) + ', ' + guests.options[guests.selectedIndex].text + '.';
        return;
      }

      var url = new URL(base, location.href);
      url.searchParams.set(form.dataset.paramCheckin || 'checkin', ci.value);
      url.searchParams.set(form.dataset.paramCheckout || 'checkout', co.value);
      url.searchParams.set(form.dataset.paramGuests || 'adults', guests.value);
      location.href = url.toString();
    });
  }

  // Mobiele onderbalk: tonen zodra de boekbalk uit beeld is.
  if (mbar) {
    var target = form || null;
    var show = function (v) {
      mbar.classList.toggle('show', v);
      document.body.classList.toggle('mbar-on', v);
    };
    if (target && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var e = entries[0];
        show(!e.isIntersecting && e.boundingClientRect.top < 0);
        // Contactknoppen niet over de boekbalk heen laten vallen (mobiel, zie CSS)
        document.body.classList.toggle('bb-visible', e.isIntersecting);
      }).observe(target);
    } else if (!target) {
      show(true);
    }
  }
})();
