/* InnVenlo – beheerdashboard (vanilla JS, geen externe afhankelijkheden) */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const addDays = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const diffDays = (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000);
  const wd = (s) => new Date(s + 'T00:00:00Z').getUTCDay();
  const fmt = (d, o = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) => d ? new Intl.DateTimeFormat('nl-NL', { ...o, timeZone: 'UTC' }).format(new Date(String(d).slice(0, 10) + 'T00:00:00Z')) : '–';
  const fmtTs = (t) => t ? new Intl.DateTimeFormat('nl-NL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Amsterdam' }).format(new Date(t)) : '–';
  const money = (c) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format((c || 0) / 100);
  const toCents = (v) => Math.round(parseFloat(String(v).replace(',', '.')) * 100);
  const STATUS = { new: 'Nieuw', confirmed: 'Bevestigd', cancelled: 'Geannuleerd', completed: 'Afgerond', no_show: 'Niet verschenen' };
  const pill = (s) => `<span class="pill ${esc(s)}">${esc(STATUS[s] || s)}</span>`;
  const WEEKDAYS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

  const A = { admin: null, csrf: null, units: [], today: new Date().toISOString().slice(0, 10), counts: {} };

  async function api(method, path, body) {
    const opt = { method, headers: {}, credentials: 'same-origin' };
    if (method !== 'GET') opt.headers['X-CSRF-Token'] = A.csrf || '';
    if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    const res = await fetch(path, opt);
    if (res.status === 401 && path !== '/api/admin/login') { A.admin = null; renderLogin(); throw new Error('Sessie verlopen; log opnieuw in'); }
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('json') ? await res.json() : await res.text();
    if (!res.ok) throw Object.assign(new Error(data.message || 'Fout'), { code: data.error, data });
    return data;
  }
  function toast(msg, bad = false) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'show' + (bad ? ' bad' : '');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => (t.className = ''), bad ? 6000 : 3000);
  }
  const fail = (e) => toast(e.message || 'Er ging iets mis', true);
  const formData = (form) => Object.fromEntries(new FormData(form).entries());
  const isOwner = () => A.admin?.role === 'owner';

  // ---------- Inloggen ----------
  function renderLogin(msg = '') {
    $('#app').innerHTML = `<div class="login"><form class="card f" id="login">
      <div class="logo">InnVenlo <i>Apartments</i></div><h2>Beheer – inloggen</h2>
      <label class="l">E-mailadres<input name="email" type="email" autocomplete="username" required></label>
      <label class="l">Wachtwoord<input name="password" type="password" autocomplete="current-password" required></label>
      <p class="err" id="login-err">${esc(msg)}</p><button class="btn solid">Inloggen</button></form></div>`;
    $('#login').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const r = await api('POST', '/api/admin/login', formData(e.target));
        A.admin = r.admin; A.csrf = r.csrf;
        await boot();
      } catch (err) { $('#login-err').textContent = err.message; }
    });
    $('input[name=email]').focus();
  }

  // ---------- Schil ----------
  const NAV = [
    ['overzicht', 'Overzicht'], ['agenda', 'Agenda'], ['boekingen', 'Boekingen'], ['beschikbaarheid', 'Beschikbaarheid'],
    ['kanalen', 'Kanalen (iCal)'], ['klanten', 'Klanten'], ['instellingen', 'Instellingen', true], ['beheerders', 'Beheerders', true], ['logboek', 'Logboek', true], ['account', 'Mijn account'],
  ];
  function shell() {
    $('#app').innerHTML = `<div class="shell"><aside class="side" id="side"><div class="logo">InnVenlo <i>Beheer</i></div>
      <nav>${NAV.filter((n) => !n[2] || isOwner()).map(([k, l]) => `<a href="#/${k}" data-k="${k}">${l}${k === 'boekingen' ? '<span class="badge" id="badge-new" hidden></span>' : ''}</a>`).join('')}</nav>
      <div class="me"><span>${esc(A.admin.name)} · ${A.admin.role === 'owner' ? 'eigenaar' : 'medewerker'}</span><button id="logout">Uitloggen</button></div></aside>
      <main class="main" id="main"></main></div>`;
    $('#logout').addEventListener('click', async () => { await api('POST', '/api/admin/logout').catch(() => {}); A.admin = null; renderLogin(); });
    $('#side').addEventListener('click', (e) => { if (e.target.closest('a')) $('#side').classList.remove('open'); });
  }
  function page(title, actions = '') {
    $('#main').innerHTML = `<div class="top"><div class="row"><button class="btn sm menu-btn" id="menu">Menu</button><h1>${esc(title)}</h1></div><div class="row">${actions}</div></div><div id="body"></div>`;
    $('#menu').addEventListener('click', (e) => { e.stopPropagation(); $('#side').classList.toggle('open'); });
    document.addEventListener('click', (e) => { if (!e.target.closest('#side')) $('#side')?.classList.remove('open'); }, { once: true });
    return $('#body');
  }
  async function refreshBadge() {
    try {
      const o = await api('GET', '/api/admin/bookings?status=new&scope=upcoming&limit=1');
      const b = $('#badge-new');
      if (b) { b.hidden = !o.total; b.textContent = o.total; }
    } catch {}
  }

  // ---------- Router ----------
  async function route() {
    if (!A.admin) return;
    const [, name = 'overzicht', arg] = (location.hash || '#/overzicht').split('/');
    $$('.side nav a').forEach((a) => a.classList.toggle('on', a.dataset.k === name || (name === 'boeking' && a.dataset.k === 'boekingen')));
    const views = { overzicht: vOverview, agenda: vAgenda, boekingen: vBookings, boeking: vBooking, nieuw: vNewBooking, beschikbaarheid: vAvailability, kanalen: vChannels, klanten: vGuests, instellingen: vSettings, beheerders: vAdmins, logboek: vAudit, account: vAccount };
    try { await (views[name] || vOverview)(arg); } catch (e) { fail(e); }
    refreshBadge();
    window.scrollTo(0, 0);
  }

  // ---------- Overzicht ----------
  async function vOverview() {
    const body = page('Overzicht', '<a class="btn solid" href="#/nieuw">+ Nieuwe boeking</a>');
    const [o, reqs] = await Promise.all([api('GET', '/api/admin/overview'), api('GET', '/api/admin/bookings?status=new&scope=upcoming&limit=50')]);
    A.today = o.today;
    const warns = [];
    if (o.emailMode !== 'smtp') warns.push('E-mail staat in <b>testmodus</b>: berichten worden niet echt verzonden. Stel SMTP in (zie README).');
    if (o.mail.failed) warns.push(`${o.mail.failed} e-mail(s) konden niet worden verzonden. Controleer de SMTP-instellingen.`);
    for (const f of o.feeds) if (f.last_status === 'error') warns.push(`iCal-koppeling ${esc(f.name)} (${esc(f.unit)}) gaf een fout: ${esc(f.last_error)}`);
    if (!o.feeds.length) warns.push('Er zijn nog geen iCal-koppelingen met Airbnb/Booking.com. Zonder koppeling kunnen dubbele boekingen tussen kanalen ontstaan. Zie <a href="#/kanalen">Kanalen</a>.');
    body.innerHTML = `${warns.map((w) => `<p class="warn">${w}</p>`).join('')}
      <div class="cards mt">
        <div class="card stat"><b>${reqs.total}</b><span>Open aanvragen</span></div>
        <div class="card stat"><b>${o.inHouse}</b><span>Appartementen bezet vandaag</span></div>
        <div class="card stat"><b>${o.arrivals.filter((a) => a.check_in === o.today).length}</b><span>Aankomsten vandaag</span></div>
        <div class="card stat"><b>${o.departures.length}</b><span>Vertrekken vandaag</span></div></div>
      <div class="grid2"><div class="card"><h3>Aanvragen die wachten op bevestiging</h3>${reqs.items.length ? tableBookings(reqs.items) : '<p class="muted">Geen open aanvragen.</p>'}</div>
      <div class="card"><h3>Aankomsten komende 7 dagen</h3>${o.arrivals.length ? `<table class="tbl"><tbody>${o.arrivals.map((a) => `<tr class="click" data-id="${a.id}"><td>${fmt(a.check_in)}</td><td>${esc(a.first_name)} ${esc(a.last_name || '')}<br><span class="small">${esc(a.unit)} · ${a.guests_count} gast(en)</span></td><td>${pill(a.status)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Geen aankomsten.</p>'}</div></div>`;
    bindRows(body);
  }
  function tableBookings(items) {
    return `<div class="scroll"><table class="tbl"><thead><tr><th>Nr.</th><th>Gast</th><th>Appartement</th><th>Aankomst</th><th>Nachten</th><th>Totaal</th><th>Status</th></tr></thead><tbody>
      ${items.map((b) => `<tr class="click" data-id="${b.id}"><td>${esc(b.reference)}</td><td>${esc(b.first_name)} ${esc(b.last_name || '')}<br><span class="small">${esc(b.email || b.phone || '')}</span></td>
      <td>${esc(b.unit_name)}</td><td>${fmt(b.check_in)}</td><td>${b.nights}</td><td>${money(b.total_cents)}</td><td>${pill(b.status)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  const bindRows = (root) => $$('tr.click', root).forEach((tr) => tr.addEventListener('click', () => (location.hash = `#/boeking/${tr.dataset.id}`)));

  // ---------- Agenda ----------
  const AG = { mode: 'week', start: null };
  async function vAgenda() {
    const body = page('Agenda', `<div class="tabs" id="modes">${['dag', 'week', 'maand'].map((m) => `<button data-m="${m}">${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}</div>
      <button class="btn sm" id="ag-prev">←</button><button class="btn sm" id="ag-today">Vandaag</button><button class="btn sm" id="ag-next">→</button><a class="btn solid sm" href="#/nieuw">+ Boeking</a>`);
    const modeMap = { dag: 'day', week: 'week', maand: 'month' };
    if (!AG.start) AG.start = A.today;
    const draw = async () => {
      $$('#modes button').forEach((b) => b.classList.toggle('on', modeMap[b.dataset.m] === AG.mode));
      let from, to;
      if (AG.mode === 'day') { from = AG.start; to = addDays(from, 1); }
      else if (AG.mode === 'week') { from = addDays(AG.start, -((wd(AG.start) + 6) % 7)); to = addDays(from, 7); }
      else { from = AG.start.slice(0, 8) + '01'; const d = new Date(from + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + 1); to = d.toISOString().slice(0, 10); }
      const data = await api('GET', `/api/admin/calendar?from=${addDays(from, AG.mode === 'day' ? -1 : 0)}&to=${addDays(to, AG.mode === 'day' ? 1 : 0)}`);
      if (AG.mode === 'day') drawDay(body, data, from); else drawTimeline(body, data, from, to);
    };
    $('#modes').addEventListener('click', (e) => { const m = e.target.dataset.m; if (m) { AG.mode = modeMap[m]; draw().catch(fail); } });
    const step = (dir) => {
      if (AG.mode === 'day') AG.start = addDays(AG.start, dir);
      else if (AG.mode === 'week') AG.start = addDays(AG.start, 7 * dir);
      else { const d = new Date(AG.start.slice(0, 8) + '01T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + dir); AG.start = d.toISOString().slice(0, 10); }
      draw().catch(fail);
    };
    $('#ag-prev').addEventListener('click', () => step(-1));
    $('#ag-next').addEventListener('click', () => step(1));
    $('#ag-today').addEventListener('click', () => { AG.start = A.today; draw().catch(fail); });
    await draw();
  }
  function drawTimeline(body, data, from, to) {
    const n = diffDays(from, to);
    const days = Array.from({ length: n }, (_, i) => addDays(from, i));
    const small = matchMedia('(max-width: 900px)').matches;
    const colW = AG.mode === 'week' ? (small ? 'minmax(4.6rem,1fr)' : 'minmax(6.5rem,1fr)') : 'minmax(2.4rem,1fr)';
    const title = AG.mode === 'week' ? `Week van ${fmt(from, { day: 'numeric', month: 'long', year: 'numeric' })}` : fmt(from, { month: 'long', year: 'numeric' });
    let html = `<h2>${esc(title)}</h2><div class="scroll"><div class="tl" id="tl"><div class="hd"></div>`;
    html += days.map((d) => `<div class="hd${[0, 6].includes(wd(d)) ? ' we' : ''}${d === A.today ? ' today' : ''}">${WEEKDAYS[wd(d)]}<b>${Number(d.slice(8))}</b></div>`).join('');
    data.units.forEach((u, r) => {
      html += `<div class="lab" data-r="${r + 2}" data-c="1">${esc(u.name)}</div>`;
      html += days.map((d, i) => `<div class="cell${[0, 6].includes(wd(d)) ? ' we' : ''}" data-r="${r + 2}" data-c="${i + 2}" data-unit="${u.id}" data-d="${d}" title="Klik om een boeking toe te voegen"></div>`).join('');
      const bars = [];
      for (const b of data.bookings.filter((x) => x.unit_id === u.id)) {
        bars.push({ s: b.check_in, e: b.check_out, cls: b.status, id: b.id, label: `${b.first_name || ''} ${b.last_name || ''}`.trim(), sub: `${b.reference} · ${b.guests_count}p` });
        if (b.buffer_days) bars.push({ s: b.check_out, e: addDays(b.check_out, b.buffer_days), cls: 'buffer', label: 'buffer' });
      }
      for (const bl of data.blocks.filter((x) => x.unit_id === u.id)) bars.push({ s: bl.start_date, e: bl.end_date, cls: bl.source === 'ical' ? 'ical' : 'block', label: bl.source === 'ical' ? (bl.feed || 'Extern') : 'Geblokkeerd', sub: bl.reason || '' });
      for (const b of bars) {
        const s = b.s < from ? from : b.s;
        const e = b.e > to ? to : b.e;
        if (e <= s) continue;
        html += `<div class="bar ${esc(b.cls)}" data-r="${r + 2}" data-c="${diffDays(from, s) + 2}" data-span="${diffDays(s, e)}"${b.id ? ` data-id="${b.id}"` : ''} title="${esc(b.label + (b.sub ? ' – ' + b.sub : ''))}">${esc(b.label || '')}${AG.mode === 'week' && b.sub ? `<small>${esc(b.sub)}</small>` : ''}</div>`;
      }
    });
    html += `</div></div><div class="legend"><span><i class="pill new"></i>Nieuw</span><span><i class="pill confirmed"></i>Bevestigd</span><span><i class="pill completed"></i>Afgerond</span><span><i class="pill no_show"></i>Niet verschenen</span><span><i class="lg-b"></i>Geblokkeerd</span><span><i class="lg-i"></i>Airbnb/Booking.com (iCal)</span></div>
      <p class="small">Een balk loopt van de aankomstdag tot (niet t/m) de vertrekdag. Klik op een lege dag om een boeking toe te voegen.</p>`;
    body.innerHTML = html;
    const tl = $('#tl', body);
    tl.style.gridTemplateColumns = `${small ? '7.5rem' : '12rem'} repeat(${n}, ${colW})`;
    $$('[data-r]', tl).forEach((el) => { el.style.gridRow = el.dataset.r; el.style.gridColumn = el.dataset.span ? `${el.dataset.c} / span ${el.dataset.span}` : el.dataset.c; });
    $$('.legend .lg-b', body).forEach((i) => (i.style.background = '#5d6a65'));
    $$('.legend .lg-i', body).forEach((i) => (i.style.background = '#0c3b7c'));
    tl.addEventListener('click', (e) => {
      const bar = e.target.closest('.bar[data-id]');
      if (bar) { location.hash = `#/boeking/${bar.dataset.id}`; return; }
      const c = e.target.closest('.cell');
      if (c) location.hash = `#/nieuw/${c.dataset.unit}_${c.dataset.d}`;
    });
  }
  function drawDay(body, data, day) {
    const rows = data.units.map((u) => {
      const bs = data.bookings.filter((b) => b.unit_id === u.id && ['new', 'confirmed', 'completed', 'no_show'].includes(b.status));
      const items = [];
      for (const b of bs) {
        const name = `<a href="#/boeking/${b.id}">${esc(b.first_name)} ${esc(b.last_name || '')}</a> ${pill(b.status)} <span class="small">${esc(b.reference)}</span>`;
        if (b.check_out === day) items.push(`<div>↗ Vertrek (vóór ${esc(A.settings?.check_out_until || '11:00')}): ${name}</div>`);
        if (b.check_in === day) items.push(`<div>↘ Aankomst (vanaf ${esc(A.settings?.check_in_from || '14:00')}): ${name}</div>`);
        if (b.check_in < day && b.check_out > day) items.push(`<div>● Verblijft: ${name} <span class="small">vertrekt ${fmt(b.check_out)}</span></div>`);
      }
      for (const bl of data.blocks.filter((x) => x.unit_id === u.id && x.start_date <= day && x.end_date > day)) items.push(`<div>▨ ${bl.source === 'ical' ? esc(bl.feed || 'Extern') + ' (iCal)' : 'Geblokkeerd'} ${esc(bl.reason || '')}</div>`);
      const occupied = bs.some((b) => b.check_in <= day && b.check_out > day && b.status !== 'no_show') || data.blocks.some((x) => x.unit_id === u.id && x.start_date <= day && x.end_date > day);
      if (!occupied) items.push(`<div class="free">○ Vrij vannacht · <a href="#/nieuw/${u.id}_${day}">boeking toevoegen</a></div>`);
      return `<div class="slot"><strong>${esc(u.name)}</strong><div class="stack">${items.join('')}</div></div>`;
    });
    body.innerHTML = `<h2>${esc(fmt(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</h2><div class="card dayview">${rows.join('')}</div>`;
  }

  // ---------- Boekingenlijst ----------
  const BL = { scope: 'upcoming', status: '', unit: '', q: '' };
  async function vBookings() {
    const body = page('Boekingen', '<a class="btn sm" href="/api/admin/export/bookings.csv" id="csv">Export CSV</a><a class="btn solid" href="#/nieuw">+ Nieuwe boeking</a>');
    if (!isOwner()) $('#csv').remove();
    body.innerHTML = `<form class="card f" id="filt"><div class="cols">
      <label class="l">Periode<select name="scope"><option value="upcoming">Huidig en komend</option><option value="past">Afgelopen</option><option value="all">Alles</option></select></label>
      <label class="l">Status<select name="status"><option value="">Alle statussen</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <label class="l">Appartement<select name="unit"><option value="">Alle</option>${A.units.map((u) => `<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select></label>
      <label class="l">Zoeken<input name="q" placeholder="Naam, e-mail, telefoon of nummer"></label></div></form><div id="list" class="card"></div>`;
    $('#filt')['scope'].value = BL.scope; $('#filt')['status'].value = BL.status; $('#filt')['unit'].value = BL.unit; $('#filt')['q'].value = BL.q;
    const load = async () => {
      Object.assign(BL, formData($('#filt')));
      const p = new URLSearchParams({ scope: BL.scope, limit: 300 });
      if (BL.status) p.set('status', BL.status);
      if (BL.unit) p.set('unit', BL.unit);
      if (BL.q) p.set('q', BL.q);
      const r = await api('GET', '/api/admin/bookings?' + p);
      $('#list').innerHTML = `<p class="small">${r.total} boeking(en)</p>${r.items.length ? tableBookings(r.items) : ''}`;
      bindRows($('#list'));
    };
    let tmr;
    $('#filt').addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => load().catch(fail), 250); });
    $('#filt').addEventListener('submit', (e) => e.preventDefault());
    await load();
  }

  // ---------- Boekingsdetail ----------
  async function vBooking(id) {
    const { booking: b, notes, emails, history } = await api('GET', `/api/admin/bookings/${id}`);
    const body = page(`Boeking ${b.reference}`, '<a class="btn sm" href="#/boekingen">← Alle boekingen</a>');
    const actions = [];
    if (b.status === 'new') actions.push(['confirmed', 'Bevestigen', 'green'], ['cancelled', 'Afwijzen', 'danger']);
    if (b.status === 'confirmed') actions.push(['completed', 'Afgerond'], ['no_show', 'Niet verschenen'], ['cancelled', 'Annuleren', 'danger']);
    if (['cancelled', 'no_show', 'completed'].includes(b.status)) actions.push(['confirmed', 'Heractiveren (bevestigd)']);
    if (b.status === 'completed') actions.push(['no_show', 'Niet verschenen']);
    body.innerHTML = `<div class="grid2">
      <div class="stack"><div class="card"><div class="row"><h2>${esc(b.unit_name)}</h2>${pill(b.status)}</div>
        <dl class="kv"><div><dt>Aankomst</dt><dd>${fmt(b.check_in, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>
        <div><dt>Vertrek</dt><dd>${fmt(b.check_out, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>
        <div><dt>Nachten / gasten</dt><dd>${b.nights} / ${b.guests_count}</dd></div><div><dt>Totaal</dt><dd>${money(b.total_cents)}</dd></div>
        <div><dt>Bron</dt><dd>${b.source === 'website' ? 'Website' : 'Handmatig'}</dd></div><div><dt>Aangemaakt</dt><dd>${fmtTs(b.created_at)}</dd></div>
        ${b.confirmed_at ? `<div><dt>Bevestigd</dt><dd>${fmtTs(b.confirmed_at)}</dd></div>` : ''}
        ${b.cancelled_at ? `<div><dt>Geannuleerd</dt><dd>${fmtTs(b.cancelled_at)} door ${b.cancelled_by === 'guest' ? 'gast' : 'beheer'}${b.cancel_reason ? ' – ' + esc(b.cancel_reason) : ''}</dd></div>` : ''}
        ${b.remarks ? `<div><dt>Opmerkingen gast</dt><dd>${esc(b.remarks)}</dd></div>` : ''}</dl></div>
        <div class="card"><h3>Status wijzigen</h3><div class="row" id="st-actions">${actions.map(([s, l, c]) => `<button class="btn sm ${c || ''}" data-s="${s}">${l}</button>`).join('')}</div>
          <label class="c"><input type="checkbox" id="st-notify" checked> Gast per e-mail informeren</label>
          <label class="l">Toelichting bij annuleren/afwijzen (optioneel, komt in de e-mail)<input id="st-reason" maxlength="500"></label></div>
        <div class="card"><h3>Klant</h3><dl class="kv"><div><dt>Naam</dt><dd>${esc(b.first_name)} ${esc(b.last_name || '')}</dd></div>
          <div><dt>E-mail</dt><dd>${b.email ? `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>` : '–'}</dd></div>
          <div><dt>Telefoon</dt><dd>${b.phone ? `<a href="tel:${esc(b.phone)}">${esc(b.phone)}</a>` : '–'}</dd></div><div><dt>Taal</dt><dd>${esc(b.language)}</dd></div></dl></div>
        <div class="card"><h3>Interne notities</h3><form class="f" id="note"><label class="l">Nieuwe notitie<textarea name="body" rows="2" required maxlength="2000"></textarea></label><button class="btn sm">Notitie toevoegen</button></form>
          <div class="stack" id="notes">${notes.map((n) => `<div><p>${esc(n.body)}</p><p class="small">${esc(n.author || '')} · ${fmtTs(n.created_at)}</p></div>`).join('') || '<p class="muted">Nog geen notities.</p>'}</div></div></div>
      <div class="stack"><div class="card"><h3>Boeking wijzigen</h3><form class="f" id="edit"><div class="cols">
        <label class="l">Appartement<select name="unitId">${A.units.map((u) => `<option value="${u.id}"${u.id === b.unit_id ? ' selected' : ''}>${esc(u.name)}</option>`).join('')}</select></label>
        <label class="l">Gasten<input name="guestsCount" type="number" min="1" max="20" value="${b.guests_count}"></label>
        <label class="l">Aankomst<input name="checkIn" type="date" value="${b.check_in}" required></label><label class="l">Vertrek<input name="checkOut" type="date" value="${b.check_out}" required></label>
        <label class="l">Totaalprijs (€, leeg = herberekenen)<input name="total" inputmode="decimal" placeholder="${(b.total_cents / 100).toFixed(2)}"></label></div>
        <div class="cols"><label class="l">Voornaam<input name="firstName" value="${esc(b.first_name)}"></label><label class="l">Achternaam<input name="lastName" value="${esc(b.last_name || '')}"></label>
        <label class="l">E-mail<input name="email" type="email" value="${esc(b.email || '')}"></label><label class="l">Telefoon<input name="phone" value="${esc(b.phone || '')}"></label>
        <label class="l">Taal<select name="language">${['nl', 'en', 'de', 'fr'].map((l) => `<option${l === b.language ? ' selected' : ''}>${l}</option>`).join('')}</select></label></div>
        <label class="l">Opmerkingen gast<textarea name="remarks" rows="2" maxlength="1000">${esc(b.remarks || '')}</textarea></label>
        <label class="c"><input type="checkbox" name="notifyGuest" checked> Gast een gewijzigde bevestiging sturen</label>
        <button class="btn solid">Wijzigingen opslaan</button></form></div>
        <div class="card"><h3>E-mails</h3>${emails.length ? `<table class="tbl"><tbody>${emails.map((m) => `<tr><td>${esc(m.subject)}<br><span class="small">${esc(m.to_address)}</span></td><td>${m.status === 'sent' ? 'verzonden ' + fmtTs(m.sent_at) : m.status === 'failed' ? '<span class="err">mislukt</span>' : 'in wachtrij'}${m.last_error ? `<br><span class="small">${esc(m.last_error)}</span>` : ''}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Geen e-mails.</p>'}</div>
        <div class="card"><h3>Geschiedenis</h3><table class="tbl"><tbody>${history.map((h) => `<tr><td class="small">${fmtTs(h.created_at)}</td><td>${esc(h.action.replace('booking.', ''))}${h.details?.to ? ': ' + esc(STATUS[h.details.from] || h.details.from) + ' → ' + esc(STATUS[h.details.to] || h.details.to) : ''}<br><span class="small">${esc(h.actor)}</span></td></tr>`).join('')}</tbody></table></div>
        ${isOwner() ? `<div class="card"><h3>Verwijderen</h3><p class="small">Verwijderen is definitief en alleen mogelijk voor geannuleerde of afgelopen boekingen. Annuleer een actieve boeking eerst. Typ ter bevestiging het boekingsnummer <b>${esc(b.reference)}</b>.</p>
          <form class="row" id="del"><label class="l"><input name="ref" autocomplete="off" placeholder="${esc(b.reference)}"></label><button class="btn danger sm">Definitief verwijderen</button></form></div>` : ''}</div></div>`;

    $('#st-actions').addEventListener('click', async (e) => {
      const s = e.target.dataset.s;
      if (!s) return;
      if (s === 'cancelled' && !confirm(b.status === 'new' ? 'Aanvraag afwijzen?' : 'Boeking annuleren? De data komen weer vrij.')) return;
      try {
        await api('POST', `/api/admin/bookings/${b.id}/status`, { status: s, notifyGuest: $('#st-notify').checked, reason: $('#st-reason').value || undefined });
        toast(`Status gewijzigd naar ${STATUS[s]}`);
        vBooking(b.id);
      } catch (err) { fail(err); }
    });
    $('#note').addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await api('POST', `/api/admin/bookings/${b.id}/notes`, { body: e.target.body.value }); toast('Notitie toegevoegd'); vBooking(b.id); } catch (err) { fail(err); }
    });
    $('#edit').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = formData(e.target);
      const patch = { unitId: Number(f.unitId), guestsCount: Number(f.guestsCount), checkIn: f.checkIn, checkOut: f.checkOut, remarks: f.remarks, notifyGuest: !!f.notifyGuest,
        guest: { firstName: f.firstName || undefined, lastName: f.lastName, email: f.email, phone: f.phone, language: f.language } };
      if (f.total) patch.totalCents = toCents(f.total);
      try { await api('PATCH', `/api/admin/bookings/${b.id}`, patch); toast('Boeking opgeslagen'); vBooking(b.id); } catch (err) { fail(err); }
    });
    $('#del')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await api('DELETE', `/api/admin/bookings/${b.id}`, { confirmReference: e.target.ref.value.trim() }); toast('Boeking verwijderd'); location.hash = '#/boekingen'; } catch (err) { fail(err); }
    });
  }

  // ---------- Nieuwe boeking (handmatig) ----------
  async function vNewBooking(arg) {
    const [unitPre, datePre] = (arg || '').split('_');
    const body = page('Nieuwe boeking', '<a class="btn sm" href="#/boekingen">Annuleren</a>');
    const ci = datePre || A.today;
    body.innerHTML = `<form class="card f" id="nb"><div class="cols">
      <label class="l">Appartement<select name="unitId">${A.units.map((u) => `<option value="${u.id}"${String(u.id) === unitPre ? ' selected' : ''}>${esc(u.name)}</option>`).join('')}</select></label>
      <label class="l">Aankomst<input type="date" name="checkIn" value="${ci}" required></label><label class="l">Vertrek<input type="date" name="checkOut" value="${addDays(ci, 2)}" required></label>
      <label class="l">Gasten<input type="number" name="guests" min="1" max="20" value="2" required></label>
      <label class="l">Status<select name="status"><option value="confirmed">Bevestigd</option><option value="new">Nieuw</option></select></label>
      <label class="l">Totaalprijs (€, leeg = automatisch)<input name="total" inputmode="decimal"></label></div>
      <div class="cols"><label class="l">Voornaam<input name="firstName" required maxlength="80"></label><label class="l">Achternaam<input name="lastName" maxlength="80"></label>
      <label class="l">E-mail<input type="email" name="email"></label><label class="l">Telefoon<input name="phone" maxlength="25"></label>
      <label class="l">Taal<select name="language"><option>nl</option><option>en</option><option>de</option><option>fr</option></select></label></div>
      <label class="l">Opmerkingen<textarea name="remarks" rows="2" maxlength="1000"></textarea></label>
      <label class="c"><input type="checkbox" name="notifyGuest" checked> Bevestiging naar de gast sturen (als e-mail is ingevuld)</label>
      <p class="small">De beschikbaarheid wordt bij opslaan gecontroleerd; overlappende boekingen of blokkades worden geweigerd. Boekingsregels (minimum nachten e.d.) gelden niet voor handmatige boekingen.</p>
      <button class="btn solid">Boeking opslaan</button></form>`;
    $('#nb').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = formData(e.target);
      const payload = { unitId: Number(f.unitId), checkIn: f.checkIn, checkOut: f.checkOut, guests: Number(f.guests), status: f.status, firstName: f.firstName, lastName: f.lastName, email: f.email, phone: f.phone, language: f.language, remarks: f.remarks || undefined, notifyGuest: !!f.notifyGuest };
      if (f.total) payload.totalCents = toCents(f.total);
      try { const r = await api('POST', '/api/admin/bookings', payload); toast(`Boeking ${r.booking.reference} opgeslagen`); location.hash = `#/boeking/${r.booking.id}`; } catch (err) { fail(err); }
    });
  }

  // ---------- Beschikbaarheid: blokkades en prijsperiodes ----------
  async function vAvailability() {
    const body = page('Beschikbaarheid');
    const from = addDays(A.today, -1);
    const [cal, rates] = await Promise.all([api('GET', `/api/admin/calendar?from=${from}&to=${addDays(from, 120)}`), api('GET', '/api/admin/rate-periods')]);
    const unitChecks = A.units.map((u) => `<label class="c"><input type="checkbox" name="u" value="${u.id}" checked> ${esc(u.name)}</label>`).join('');
    const manual = cal.blocks.filter((b) => b.source === 'manual');
    body.innerHTML = `<div class="grid2"><div class="card"><h3>Periode blokkeren (vakantie, onderhoud, eigen gebruik)</h3>
      <form class="f" id="blk"><div class="days">${unitChecks}</div><div class="cols"><label class="l">Van (eerste nacht)<input type="date" name="startDate" required></label>
      <label class="l">Tot (vertrekdag, exclusief)<input type="date" name="endDate" required></label></div><label class="l">Reden (intern)<input name="reason" maxlength="200"></label>
      <button class="btn solid">Blokkeren</button></form>
      <h3 class="mt">Geblokkeerde periodes (komende 4 maanden)</h3>${manual.length ? `<table class="tbl"><tbody>${manual.map((b) => `<tr><td>${esc(A.units.find((u) => u.id === b.unit_id)?.name)}</td><td>${fmt(b.start_date)} – ${fmt(b.end_date)}</td><td>${esc(b.reason || '')}</td><td><button class="btn sm danger" data-del-block="${b.id}">Vrijgeven</button></td></tr>`).join('')}</tbody></table>` : '<p class="muted">Geen blokkades.</p>'}
      <p class="small">Een geblokkeerde periode is direct niet meer boekbaar op de website en wordt via de iCal-export ook doorgegeven aan Airbnb en Booking.com.</p></div>
      <div class="card"><h3>Uitzonderingen: afwijkende prijs of minimum aantal nachten</h3>
      <form class="f" id="rate"><div class="days">${unitChecks}</div><div class="cols"><label class="l">Van<input type="date" name="startDate" required></label><label class="l">Tot (exclusief)<input type="date" name="endDate" required></label>
      <label class="l">Prijs per nacht (€)<input name="price" inputmode="decimal"></label><label class="l">Min. nachten bij aankomst in periode<input type="number" name="minNights" min="1" max="365"></label></div>
      <label class="l">Omschrijving<input name="note" maxlength="200" placeholder="bijv. Carnaval, zomer, kerst"></label>${isOwner() ? '<button class="btn solid">Uitzondering toevoegen</button>' : '<p class="small">Alleen de eigenaar kan prijzen wijzigen.</p>'}</form>
      ${rates.items.length ? `<table class="tbl"><tbody>${rates.items.map((r) => `<tr><td>${esc(r.unit_name)}</td><td>${fmt(r.start_date)} – ${fmt(r.end_date)}</td><td>${r.price_cents != null ? money(r.price_cents) : ''}${r.min_nights ? ` · min. ${r.min_nights} n.` : ''}<br><span class="small">${esc(r.note || '')}</span></td><td>${isOwner() ? `<button class="btn sm danger" data-del-rate="${r.id}">Verwijderen</button>` : ''}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Geen uitzonderingen; overal geldt de standaardprijs.</p>'}
      <p class="small">Werkdagen, in-/uitchecktijden, buffer, boekingstermijnen en standaardprijzen stelt u in bij <a href="#/instellingen">Instellingen</a>.</p></div></div>`;
    const units = (form) => $$('input[name=u]:checked', form).map((i) => Number(i.value));
    $('#blk').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = formData(e.target);
      const send = (force) => api('POST', '/api/admin/blocks', { unitIds: units(e.target), startDate: f.startDate, endDate: f.endDate, reason: f.reason || undefined, force });
      try { await send(false); } catch (err) {
        if (err.code === 'overlaps_bookings' && confirm(err.message + '\n\nToch blokkeren? De bestaande boekingen blijven gewoon staan.')) { try { await send(true); } catch (e2) { return fail(e2); } } else return fail(err);
      }
      toast('Periode geblokkeerd'); vAvailability();
    });
    $('#rate').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = formData(e.target);
      const p = { unitIds: units(e.target), startDate: f.startDate, endDate: f.endDate, note: f.note || undefined };
      if (f.price) p.priceCents = toCents(f.price);
      if (f.minNights) p.minNights = Number(f.minNights);
      try { await api('POST', '/api/admin/rate-periods', p); toast('Uitzondering toegevoegd'); vAvailability(); } catch (err) { fail(err); }
    });
    body.addEventListener('click', async (e) => {
      const b = e.target.dataset.delBlock, r = e.target.dataset.delRate;
      try {
        if (b && confirm('Deze periode weer vrijgeven?')) { await api('DELETE', `/api/admin/blocks/${b}`); toast('Vrijgegeven'); vAvailability(); }
        if (r && confirm('Uitzondering verwijderen?')) { await api('DELETE', `/api/admin/rate-periods/${r}`); toast('Verwijderd'); vAvailability(); }
      } catch (err) { fail(err); }
    });
  }

  // ---------- Kanalen (iCal) ----------
  async function vChannels() {
    const body = page('Kanalen (iCal-koppelingen)');
    const [{ items: feeds }, { items: units }] = await Promise.all([api('GET', '/api/admin/ical-feeds'), api('GET', '/api/admin/units')]);
    body.innerHTML = `<p class="okbox">Zo voorkomt u dubbele boekingen tussen uw website, Airbnb en Booking.com:<br>
      1. Maak per appartement per kanaal een koppeling aan.<br>2. Plak de <b>exportlink van Airbnb/Booking.com</b> in "Importlink" – dit systeem haalt die agenda elke ${esc(A.settings?.ical_sync_minutes || 30)} minuten op.<br>
      3. Kopieer de <b>exportlink van dit systeem</b> en voeg die in Airbnb/Booking.com toe als te importeren agenda.<br>
      Let op: Airbnb en Booking.com verversen geïmporteerde agenda's zelf maar periodiek (vaak elke paar uur). Een kleine kans op een dubbele boeking blijft daardoor bestaan; u krijgt dan direct een waarschuwing per e-mail.</p>
      ${units.map((u) => `<div class="card mt"><h2>${esc(u.name)}</h2>
        ${feeds.filter((f) => f.unit_id === u.id).map((f) => `<fieldset><legend>${esc(f.name)}</legend>
          <label class="l">Exportlink van dit systeem (plakken in ${esc(f.name)})<input readonly value="${esc(f.export_url)}" class="sel"></label>
          <form class="f feed" data-id="${f.id}"><label class="l">Importlink van ${esc(f.name)} (https://…)<input name="importUrl" value="${esc(f.import_url || '')}" placeholder="Nog niet ingesteld"></label>
          <div class="row">${isOwner() ? '<button class="btn sm solid">Opslaan</button>' : ''}<button type="button" class="btn sm" data-sync="${f.id}">Nu synchroniseren</button>${isOwner() ? `<button type="button" class="btn sm danger" data-del-feed="${f.id}">Verwijderen</button>` : ''}</div></form>
          <p class="small">Laatste synchronisatie: ${fmtTs(f.last_sync_at)} ${f.last_status === 'error' ? `<span class="err">– fout: ${esc(f.last_error)}</span>` : f.last_status === 'ok' ? '– in orde' : ''}</p></fieldset>`).join('') || '<p class="muted">Nog geen koppelingen.</p>'}
        ${isOwner() ? `<form class="row new-feed" data-unit="${u.id}"><label class="l"><select name="name"><option>Airbnb</option><option>Booking.com</option><option>Overig</option></select></label><button class="btn sm">+ Koppeling toevoegen</button></form>` : ''}
        <p class="small">Algemene exportlink (alle bezette periodes, bv. voor uw eigen agenda-app): <input readonly class="sel" value="${esc(u.ical_export_url)}"></p></div>`).join('')}`;
    $$('input.sel', body).forEach((i) => { i.style.width = '100%'; i.addEventListener('focus', () => i.select()); });
    $$('form.feed', body).forEach((f) => f.addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await api('PATCH', `/api/admin/ical-feeds/${f.dataset.id}`, { importUrl: f.importUrl.value.trim() }); const r = await api('POST', `/api/admin/ical-feeds/${f.dataset.id}/sync`); toast(r.error ? 'Opgeslagen, maar synchronisatie mislukt: ' + r.error : r.skipped ? 'Opgeslagen' : `Opgeslagen; ${r.imported} externe periode(s) geïmporteerd`, !!r.error); vChannels(); } catch (err) { fail(err); }
    }));
    $$('form.new-feed', body).forEach((f) => f.addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await api('POST', '/api/admin/ical-feeds', { unitId: Number(f.dataset.unit), name: f.name.value }); toast('Koppeling aangemaakt'); vChannels(); } catch (err) { fail(err); }
    }));
    body.addEventListener('click', async (e) => {
      const s = e.target.dataset.sync, d = e.target.dataset.delFeed;
      try {
        if (s) { const r = await api('POST', `/api/admin/ical-feeds/${s}/sync`); toast(r.error ? 'Mislukt: ' + r.error : r.skipped ? 'Geen importlink ingesteld' : `${r.imported} periode(s) geïmporteerd${r.conflicts ? `, ${r.conflicts} conflict(en)!` : ''}`, !!r.error || !!r.conflicts); vChannels(); }
        if (d && confirm('Koppeling verwijderen? Geïmporteerde blokkades vervallen.')) { await api('DELETE', `/api/admin/ical-feeds/${d}`); toast('Verwijderd'); vChannels(); }
      } catch (err) { fail(err); }
    });
  }

  // ---------- Klanten ----------
  async function vGuests() {
    const body = page('Klanten');
    body.innerHTML = `<div class="card f"><label class="l">Zoeken<input id="gq" placeholder="Naam, e-mail of telefoon"></label></div><div class="card" id="gl"></div>
      <p class="small">AVG: als eigenaar kunt u alle gegevens van een klant exporteren (inzageverzoek) of anonimiseren (verwijderverzoek). Gegevens worden bovendien automatisch geanonimiseerd ${esc(A.settings?.retention_months || 24)} maanden na het laatste verblijf.</p>`;
    const load = async () => {
      const r = await api('GET', '/api/admin/guests?' + new URLSearchParams($('#gq').value ? { q: $('#gq').value } : {}));
      $('#gl').innerHTML = `<div class="scroll"><table class="tbl"><thead><tr><th>Naam</th><th>Contact</th><th>Boekingen</th><th>Laatste verblijf</th><th></th></tr></thead><tbody>
        ${r.items.map((g) => `<tr><td>${esc(g.first_name)} ${esc(g.last_name || '')}</td><td>${esc(g.email || '')}<br><span class="small">${esc(g.phone || '')}</span></td><td>${g.bookings}</td><td>${fmt(g.last_stay)}</td>
        <td>${isOwner() && !g.anonymized_at ? `<button class="btn sm" data-exp="${g.id}">Export</button> <button class="btn sm danger" data-anon="${g.id}">Anonimiseren</button>` : g.anonymized_at ? '<span class="small">geanonimiseerd</span>' : ''}</td></tr>`).join('')}</tbody></table></div>`;
    };
    let tmr;
    $('#gq').addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => load().catch(fail), 250); });
    body.addEventListener('click', async (e) => {
      const x = e.target.dataset.exp, a = e.target.dataset.anon;
      try {
        if (x) {
          const data = await api('GET', `/api/admin/guests/${x}/export`);
          const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
          Object.assign(document.createElement('a'), { href: url, download: `klant-${x}.json` }).click();
          URL.revokeObjectURL(url);
        }
        if (a && confirm('Alle persoonsgegevens van deze klant definitief anonimiseren? Boekingen blijven (zonder naam) bewaard.')) { await api('POST', `/api/admin/guests/${a}/anonymize`); toast('Geanonimiseerd'); load(); }
      } catch (err) { fail(err); }
    });
    await load();
  }

  // ---------- Instellingen ----------
  async function vSettings() {
    if (!isOwner()) return vOverview();
    const body = page('Instellingen');
    const [{ settings: s }, { items: units }] = await Promise.all([api('GET', '/api/admin/settings'), api('GET', '/api/admin/units')]);
    const dayBoxes = (name, vals) => [1, 2, 3, 4, 5, 6, 0].map((d) => `<label class="c"><input type="checkbox" name="${name}" value="${d}"${vals.includes(d) ? ' checked' : ''}> ${WEEKDAYS[d]}</label>`).join('');
    const num = (k, label, extra = '') => `<label class="l">${label}<input type="number" name="${k}" value="${s[k]}" ${extra}></label>`;
    const time = (k, label) => `<label class="l">${label}<input type="time" name="${k}" value="${s[k]}"></label>`;
    const chk = (k, label) => `<label class="c"><input type="checkbox" name="${k}"${s[k] ? ' checked' : ''}> ${label}</label>`;
    body.innerHTML = `<form class="f" id="set">
      <fieldset><legend>Boeken</legend>${chk('booking_enabled', 'Online boeken ingeschakeld (uit = agenda tijdelijk gesloten voor nieuwe aanvragen)')}${chk('require_approval', 'Elke aanvraag eerst zelf goedkeuren')}
        <div class="cols">${num('min_nights', 'Minimum nachten', 'min="1"')}${num('max_nights', 'Maximum nachten', 'min="1"')}${num('min_lead_days', 'Minimaal dagen vooraf boeken', 'min="0"')}${num('booking_window_days', 'Maximaal dagen vooruit boeken', 'min="1"')}${num('buffer_days', 'Bufferdagen na vertrek (schoonmaak)', 'min="0" max="14"')}${num('max_open_requests_per_email', 'Max. open aanvragen per e-mailadres', 'min="1"')}</div>
        <div><span class="muted">Aankomst mogelijk op</span><div class="days">${dayBoxes('arrival_weekdays', s.arrival_weekdays)}</div></div>
        <div><span class="muted">Vertrek mogelijk op</span><div class="days">${dayBoxes('departure_weekdays', s.departure_weekdays)}</div></div></fieldset>
      <fieldset><legend>Openingstijden in- en uitchecken</legend><div class="cols">${time('check_in_from', 'Inchecken vanaf')}${time('check_in_until', 'Inchecken tot')}${time('check_out_from', 'Uitchecken vanaf')}${time('check_out_until', 'Uitchecken tot')}</div></fieldset>
      <fieldset><legend>Kosten</legend><div class="cols"><label class="l">Schoonmaakkosten per boeking (€)<input name="cleaning_fee" inputmode="decimal" value="${(s.cleaning_fee_cents / 100).toFixed(2)}"></label>
        <label class="l">Toeristenbelasting p.p.p.n. (€)<input name="tourist_tax" inputmode="decimal" value="${(s.tourist_tax_cents_pppn / 100).toFixed(2)}"></label></div></fieldset>
      <fieldset><legend>Annuleringsvoorwaarden</legend>${num('free_cancellation_days', 'Gratis online annuleren tot … dagen voor aankomst', 'min="0"')}
        ${['nl', 'en', 'de', 'fr'].map((l) => `<label class="l">Tekst (${l})<textarea name="policy_${l}" rows="2" maxlength="2000">${esc(s.cancellation_policy[l])}</textarea></label>`).join('')}</fieldset>
      <fieldset><legend>Herinneringen en automatisering</legend>${chk('reminder1_enabled', 'Eerste herinnering sturen')}${num('reminder1_hours_before', 'Eerste herinnering: uren voor inchecktijd', 'min="1"')}
        ${chk('reminder2_enabled', 'Tweede herinnering sturen')}${num('reminder2_hours_before', 'Tweede herinnering: uren voor inchecktijd', 'min="1"')}
        ${chk('auto_complete', 'Bevestigde boekingen na vertrek automatisch op Afgerond zetten')}${num('ical_sync_minutes', 'iCal-synchronisatie elke … minuten', 'min="10"')}</fieldset>
      <fieldset><legend>Gegevens en privacy</legend><div class="cols"><label class="l">Meldingen naar (e-mail beheerder)<input type="email" name="admin_notify_email" value="${esc(s.admin_notify_email)}"></label>
        <label class="l">Naam accommodatie<input name="property_name" value="${esc(s.property_name)}"></label><label class="l">Adres<input name="property_address" value="${esc(s.property_address)}"></label><label class="l">Telefoon<input name="property_phone" value="${esc(s.property_phone)}"></label>
        ${num('retention_months', 'Bewaartermijn persoonsgegevens (maanden na vertrek)', 'min="1" max="120"')}</div></fieldset>
      <div class="row"><button class="btn solid">Instellingen opslaan</button><button type="button" class="btn" id="testmail">Testmail versturen</button></div></form>
      <div class="card mt"><h3>Appartementen</h3>${units.map((u) => `<form class="cols unit" data-id="${u.id}"><label class="l">Naam<input name="name" value="${esc(u.name)}"></label><label class="l">Standaardprijs per nacht (€)<input name="price" inputmode="decimal" value="${(u.base_price_cents / 100).toFixed(2)}"></label>
        <label class="l">Max. gasten<input type="number" name="max_guests" min="1" max="20" value="${u.max_guests}"></label><label class="c"><input type="checkbox" name="active"${u.active ? ' checked' : ''}> Boekbaar</label><div class="row"><button class="btn sm solid">Opslaan</button></div></form>`).join('')}</div>`;
    $('#set').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const ints = ['min_nights', 'max_nights', 'min_lead_days', 'booking_window_days', 'buffer_days', 'max_open_requests_per_email', 'free_cancellation_days', 'reminder1_hours_before', 'reminder2_hours_before', 'ical_sync_minutes', 'retention_months'];
      const p = {};
      for (const k of ints) p[k] = Number(f[k].value);
      for (const k of ['booking_enabled', 'require_approval', 'reminder1_enabled', 'reminder2_enabled', 'auto_complete']) p[k] = f[k].checked;
      for (const k of ['check_in_from', 'check_in_until', 'check_out_from', 'check_out_until', 'admin_notify_email', 'property_name', 'property_address', 'property_phone']) p[k] = f[k].value.trim();
      p.arrival_weekdays = $$('input[name=arrival_weekdays]:checked', f).map((i) => Number(i.value));
      p.departure_weekdays = $$('input[name=departure_weekdays]:checked', f).map((i) => Number(i.value));
      p.cleaning_fee_cents = toCents(f.cleaning_fee.value || 0);
      p.tourist_tax_cents_pppn = toCents(f.tourist_tax.value || 0);
      p.cancellation_policy = Object.fromEntries(['nl', 'en', 'de', 'fr'].map((l) => [l, f['policy_' + l].value.trim()]));
      try { const r = await api('PUT', '/api/admin/settings', p); A.settings = r.settings; toast('Instellingen opgeslagen'); } catch (err) { fail(err); }
    });
    $('#testmail').addEventListener('click', async () => { try { const r = await api('POST', '/api/admin/test-email'); toast(r.mode === 'smtp' ? `Testmail in wachtrij naar ${r.to}` : 'E-mail staat in testmodus (geen SMTP); er wordt niets verzonden', r.mode !== 'smtp'); } catch (err) { fail(err); } });
    $$('form.unit', body).forEach((f) => f.addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await api('PATCH', `/api/admin/units/${f.dataset.id}`, { name: f.name.value.trim(), base_price_cents: toCents(f.price.value), max_guests: Number(f.max_guests.value), active: f.active.checked }); await loadUnits(); toast('Appartement opgeslagen'); } catch (err) { fail(err); }
    }));
  }

  // ---------- Beheerders ----------
  async function vAdmins() {
    if (!isOwner()) return vOverview();
    const body = page('Beheerders');
    const { items } = await api('GET', '/api/admin/admins');
    body.innerHTML = `<div class="grid2"><div class="card"><h3>Accounts</h3><table class="tbl"><tbody>${items.map((a) => `<tr><td>${esc(a.name)}<br><span class="small">${esc(a.email)}</span></td>
      <td>${a.role === 'owner' ? 'Eigenaar' : 'Medewerker'}${a.active ? '' : ' · <span class="err">inactief</span>'}<br><span class="small">laatst ingelogd ${fmtTs(a.last_login_at)}</span></td>
      <td>${a.id !== A.admin.id ? `<button class="btn sm" data-toggle="${a.id}" data-active="${a.active}">${a.active ? 'Deactiveren' : 'Activeren'}</button> <button class="btn sm" data-pw="${a.id}">Nieuw wachtwoord</button>` : '<span class="small">(uzelf)</span>'}</td></tr>`).join('')}</tbody></table>
      <p class="small">Eigenaar: volledige toegang. Medewerker: agenda, boekingen, blokkades en klanten bekijken; geen instellingen, prijzen, beheerders, export of verwijderen.</p></div>
      <form class="card f" id="na"><h3>Beheerder toevoegen</h3><label class="l">Naam<input name="name" required></label><label class="l">E-mail<input type="email" name="email" required></label>
      <label class="l">Tijdelijk wachtwoord (min. 12 tekens)<input type="password" name="password" required minlength="12" autocomplete="new-password"></label>
      <label class="l">Rol<select name="role"><option value="staff">Medewerker</option><option value="owner">Eigenaar</option></select></label><button class="btn solid">Toevoegen</button></form></div>`;
    $('#na').addEventListener('submit', async (e) => { e.preventDefault(); try { await api('POST', '/api/admin/admins', formData(e.target)); toast('Beheerder toegevoegd'); vAdmins(); } catch (err) { fail(err); } });
    body.addEventListener('click', async (e) => {
      const t = e.target.dataset.toggle, p = e.target.dataset.pw;
      try {
        if (t) { await api('PATCH', `/api/admin/admins/${t}`, { active: e.target.dataset.active !== 'true' }); vAdmins(); }
        if (p) { const pw = prompt('Nieuw wachtwoord (min. 12 tekens):'); if (pw) { await api('PATCH', `/api/admin/admins/${p}`, { password: pw }); toast('Wachtwoord ingesteld'); } }
      } catch (err) { fail(err); }
    });
  }

  // ---------- Logboek ----------
  async function vAudit() {
    if (!isOwner()) return vOverview();
    const body = page('Logboek');
    const { items } = await api('GET', '/api/admin/audit');
    body.innerHTML = `<div class="card scroll"><table class="tbl"><thead><tr><th>Tijd</th><th>Wie</th><th>Actie</th><th>Details</th></tr></thead><tbody>
      ${items.map((i) => `<tr><td class="small">${fmtTs(i.created_at)}</td><td>${esc(i.actor)}</td><td>${esc(i.action)}${i.entity_id ? ` <span class="small">#${esc(i.entity_id)}</span>` : ''}</td><td class="small">${esc(JSON.stringify(i.details)).slice(0, 300)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  // ---------- Account ----------
  async function vAccount() {
    const body = page('Mijn account');
    body.innerHTML = `<form class="card f" id="pw"><h3>Wachtwoord wijzigen</h3><label class="l">Huidig wachtwoord<input type="password" name="current" required autocomplete="current-password"></label>
      <label class="l">Nieuw wachtwoord (min. 12 tekens, letters én cijfers/tekens)<input type="password" name="next" required minlength="12" autocomplete="new-password"></label><button class="btn solid">Wijzigen</button>
      <p class="small">Na wijzigen worden uw andere sessies (andere apparaten) uitgelogd.</p></form>`;
    $('#pw').addEventListener('submit', async (e) => { e.preventDefault(); try { await api('POST', '/api/admin/password', formData(e.target)); e.target.reset(); toast('Wachtwoord gewijzigd'); } catch (err) { fail(err); } });
  }

  // ---------- Start ----------
  async function loadUnits() { A.units = (await api('GET', '/api/admin/units')).items; }
  async function boot() {
    await loadUnits();
    A.settings = (await api('GET', '/api/admin/settings')).settings;
    shell();
    if (!location.hash || location.hash === '#') location.hash = '#/overzicht';
    await route();
  }
  window.addEventListener('hashchange', () => route());
  (async () => {
    try {
      const me = await fetch('/api/admin/me', { credentials: 'same-origin' });
      if (!me.ok) return renderLogin();
      const r = await me.json();
      A.admin = r.admin; A.csrf = r.csrf;
      await boot();
    } catch { renderLogin(); }
  })();
})();
