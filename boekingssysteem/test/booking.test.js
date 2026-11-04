// Integratietests tegen een echte PostgreSQL-database (TEST_DATABASE_URL). Draai: npm test
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { createPool } from '../src/db.js';
import { migrate } from '../src/migrate.js';
import { addDays, todayIn } from '../src/lib/dates.js';
import { hashPassword } from '../src/services/auth.js';
import { createTransport, processOutbox } from '../src/services/email.js';
import { buildExport, parseIcal, syncFeed } from '../src/services/ical.js';
import { applyRetention, autoComplete, sendReminders } from '../src/services/scheduler.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('Stel TEST_DATABASE_URL in (een LEGE testdatabase; wordt gewist)');

const cfg = loadConfig({ NODE_ENV: 'test', DATABASE_URL: url, COOKIE_SECURE: 'false', MAIL_TRANSPORT: 'log', PUBLIC_SITE_URL: 'https://www.innvenlo.nl', PUBLIC_API_URL: 'https://boeken.innvenlo.nl' });
const pool = createPool(url);
let app;
const today = todayIn();
const d = (n) => addDays(today, n);
let ipCounter = 1;
const nextIp = () => `10.0.${Math.floor(ipCounter / 250)}.${(ipCounter++ % 250) + 1}`;

const guest = (over = {}) => ({
  unit: 'one-bedroom', checkIn: d(30), checkOut: d(33), guests: 2, firstName: 'Test', lastName: 'Gast',
  email: `gast${Math.random().toString(36).slice(2, 8)}@example.com`, phone: '+31 6 12345678', consent: true, elapsedMs: 5000, language: 'nl', ...over,
});
const book = (body, ip = nextIp()) => app.inject({ method: 'POST', url: '/api/public/bookings', payload: body, remoteAddress: ip });
const outbox = async (kind) => (await pool.query('SELECT * FROM email_outbox WHERE kind = $1 ORDER BY id', [kind])).rows;

async function adminSession(email = 'eigenaar@example.com', password = 'Sterk-wachtwoord-2026') {
  const r = await app.inject({ method: 'POST', url: '/api/admin/login', payload: { email, password }, remoteAddress: nextIp() });
  assert.equal(r.statusCode, 200, r.body);
  const cookie = r.cookies.find((c) => c.name === 'iv_session');
  const csrf = r.json().csrf;
  return (method, path, payload, { noCsrf = false } = {}) => app.inject({
    method, url: path, payload, cookies: { iv_session: cookie.value }, headers: noCsrf ? {} : { 'x-csrf-token': csrf }, remoteAddress: '127.0.0.1',
  });
}

before(async () => {
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await migrate(pool, { info() {} });
  await pool.query('INSERT INTO admins (email, name, password_hash, role) VALUES ($1,$2,$3,$4), ($5,$6,$3,$7)',
    ['eigenaar@example.com', 'Eigenaar', await hashPassword('Sterk-wachtwoord-2026'), 'owner', 'medewerker@example.com', 'Medewerker', 'staff']);
  app = await buildApp({ cfg, pool, logger: false });
});
after(async () => { await app.close(); await pool.end(); });

