/* Boekbalk: datumvalidatie + mobiele onderbalk */
(function () {
  function iso(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }
  function addDays(s, n) {
    var p = s.split('-'), d = new Date(+p[0], p[1] - 1, +p[2]);
    d.setDate(d.getDate() + n);
    return iso(d);
  }

  var form = document.getElementById('boeken');
  if (form) {
    var inEl = document.getElementById('bb-in'), outEl = document.getElementById('bb-out');
    var today = iso(new Date());
    inEl.min = today;
    outEl.min = addDays(today, 1);

    function check() {
      if (inEl.value) {
        var minOut = addDays(inEl.value, 1);
        outEl.min = minOut;
        if (outEl.value && outEl.value < minOut) outEl.value = minOut;
      }
      outEl.setCustomValidity(inEl.value && outEl.value && outEl.value <= inEl.value
        ? 'Vertrek moet na aankomst liggen.' : '');
    }
    inEl.addEventListener('change', function () {
      if (inEl.value && !outEl.value) outEl.value = addDays(inEl.value, 1);
      check();
    });
    outEl.addEventListener('change', check);
    form.addEventListener('submit', function (e) {
      check();
      if (!form.checkValidity()) { e.preventDefault(); form.reportValidity(); }
    });
  }

  /* Mobiele onderbalk: alleen zichtbaar als de boekbalk uit beeld is */
  var mb = document.querySelector('.mb');
  if (mb && form && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      var passed = !e.isIntersecting && e.boundingClientRect.top < 0;
      document.body.classList.toggle('mb-on', passed);
    }).observe(form);
  } else if (mb) {
    document.body.classList.add('mb-on');
  }
})();