describe('Boeken door bezoekers', () => {
  test('nieuwe boeking: status Nieuw, mails aan gast en beheerder', async () => {
    const g = guest();
    const r = await book(g);
    assert.equal(r.statusCode, 201, r.body);
    const b = r.json();
    assert.match(b.reference, /^IV-[A-Z0-9]{6}$/);
    assert.equal(b.status, 'new');
    assert.equal(b.totalCents, 3 * 14000);
    assert.ok(b.manageToken.length > 30);
    const guestMails = (await outbox('request_received')).filter((m) => m.to_address === g.email);
    assert.equal(guestMails.length, 1);
    assert.match(guestMails[0].body_text, /boeken\.html#beheer=/);
    assert.ok((await outbox('admin_new_request')).some((m) => m.to_address === 'jamb.lamberts@ziggo.nl' && m.body_text.includes(b.reference)));
  });

  test('bezet tijdslot opnieuw boeken wordt geweigerd (ook gedeeltelijke overlap)', async () => {
    assert.equal((await book(guest({ checkIn: d(40), checkOut: d(43) }))).statusCode, 201);
    for (const [ci, co] of [[d(40), d(43)], [d(41), d(44)], [d(38), d(41)], [d(39), d(45)]]) {
      const r = await book(guest({ checkIn: ci, checkOut: co }));
      assert.equal(r.statusCode, 409, `${ci}-${co}: ${r.body}`);
      assert.equal(r.json().error, 'dates_unavailable');
    }
    // Wisseldag: vertrek van de ene gast = aankomst van de volgende is toegestaan
    assert.equal((await book(guest({ checkIn: d(43), checkOut: d(45) }))).statusCode, 201);
    assert.equal((await book(guest({ checkIn: d(38), checkOut: d(40) }))).statusCode, 201);
    // Ander appartement op dezelfde data is vrij
    assert.equal((await book(guest({ unit: 'deluxe-double', checkIn: d(40), checkOut: d(43) }))).statusCode, 201);
  });

  test('twintig gelijktijdige pogingen voor hetzelfde tijdslot: precies één slaagt', async () => {
    const results = await Promise.all(Array.from({ length: 20 }, () => book(guest({ checkIn: d(60), checkOut: d(63) }))));
    const codes = results.map((r) => r.statusCode);
    assert.equal(codes.filter((c) => c === 201).length, 1, codes.join(','));
    assert.equal(codes.filter((c) => c === 409).length, 19);
    const { rows } = await pool.query(`SELECT count(*) AS n FROM bookings WHERE check_in = $1 AND unit_id = 1 AND status <> 'cancelled'`, [d(60)]);
    assert.equal(rows[0].n, 1);
  });

  test('gelijktijdige overlappende (niet identieke) periodes: hoogstens één slaagt', async () => {
    const ranges = [[d(70), d(73)], [d(71), d(74)], [d(72), d(75)], [d(69), d(72)], [d(70), d(72)]];
    const results = await Promise.all(ranges.map(([ci, co]) => book(guest({ unit: 'deluxe-double', checkIn: ci, checkOut: co }))));
    const ok = results.filter((r) => r.statusCode === 201).map((r) => r.json());
    for (let i = 0; i < ok.length; i++) for (let j = i + 1; j < ok.length; j++) {
      assert.ok(ok[i].checkOut <= ok[j].checkIn || ok[j].checkOut <= ok[i].checkIn, 'overlappende boekingen opgeslagen!');
    }
  });

  test('database-constraint weigert overlap ook buiten de applicatie om', async () => {
    const g = (await pool.query('SELECT id FROM guests LIMIT 1')).rows[0].id;
    await assert.rejects(
      pool.query(`INSERT INTO bookings (reference, unit_id, guest_id, check_in, check_out, guests_count, total_cents, status) VALUES ('IV-DBTEST', 1, $1, $2, $3, 1, 0, 'confirmed')`, [g, d(61), d(62)]),
      (e) => e.code === '23P01');
  });

  test('boekingsregels worden server-side afgedwongen', async () => {
    const cases = [
      [{ checkIn: d(100), checkOut: d(101) }, 422, 'min_nights'],
      [{ checkIn: d(0), checkOut: d(3) }, 422, 'too_soon'],
      [{ checkIn: d(400), checkOut: d(403) }, 422, 'too_far_ahead'],
      [{ guests: 4, checkIn: d(100), checkOut: d(103) }, 422, 'too_many_guests'],
      [{ checkIn: d(103), checkOut: d(100) }, 422, 'checkout_before_checkin'],
      [{ checkIn: '2026-02-30', checkOut: d(103) }, 422, 'invalid_dates'],
      [{ email: 'geen-email', checkIn: d(100), checkOut: d(103) }, 400, 'validation'],
      [{ consent: false }, 400, 'validation'],
      [{ website: 'http://spam', checkIn: d(100), checkOut: d(103) }, 400, 'spam_suspected'],
      [{ elapsedMs: 100, checkIn: d(100), checkOut: d(103) }, 400, 'spam_suspected'],
      [{ unit: 'bestaat-niet' }, 400, 'unit_unavailable'],
      [{ extra: 'veld' }, 400, 'validation'],
    ];
    for (const [over, status, code] of cases) {
      const r = await book(guest(over));
      assert.equal(r.statusCode, status, `${JSON.stringify(over)} -> ${r.body}`);
      assert.equal(r.json().error, code, JSON.stringify(over));
    }
  });

  test('maximaal 3 openstaande aanvragen per e-mailadres', async () => {
    const email = 'veel@example.com';
    for (let i = 0; i < 3; i++) assert.equal((await book(guest({ email, checkIn: d(110 + i * 5), checkOut: d(112 + i * 5) }))).statusCode, 201);
    const r = await book(guest({ email, checkIn: d(130), checkOut: d(132) }));
    assert.equal(r.statusCode, 429);
    assert.equal(r.json().error, 'too_many_requests');
  });

  test('rate-limit: max. 5 aanvragen per IP per 15 minuten', async () => {
    const ip = '10.9.9.9';
    const codes = [];
    for (let i = 0; i < 6; i++) codes.push((await book(guest({ checkIn: d(150 + i * 3), checkOut: d(152 + i * 3) }), ip)).statusCode);
    assert.deepEqual(codes, [201, 201, 201, 201, 201, 429]);
  });

  test('beschikbaarheid geeft alleen datums, nooit klantgegevens', async () => {
    const r = await app.inject({ url: `/api/public/availability?unit=one-bedroom&from=${d(0)}&to=${d(90)}` });
    assert.equal(r.statusCode, 200);
    const body = r.json();
    assert.ok(body.unavailable.includes(d(40)) && body.unavailable.includes(d(42)) && !body.unavailable.includes(d(45)));
    assert.doesNotMatch(r.body, /@|Gast|IV-/);
  });

  test('CORS staat alleen de eigen website toe', async () => {
    const ok = await app.inject({ url: '/api/public/config', headers: { origin: 'https://www.innvenlo.nl' } });
    assert.equal(ok.headers['access-control-allow-origin'], 'https://www.innvenlo.nl');
    const bad = await app.inject({ url: '/api/public/config', headers: { origin: 'https://evil.example' } });
    assert.equal(bad.headers['access-control-allow-origin'], undefined);
  });
});

describe('Gast beheert eigen boeking', () => {
  test('bekijken en kosteloos annuleren (>7 dagen) maakt data weer vrij', async () => {
    const r = await book(guest({ checkIn: d(200), checkOut: d(203) }));
    const { manageToken, reference } = r.json();
    const v = await app.inject({ method: 'POST', url: '/api/public/manage', payload: { token: manageToken } });
    assert.equal(v.json().reference, reference);
    assert.equal(v.json().canCancel, true);
    assert.equal(v.json().email, undefined, 'geen e-mail in beheerweergave');
    const c = await app.inject({ method: 'POST', url: '/api/public/manage/cancel', payload: { token: manageToken } });
    assert.equal(c.statusCode, 200, c.body);
    assert.equal(c.json().status, 'cancelled');
    assert.ok((await outbox('cancelled')).some((m) => m.body_text.includes(reference)));
    assert.ok((await outbox('admin_guest_cancelled')).some((m) => m.body_text.includes(reference)));
    assert.equal((await book(guest({ checkIn: d(200), checkOut: d(203) }))).statusCode, 201, 'data zijn weer boekbaar');
  });

  test('annuleren binnen 7 dagen voor aankomst kan niet online', async () => {
    const r = await book(guest({ checkIn: d(5), checkOut: d(8) }));
    const { manageToken } = r.json();
    assert.equal((await app.inject({ method: 'POST', url: '/api/public/manage', payload: { token: manageToken } })).json().canCancel, false);
    const c = await app.inject({ method: 'POST', url: '/api/public/manage/cancel', payload: { token: manageToken } });
    assert.equal(c.statusCode, 403);
  });

  test('onbekend of geraden token geeft niets prijs', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/public/manage', payload: { token: 'x'.repeat(43) } });
    assert.equal(r.statusCode, 404);
  });
});

describe('Beheerdersomgeving', () => {
  test('zonder sessie geen toegang', async () => {
    assert.equal((await app.inject({ url: '/api/admin/bookings' })).statusCode, 401);
    assert.equal((await app.inject({ url: '/api/admin/bookings', cookies: { iv_session: 'vervalst' } })).statusCode, 401);
    for (const u of ['/api/%61dmin/bookings', '/api/admin/%62ookings', '/api/admin/settings', '/api/admin/export/bookings.csv']) {
      assert.equal((await app.inject({ url: u })).statusCode, 401, u);
    }
  });

  test('fout wachtwoord en blokkade na 5 pogingen', async () => {
    await pool.query("INSERT INTO admins (email, name, password_hash) VALUES ('slot@example.com', 'Slot', $1)", [await hashPassword('Juist-wachtwoord-1')]);
    for (let i = 0; i < 5; i++) {
      const r = await app.inject({ method: 'POST', url: '/api/admin/login', payload: { email: 'slot@example.com', password: 'fout' }, remoteAddress: nextIp() });
      assert.equal(r.statusCode, 401);
    }
    const r = await app.inject({ method: 'POST', url: '/api/admin/login', payload: { email: 'slot@example.com', password: 'Juist-wachtwoord-1' }, remoteAddress: nextIp() });
    assert.equal(r.json().error, 'account_locked');
    const u = await app.inject({ method: 'POST', url: '/api/admin/login', payload: { email: 'onbekend@example.com', password: 'x' }, remoteAddress: nextIp() });
    assert.equal(u.json().error, 'invalid_login', 'zelfde melding bij onbekend account');
  });

  test('wachtwoord wordt gehasht (argon2id) opgeslagen', async () => {
    const { rows } = await pool.query("SELECT password_hash FROM admins WHERE email = 'eigenaar@example.com'");
    assert.match(rows[0].password_hash, /^\$argon2id\$/);
  });

  test('CSRF-token verplicht bij wijzigingen', async () => {
    const s = await adminSession();
    const r = await s('POST', '/api/admin/blocks', { unitIds: [1], startDate: d(300), endDate: d(302) }, { noCsrf: true });
    assert.equal(r.statusCode, 403);
  });

  test('medewerker mag geen instellingen wijzigen of verwijderen (rollen)', async () => {
    const s = await adminSession('medewerker@example.com');
    assert.equal((await s('PUT', '/api/admin/settings', { min_nights: 1 })).statusCode, 403);
    assert.equal((await s('GET', '/api/admin/admins')).statusCode, 403);
    assert.equal((await s('GET', '/api/admin/bookings')).statusCode, 200);
  });

  test('bevestigen, wijzigen, annuleren met e-mails en logboek', async () => {
    const s = await adminSession();
    const ref = (await book(guest({ checkIn: d(220), checkOut: d(223), email: 'wijzig@example.com' }))).json().reference;
    const id = (await pool.query('SELECT id FROM bookings WHERE reference = $1', [ref])).rows[0].id;

    const c = await s('POST', `/api/admin/bookings/${id}/status`, { status: 'confirmed', notifyGuest: true });
    assert.equal(c.json().booking.status, 'confirmed');
    assert.ok((await outbox('confirmed')).some((m) => m.to_address === 'wijzig@example.com'));

    // Wijzigen naar een bezette periode: geweigerd
    await book(guest({ checkIn: d(230), checkOut: d(233) }));
    const bad = await s('PATCH', `/api/admin/bookings/${id}`, { checkIn: d(229), checkOut: d(231) });
    assert.equal(bad.statusCode, 409);
    // Wijzigen naar vrije periode: prijs herberekend + gewijzigde bevestiging
    const ok = await s('PATCH', `/api/admin/bookings/${id}`, { checkIn: d(221), checkOut: d(225), notifyGuest: true });
    assert.equal(ok.statusCode, 200, ok.body);
    assert.equal(ok.json().booking.total_cents, 4 * 14000);
    assert.ok((await outbox('updated')).some((m) => m.to_address === 'wijzig@example.com' && m.body_text.includes('4')));
    const avail = (await app.inject({ url: `/api/public/availability?unit=one-bedroom&from=${d(219)}&to=${d(226)}` })).json().unavailable;
    assert.deepEqual(avail, [d(221), d(222), d(223), d(224)], 'beschikbaarheid volgt de wijziging');

    const x = await s('POST', `/api/admin/bookings/${id}/status`, { status: 'cancelled', notifyGuest: true, reason: 'Onderhoud' });
    assert.equal(x.json().booking.status, 'cancelled');
    assert.ok((await outbox('cancelled')).some((m) => m.to_address === 'wijzig@example.com' && m.body_text.includes('Onderhoud')));
    const log = (await pool.query(`SELECT action FROM audit_log WHERE entity = 'booking' AND entity_id = $1 ORDER BY id`, [String(id)])).rows.map((r) => r.action);
    assert.deepEqual(log, ['booking.create', 'booking.status', 'booking.update', 'booking.status']);
  });

  test('afwijzen van een aanvraag stuurt afwijzingsmail', async () => {
    const s = await adminSession();
    const ref = (await book(guest({ checkIn: d(240), checkOut: d(242), email: 'afwijs@example.com' }))).json().reference;
    const id = (await pool.query('SELECT id FROM bookings WHERE reference = $1', [ref])).rows[0].id;
    await s('POST', `/api/admin/bookings/${id}/status`, { status: 'cancelled' });
    assert.ok((await outbox('declined')).some((m) => m.to_address === 'afwijs@example.com'));
  });

  test('handmatige boeking (telefonisch) zonder e-mail', async () => {
    const s = await adminSession();
    const r = await s('POST', '/api/admin/bookings', { unitId: 2, checkIn: d(250), checkOut: d(251), guests: 1, firstName: 'Telefoon', phone: '0612345678' });
    assert.equal(r.statusCode, 201, r.body);
    assert.equal(r.json().booking.status, 'confirmed');
    const dup = await s('POST', '/api/admin/bookings', { unitId: 2, checkIn: d(250), checkOut: d(252), guests: 1, firstName: 'Dubbel' });
    assert.equal(dup.statusCode, 409);
  });

  test('blokkade maakt periode onboekbaar; vrijgeven maakt haar weer beschikbaar', async () => {
    const s = await adminSession();
    const r = await s('POST', '/api/admin/blocks', { unitIds: [1, 2], startDate: d(260), endDate: d(267), reason: 'Vakantie' });
    assert.equal(r.statusCode, 200, r.body);
    assert.equal((await book(guest({ checkIn: d(262), checkOut: d(264) }))).statusCode, 409);
    assert.equal((await book(guest({ unit: 'deluxe-double', checkIn: d(259), checkOut: d(261) }))).statusCode, 409);
    for (const id of r.json().ids) await s('DELETE', `/api/admin/blocks/${id}`);
    assert.equal((await book(guest({ checkIn: d(262), checkOut: d(264) }))).statusCode, 201);
  });

  test('instellingen wijzigen: minimum nachten, buffer en gesloten agenda', async () => {
    const s = await adminSession();
    assert.equal((await s('PUT', '/api/admin/settings', { min_nights: 4 })).statusCode, 200);
    assert.equal((await book(guest({ checkIn: d(280), checkOut: d(283) }))).json().error, 'min_nights');
    assert.equal((await s('PUT', '/api/admin/settings', { min_nights: 2, buffer_days: 1 })).statusCode, 200);
    assert.equal((await book(guest({ checkIn: d(280), checkOut: d(283) }))).statusCode, 201);
    assert.equal((await book(guest({ checkIn: d(283), checkOut: d(285) }))).statusCode, 409, 'schoonmaakdag na vertrek');
    assert.equal((await book(guest({ checkIn: d(284), checkOut: d(286) }))).statusCode, 201);
    assert.equal((await s('PUT', '/api/admin/settings', { buffer_days: 0, booking_enabled: false })).statusCode, 200);
    assert.equal((await book(guest({ checkIn: d(290), checkOut: d(292) }))).json().error, 'booking_disabled');
    assert.equal((await s('PUT', '/api/admin/settings', { booking_enabled: true })).statusCode, 200);
    assert.equal((await s('PUT', '/api/admin/settings', { min_nights: 'veel' })).statusCode, 422);
    assert.equal((await s('PUT', '/api/admin/settings', { onbekend: 1 })).statusCode, 422);
  });

  test('prijsperiode wijzigt de prijs', async () => {
    const s = await adminSession();
    await s('POST', '/api/admin/rate-periods', { unitIds: [2], startDate: d(300), endDate: d(302), priceCents: 20000 });
    const q = await app.inject({ method: 'POST', url: '/api/public/quote', payload: { unit: 'deluxe-double', checkIn: d(300), checkOut: d(303), guests: 2 } });
    assert.equal(q.json().price.totalCents, 20000 * 2 + 14000);
  });

  test('veilige verwijderprocedure', async () => {
    const s = await adminSession();
    const ref = (await book(guest({ checkIn: d(320), checkOut: d(322) }))).json().reference;
    const id = (await pool.query('SELECT id FROM bookings WHERE reference = $1', [ref])).rows[0].id;
    assert.equal((await s('DELETE', `/api/admin/bookings/${id}`, { confirmReference: ref })).statusCode, 409, 'actieve boeking eerst annuleren');
    await s('POST', `/api/admin/bookings/${id}/status`, { status: 'cancelled', notifyGuest: false });
    assert.equal((await s('DELETE', `/api/admin/bookings/${id}`, { confirmReference: 'IV-FOUT00' })).statusCode, 400);
    const st = await adminSession('medewerker@example.com');
    assert.equal((await st('DELETE', `/api/admin/bookings/${id}`, { confirmReference: ref })).statusCode, 403);
    assert.equal((await s('DELETE', `/api/admin/bookings/${id}`, { confirmReference: ref })).statusCode, 200);
    assert.equal((await pool.query('SELECT 1 FROM bookings WHERE id = $1', [id])).rowCount, 0);
  });
});

describe('iCal, e-mail en geplande taken', () => {
  test('parser leest Airbnb/Booking.com-formaat', () => {
    const ev = parseIcal('BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20270105\r\nDTEND;VALUE=DATE:20270108\r\nUID:abc@airbnb.com\r\nSUMMARY:Reserved\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART:20270110T150000Z\r\nDTEND:20270112T100000Z\r\nUID:x\r\nEND:VEVENT\r\nEND:VCALENDAR');
    assert.deepEqual(ev.map((e) => [e.start, e.end]), [['2027-01-05', '2027-01-08'], ['2027-01-10', '2027-01-12']]);
  });

  test('import blokkeert data, waarschuwt bij conflict; export bevat geen persoonsgegevens en geen echo', async () => {
    const s = await adminSession();
    const f = (await s('POST', '/api/admin/ical-feeds', { unitId: 1, name: 'Airbnb' })).json().feed;
    const ics = (a, b, uid) => `BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART;VALUE=DATE:${a.replace(/-/g, '')}\nDTEND;VALUE=DATE:${b.replace(/-/g, '')}\nUID:${uid}\nSUMMARY:Airbnb (Not available)\nEND:VEVENT\nEND:VCALENDAR`;
    await pool.query('UPDATE ical_feeds SET import_url = $2 WHERE id = $1', [f.id, 'https://example.com/a.ics']);
    // Extern geboekt op 330-333 en een conflict met eigen boeking op 40-43
    const text = ics(d(330), d(333), 'ext1').replace('END:VCALENDAR', '') + ics(d(41), d(42), 'ext2').replace('BEGIN:VCALENDAR\n', '');
    const r = await syncFeed(pool, { cfg }, f.id, { fetcher: async () => text });
    assert.equal(r.imported, 2);
    assert.equal(r.conflicts, 1);
    assert.equal((await book(guest({ checkIn: d(331), checkOut: d(334) }))).statusCode, 409);
    assert.ok((await outbox('admin_ical_conflict')).length >= 1);
    // Zelfde agenda nogmaals: geen nieuwe waarschuwing
    const before = (await outbox('admin_ical_conflict')).length;
    await syncFeed(pool, { cfg }, f.id, { fetcher: async () => text });
    assert.equal((await outbox('admin_ical_conflict')).length, before);

    const exp = await app.inject({ url: `/ical/feed/${f.export_token}.ics` });
    assert.equal(exp.statusCode, 200);
    assert.match(exp.headers['content-type'], /text\/calendar/);
    assert.match(exp.body, new RegExp(`DTSTART;VALUE=DATE:${d(40).replace(/-/g, '')}`));
    assert.doesNotMatch(exp.body, new RegExp(d(330).replace(/-/g, '')), 'Airbnb krijgt eigen reserveringen niet terug');
    assert.doesNotMatch(exp.body, /@example\.com|Gast|IV-/);
    const unitToken = (await pool.query('SELECT ical_export_token FROM units WHERE id = 1')).rows[0].ical_export_token;
    assert.match(await buildExport(pool, 1), new RegExp(d(330).replace(/-/g, '')));
    assert.equal((await app.inject({ url: `/ical/unit/${unitToken}.ics` })).statusCode, 200);
    assert.equal((await app.inject({ url: '/ical/unit/fout.ics' })).statusCode, 404);
  });

  test('e-mailwachtrij verstuurt en probeert opnieuw bij fouten', async () => {
    const t = createTransport({ transport: 'log' });
    const n = await processOutbox(pool, cfg, t, null, 1000);
    assert.ok(n > 0 && t.sent.length === n);
    assert.equal((await pool.query("SELECT count(*) AS n FROM email_outbox WHERE status = 'pending' AND send_after <= now()")).rows[0].n, 0);
    await pool.query("INSERT INTO email_outbox (kind, to_address, subject, body_text, body_html) VALUES ('x', 'a@b.nl', 's', 't', 'h')");
    await processOutbox(pool, cfg, { send: async () => { throw new Error('SMTP down'); } }, null);
    const m = (await pool.query("SELECT * FROM email_outbox WHERE kind = 'x'")).rows[0];
    assert.equal(m.status, 'pending');
    assert.equal(m.attempts, 1);
    assert.match(m.last_error, /SMTP down/);
  });

  test('herinnering 24 uur voor aankomst wordt precies één keer verstuurd', async () => {
    const s = await adminSession();
    const r = await s('POST', '/api/admin/bookings', { unitId: 2, checkIn: d(1), checkOut: d(3), guests: 2, firstName: 'Morgen', email: 'morgen@example.com', notifyGuest: false });
    assert.equal(r.statusCode, 201, r.body);
    // Boeking 'eerder' aangemaakt (anders is een herinnering overbodig)
    await pool.query("UPDATE bookings SET created_at = now() - interval '10 days' WHERE id = $1", [r.json().booking.id]);
    // Herinnering valt binnen 24 uur voor 14:00 morgen; afhankelijk van het huidige tijdstip
    const due = (await pool.query(`SELECT ((CURRENT_DATE + 1 + time '14:00') AT TIME ZONE 'Europe/Amsterdam') - interval '24 hours' <= now() AS due`)).rows[0].due;
    const n1 = await sendReminders(pool, { cfg });
    const n2 = await sendReminders(pool, { cfg });
    assert.equal(n2, 0, 'geen dubbele herinnering');
    if (due) assert.ok((await outbox('reminder')).some((m) => m.to_address === 'morgen@example.com'));
    else assert.equal(n1, 0);
  });

  test('automatisch afronden en AVG-bewaartermijn', async () => {
    const g = (await pool.query("INSERT INTO guests (first_name, last_name, email) VALUES ('Oud', 'Gast', 'oud@example.com') RETURNING id")).rows[0].id;
    await pool.query(`INSERT INTO bookings (reference, unit_id, guest_id, check_in, check_out, guests_count, total_cents, status, remarks)
      VALUES ('IV-OUD001', 1, $1, CURRENT_DATE - 1000, CURRENT_DATE - 998, 1, 0, 'confirmed', 'privé')`, [g]);
    assert.ok((await autoComplete(pool)) >= 1);
    assert.equal((await pool.query("SELECT status FROM bookings WHERE reference = 'IV-OUD001'")).rows[0].status, 'completed');
    assert.ok((await applyRetention(pool)) >= 1);
    const row = (await pool.query('SELECT g.email, g.last_name, b.remarks FROM guests g JOIN bookings b ON b.guest_id = g.id WHERE g.id = $1', [g])).rows[0];
    assert.deepEqual(row, { email: null, last_name: null, remarks: null });
  });
});
