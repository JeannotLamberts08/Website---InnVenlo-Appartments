import argon2 from 'argon2';
import { tx } from '../db.js';
import { addDays, diffDays, isDate, todayIn } from '../lib/dates.js';
import { AppError, bad, conflict, forbidden, notFound } from '../lib/errors.js';
import { randomToken, safeEqual, sha256 } from '../lib/security.js';
import { audit } from '../services/audit.js';
import { COOKIE, hashPassword, login, logout, passwordProblem, publicAdmin, requireOwner, sessionFromToken } from '../services/auth.js';
import { changeStatus, createBooking, deleteBooking, loadBooking, STATUSES, updateBooking } from '../services/bookings.js';
import { queueAdminMail } from '../services/email.js';
import { syncFeed } from '../services/ical.js';
import { getSettings, saveSettings } from '../services/settings.js';

const DATE = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' };
const LANG = { type: 'string', enum: ['nl', 'en', 'de', 'fr'] };
const ID = { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } };
const guestProps = {
  firstName: { type: 'string', minLength: 1, maxLength: 80 },
  lastName: { type: 'string', maxLength: 80 },
  email: { anyOf: [{ type: 'string', format: 'email', maxLength: 200 }, { type: 'string', maxLength: 0 }] },
  phone: { type: 'string', maxLength: 25 },
  language: LANG,
};

export default async function adminRoutes(app, { pool, cfg, log }) {
  const ctx = { cfg, log };
  const cookieOpts = { path: '/', httpOnly: true, secure: cfg.cookieSecure, sameSite: 'strict', maxAge: cfg.sessionHours * 3600 };

  // ---- Authenticatie ----
  app.post('/api/admin/login', {
    config: { rateLimit: { max: 10, timeWindow: '5 minutes' } },
    schema: { body: { type: 'object', additionalProperties: false, required: ['email', 'password'], properties: { email: { type: 'string', maxLength: 200 }, password: { type: 'string', maxLength: 200 } } } },
  }, async (req, reply) => {
    const r = await login(pool, cfg, req.body.email.trim(), req.body.password, { ip: req.ipHash, userAgent: req.headers['user-agent'] });
    if (r.error) throw new AppError(401, r.error === 'locked' ? 'account_locked' : 'invalid_login', r.error === 'locked' ? 'Account tijdelijk geblokkeerd na te veel mislukte pogingen. Probeer het over 15 minuten opnieuw.' : 'Onjuist e-mailadres of wachtwoord');
    reply.setCookie(COOKIE, r.token, cookieOpts);
    return { admin: r.admin, csrf: r.csrf };
  });

  // Alle routes in deze plugin (behalve login): geldige sessie verplicht; bij wijzigingen ook een geldig CSRF-token.
  // De hook geldt via Fastify-encapsulatie voor elke route van deze plugin, ongeacht hoe de URL is geschreven/gecodeerd.
  app.addHook('preHandler', async (req) => {
    if (req.routeOptions.url === '/api/admin/login') return;
    const s = await sessionFromToken(pool, req.cookies[COOKIE]);
    if (!s) throw new AppError(401, 'unauthenticated', 'Niet ingelogd');
    if (req.method !== 'GET' && !safeEqual(req.headers['x-csrf-token'] || '', s.csrf)) throw forbidden('Ongeldig beveiligingstoken; herlaad de pagina');
    req.admin = s.admin;
    req.csrf = s.csrf;
  });
  const who = (req) => ({ admin: req.admin, ip: req.ipHash });

  app.get('/api/admin/me', async (req) => ({ admin: publicAdmin(req.admin), csrf: req.csrf }));

  app.post('/api/admin/logout', async (req, reply) => {
    await logout(pool, req.cookies[COOKIE]);
    await audit(pool, { admin: req.admin, action: 'auth.logout', ip: req.ipHash });
    reply.clearCookie(COOKIE, { path: '/' });
    return { ok: true };
  });

  app.post('/api/admin/password', {
    schema: { body: { type: 'object', additionalProperties: false, required: ['current', 'next'], properties: { current: { type: 'string', maxLength: 200 }, next: { type: 'string', maxLength: 200 } } } },
  }, async (req) => {
    const ok = await argon2.verify(req.admin.password_hash, req.body.current).catch(() => false);
    if (!ok) throw bad('invalid_password', 'Huidig wachtwoord is onjuist');
    const p = passwordProblem(req.body.next);
    if (p) throw bad('weak_password', p);
    await pool.query('UPDATE admins SET password_hash = $2 WHERE id = $1', [req.admin.id, await hashPassword(req.body.next)]);
    await pool.query('DELETE FROM sessions WHERE admin_id = $1 AND token_hash <> $2', [req.admin.id, sha256(req.cookies[COOKIE])]);
    await audit(pool, { ...who(req), action: 'auth.password_changed' });
    return { ok: true };
  });

  // ---- Overzicht ----
  app.get('/api/admin/overview', async () => {
    const today = todayIn(cfg.timezone);
    const q = (sql, p = []) => pool.query(sql, p).then((r) => r.rows);
    const [counts, arrivals, departures, inhouse, mail, feeds] = await Promise.all([
      q(`SELECT status, count(*) AS n FROM bookings WHERE check_out >= $1 GROUP BY status`, [today]),
      q(`SELECT b.id, b.reference, b.check_in, u.name AS unit, g.first_name, g.last_name, b.guests_count, b.status
           FROM bookings b JOIN units u ON u.id=b.unit_id JOIN guests g ON g.id=b.guest_id
          WHERE b.check_in BETWEEN $1 AND $2 AND b.status IN ('new','confirmed') ORDER BY b.check_in`, [today, addDays(today, 7)]),
      q(`SELECT b.id, b.reference, b.check_out, u.name AS unit, g.first_name, g.last_name FROM bookings b
           JOIN units u ON u.id=b.unit_id JOIN guests g ON g.id=b.guest_id
          WHERE b.check_out = $1 AND b.status IN ('confirmed','completed')`, [today]),
      q(`SELECT count(*) AS n FROM bookings WHERE check_in <= $1 AND check_out > $1 AND status = 'confirmed'`, [today]),
      q(`SELECT count(*) FILTER (WHERE status='failed') AS failed, count(*) FILTER (WHERE status='pending') AS pending FROM email_outbox`),
      q(`SELECT f.id, f.name, u.name AS unit, f.last_status, f.last_error, f.last_sync_at FROM ical_feeds f JOIN units u ON u.id=f.unit_id WHERE f.active AND f.import_url IS NOT NULL`),
    ]);
    return {
      today, counts: Object.fromEntries(counts.map((r) => [r.status, r.n])), arrivals, departures,
      inHouse: inhouse[0].n, mail: mail[0], feeds, emailMode: cfg.mail.transport,
    };
  });

  // ---- Agenda ----
  app.get('/api/admin/calendar', { schema: { querystring: { type: 'object', required: ['from', 'to'], properties: { from: DATE, to: DATE } } } }, async (req) => {
    const { from, to } = req.query;
    if (!isDate(from) || !isDate(to) || to <= from || diffDays(from, to) > 120) throw bad('invalid_range', 'Ongeldige periode');
    const [units, bookings, blocks] = await Promise.all([
      pool.query('SELECT id, slug, name, active FROM units ORDER BY sort_order, id'),
      pool.query(
        `SELECT b.id, b.reference, b.unit_id, b.check_in, b.check_out, b.buffer_days, b.status, b.guests_count,
                g.first_name, g.last_name FROM bookings b JOIN guests g ON g.id=b.guest_id
          WHERE b.check_in < $2 AND b.check_out > $1 AND b.status <> 'cancelled' ORDER BY b.check_in`, [from, to]),
      pool.query(
        `SELECT bl.id, bl.unit_id, bl.start_date, bl.end_date, bl.reason, bl.source, f.name AS feed FROM blocks bl
           LEFT JOIN ical_feeds f ON f.id = bl.feed_id WHERE bl.start_date < $2 AND bl.end_date > $1 ORDER BY bl.start_date`, [from, to]),
    ]);
    return { units: units.rows, bookings: bookings.rows, blocks: blocks.rows };
  });

  // ---- Boekingen ----
  app.get('/api/admin/bookings', {
    schema: { querystring: { type: 'object', properties: {
      status: { type: 'string', maxLength: 100 }, unit: { type: 'integer' }, q: { type: 'string', maxLength: 100 },
      from: DATE, to: DATE, scope: { type: 'string', enum: ['upcoming', 'past', 'all'] },
      limit: { type: 'integer', minimum: 1, maximum: 500, default: 100 }, offset: { type: 'integer', minimum: 0, default: 0 } } } },
  }, async (req) => {
    const { status, unit, q, from, to, scope = 'upcoming', limit, offset } = req.query;
    const where = [];
    const p = [];
    const add = (sql, v) => { p.push(v); where.push(sql.replace('?', `$${p.length}`)); };
    const today = todayIn(cfg.timezone);
    if (status) add('b.status = ANY(?::booking_status[])', status.split(',').filter((s) => STATUSES.includes(s)));
    if (unit) add('b.unit_id = ?', unit);
    if (q) add(`(b.reference ILIKE ? OR g.first_name || ' ' || coalesce(g.last_name,'') ILIKE $${p.length + 1} OR g.email ILIKE $${p.length + 1} OR g.phone ILIKE $${p.length + 1})`, `%${q.replace(/[%_\\]/g, '\\$&')}%`);
    if (from) add('b.check_out > ?', from);
    if (to) add('b.check_in < ?', to);
    if (scope === 'upcoming') add('b.check_out >= ?', today);
    if (scope === 'past') add('b.check_out < ?', today);
    const sqlWhere = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const order = scope === 'past' ? 'b.check_in DESC' : 'b.check_in ASC';
    const { rows } = await pool.query(
      `SELECT b.id, b.reference, b.unit_id, u.name AS unit_name, b.check_in, b.check_out, (b.check_out-b.check_in) AS nights,
              b.guests_count, b.status, b.source, b.total_cents, b.created_at, g.first_name, g.last_name, g.email, g.phone,
              count(*) OVER() AS total_count
         FROM bookings b JOIN units u ON u.id=b.unit_id JOIN guests g ON g.id=b.guest_id
         ${sqlWhere} ORDER BY ${order}, b.id LIMIT ${limit} OFFSET ${offset}`, p);
    return { total: rows[0]?.total_count ?? 0, items: rows.map(({ total_count, ...r }) => r) };
  });

  app.get('/api/admin/bookings/:id', { schema: { params: ID } }, async (req) => {
    const b = await loadBooking(pool, req.params.id);
    if (!b) throw notFound('Boeking niet gevonden');
    const [notes, emails, history] = await Promise.all([
      pool.query('SELECT n.id, n.body, n.created_at, a.name AS author FROM booking_notes n LEFT JOIN admins a ON a.id=n.admin_id WHERE booking_id=$1 ORDER BY n.created_at DESC', [b.id]),
      pool.query('SELECT id, kind, to_address, subject, status, attempts, last_error, sent_at, created_at FROM email_outbox WHERE booking_id=$1 ORDER BY id DESC', [b.id]),
      pool.query(`SELECT actor, action, details, created_at FROM audit_log WHERE entity='booking' AND entity_id=$1 ORDER BY id DESC LIMIT 50`, [String(b.id)]),
    ]);
    const { manage_token_hash, ...safe } = b;
    return { booking: safe, notes: notes.rows, emails: emails.rows, history: history.rows };
  });

  app.post('/api/admin/bookings', {
    schema: { body: { type: 'object', additionalProperties: false, required: ['unitId', 'checkIn', 'checkOut', 'guests', 'firstName'],
      properties: { unitId: { type: 'integer' }, checkIn: DATE, checkOut: DATE, guests: { type: 'integer', minimum: 1, maximum: 20 },
        ...guestProps, remarks: { type: 'string', maxLength: 1000 }, status: { type: 'string', enum: ['new', 'confirmed'] },
        totalCents: { type: 'integer', minimum: 0 }, notifyGuest: { type: 'boolean' } } } },
  }, async (req, reply) => {
    const b = req.body;
    const { booking } = await createBooking(pool, ctx, {
      unitId: b.unitId, checkIn: b.checkIn, checkOut: b.checkOut, guestsCount: b.guests,
      firstName: b.firstName.trim(), lastName: (b.lastName || '').trim() || null, email: b.email ? b.email.trim().toLowerCase() : null,
      phone: b.phone || null, remarks: b.remarks || null, language: b.language || 'nl', status: b.status || 'confirmed',
      totalCents: b.totalCents, notifyGuest: b.notifyGuest,
    }, who(req));
    reply.code(201);
    return { booking };
  });

  app.patch('/api/admin/bookings/:id', {
    schema: { params: ID, body: { type: 'object', additionalProperties: false, properties: {
      unitId: { type: 'integer' }, checkIn: DATE, checkOut: DATE, guestsCount: { type: 'integer', minimum: 1, maximum: 20 },
      totalCents: { type: 'integer', minimum: 0 }, remarks: { type: 'string', maxLength: 1000 }, notifyGuest: { type: 'boolean' },
      guest: { type: 'object', additionalProperties: false, properties: guestProps } } } },
  }, async (req) => ({ booking: await updateBooking(pool, ctx, req.params.id, req.body, who(req)) }));

  app.post('/api/admin/bookings/:id/status', {
    schema: { params: ID, body: { type: 'object', additionalProperties: false, required: ['status'], properties: {
      status: { type: 'string', enum: STATUSES }, notifyGuest: { type: 'boolean' }, reason: { type: 'string', maxLength: 500 } } } },
  }, async (req) => ({ booking: await changeStatus(pool, ctx, req.params.id, req.body, who(req)) }));

  app.post('/api/admin/bookings/:id/notes', {
    schema: { params: ID, body: { type: 'object', additionalProperties: false, required: ['body'], properties: { body: { type: 'string', minLength: 1, maxLength: 2000 } } } },
  }, async (req) => {
    const b = await loadBooking(pool, req.params.id);
    if (!b) throw notFound('Boeking niet gevonden');
    const { rows } = await pool.query('INSERT INTO booking_notes (booking_id, admin_id, body) VALUES ($1,$2,$3) RETURNING id, body, created_at', [b.id, req.admin.id, req.body.body.trim()]);
    await audit(pool, { ...who(req), action: 'booking.note', entity: 'booking', entityId: b.id, details: { reference: b.reference } });
    return { note: { ...rows[0], author: req.admin.name } };
  });

  app.delete('/api/admin/bookings/:id', {
    schema: { params: ID, body: { type: 'object', required: ['confirmReference'], properties: { confirmReference: { type: 'string', maxLength: 20 } } } },
  }, async (req) => {
    requireOwner(req.admin);
    return deleteBooking(pool, ctx, req.params.id, req.body.confirmReference, who(req));
  });

  // ---- Klanten (AVG: inzage en anonimiseren) ----
  app.get('/api/admin/guests', { schema: { querystring: { type: 'object', properties: { q: { type: 'string', maxLength: 100 } } } } }, async (req) => {
    const q = req.query.q ? `%${req.query.q.replace(/[%_\\]/g, '\\$&')}%` : null;
    const { rows } = await pool.query(
      `SELECT g.id, g.first_name, g.last_name, g.email, g.phone, g.language, g.anonymized_at, count(b.id) AS bookings, max(b.check_in) AS last_stay
         FROM guests g LEFT JOIN bookings b ON b.guest_id = g.id
        WHERE $1::text IS NULL OR (g.first_name || ' ' || coalesce(g.last_name,'') ILIKE $1 OR g.email ILIKE $1 OR g.phone ILIKE $1)
        GROUP BY g.id ORDER BY max(b.check_in) DESC NULLS LAST LIMIT 200`, [q]);
    return { items: rows };
  });

  app.get('/api/admin/guests/:id/export', { schema: { params: ID } }, async (req) => {
    requireOwner(req.admin);
    const g = (await pool.query('SELECT * FROM guests WHERE id = $1', [req.params.id])).rows[0];
    if (!g) throw notFound();
    const b = (await pool.query(`SELECT reference, check_in, check_out, guests_count, status, total_cents, remarks, created_at FROM bookings WHERE guest_id = $1 ORDER BY check_in`, [g.id])).rows;
    await audit(pool, { ...who(req), action: 'guest.export', entity: 'guest', entityId: g.id });
    return { guest: g, bookings: b, exportedAt: new Date().toISOString() };
  });

  app.post('/api/admin/guests/:id/anonymize', { schema: { params: ID } }, async (req) => {
    requireOwner(req.admin);
    return tx(pool, async (db) => {
      const active = await db.query(`SELECT 1 FROM bookings WHERE guest_id = $1 AND status IN ('new','confirmed') AND check_out >= $2`, [req.params.id, todayIn(cfg.timezone)]);
      if (active.rowCount) throw conflict('still_active', 'Deze klant heeft nog actieve boekingen');
      const r = await db.query(`UPDATE guests SET first_name='Geanonimiseerd', last_name=NULL, email=NULL, phone=NULL, anonymized_at=now() WHERE id=$1`, [req.params.id]);
      if (!r.rowCount) throw notFound();
      await db.query('UPDATE bookings SET remarks = NULL, manage_token_hash = NULL WHERE guest_id = $1', [req.params.id]);
      await db.query('DELETE FROM booking_notes WHERE booking_id IN (SELECT id FROM bookings WHERE guest_id = $1)', [req.params.id]);
      await audit(db, { ...who(req), action: 'guest.anonymize', entity: 'guest', entityId: req.params.id });
      return { ok: true };
    });
  });

  // ---- Blokkades (vakantie, onderhoud, eigen gebruik) ----
  app.post('/api/admin/blocks', {
    schema: { body: { type: 'object', additionalProperties: false, required: ['unitIds', 'startDate', 'endDate'], properties: {
      unitIds: { type: 'array', minItems: 1, items: { type: 'integer' } }, startDate: DATE, endDate: DATE,
      reason: { type: 'string', maxLength: 200 }, force: { type: 'boolean' } } } },
  }, async (req) => {
    const { unitIds, startDate, endDate, reason, force } = req.body;
    if (!isDate(startDate) || !isDate(endDate) || endDate <= startDate) throw bad('invalid_range', 'Einddatum moet na de begindatum liggen');
    return tx(pool, async (db) => {
      const ids = [];
      for (const unitId of [...new Set(unitIds)].sort()) {
        const u = await db.query('SELECT id FROM units WHERE id = $1 FOR UPDATE', [unitId]);
        if (!u.rowCount) throw notFound('Appartement niet gevonden');
        const clash = await db.query(`SELECT reference FROM bookings WHERE unit_id=$1 AND status IN ('new','confirmed') AND occupancy && daterange($2::date,$3::date,'[)')`, [unitId, startDate, endDate]);
        if (clash.rowCount && !force) throw conflict('overlaps_bookings', `Er liggen boekingen in deze periode: ${clash.rows.map((r) => r.reference).join(', ')}`);
        const { rows } = await db.query(`INSERT INTO blocks (unit_id, start_date, end_date, reason) VALUES ($1,$2,$3,$4) RETURNING id`, [unitId, startDate, endDate, reason || null]);
        ids.push(rows[0].id);
      }
      await audit(db, { ...who(req), action: 'block.create', entity: 'block', entityId: ids.join(','), details: { unitIds, startDate, endDate, reason } });
      return { ids };
    });
  });

  app.delete('/api/admin/blocks/:id', { schema: { params: ID } }, async (req) => {
    const r = await pool.query(`DELETE FROM blocks WHERE id = $1 AND source = 'manual' RETURNING unit_id, start_date, end_date`, [req.params.id]);
    if (!r.rowCount) throw notFound('Blokkade niet gevonden (geïmporteerde blokkades verwijdert u in het externe kanaal)');
    await audit(pool, { ...who(req), action: 'block.delete', entity: 'block', entityId: req.params.id, details: r.rows[0] });
    return { ok: true };
  });

  // ---- Instellingen ----
  app.get('/api/admin/settings', async () => ({ settings: await getSettings(pool) }));
  app.put('/api/admin/settings', { schema: { body: { type: 'object', minProperties: 1 } } }, async (req) => {
    requireOwner(req.admin);
    const before = await getSettings(pool);
    const r = await saveSettings(pool, req.body);
    if (r.errors) throw new AppError(422, 'invalid_settings', r.errors.join('; '), { errors: r.errors });
    const changed = Object.fromEntries(Object.keys(req.body).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(req.body[k])).map((k) => [k, { from: before[k], to: req.body[k] }]));
    await audit(pool, { ...who(req), action: 'settings.update', details: changed });
    return { settings: r.settings };
  });

  // ---- Appartementen en prijsperiodes ----
  app.get('/api/admin/units', async () => {
    const { rows } = await pool.query('SELECT id, slug, name, max_guests, base_price_cents, active, sort_order, ical_export_token FROM units ORDER BY sort_order, id');
    return { items: rows.map((u) => ({ ...u, ical_export_url: `${cfg.publicApiUrl}/ical/unit/${u.ical_export_token}.ics` })) };
  });
  app.patch('/api/admin/units/:id', {
    schema: { params: ID, body: { type: 'object', additionalProperties: false, properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 }, max_guests: { type: 'integer', minimum: 1, maximum: 20 },
      base_price_cents: { type: 'integer', minimum: 0, maximum: 10000000 }, active: { type: 'boolean' } } } },
  }, async (req) => {
    requireOwner(req.admin);
    const b = req.body;
    const r = await pool.query(
      `UPDATE units SET name = COALESCE($2, name), max_guests = COALESCE($3, max_guests), base_price_cents = COALESCE($4, base_price_cents),
              active = COALESCE($5, active) WHERE id = $1 RETURNING id, name, max_guests, base_price_cents, active`,
      [req.params.id, b.name ?? null, b.max_guests ?? null, b.base_price_cents ?? null, b.active ?? null]);
    if (!r.rowCount) throw notFound();
    await audit(pool, { ...who(req), action: 'unit.update', entity: 'unit', entityId: req.params.id, details: b });
    return { unit: r.rows[0] };
  });

  app.get('/api/admin/rate-periods', async () => {
    const { rows } = await pool.query(`SELECT r.*, u.name AS unit_name FROM rate_periods r JOIN units u ON u.id=r.unit_id WHERE r.end_date >= $1 ORDER BY r.start_date`, [addDays(todayIn(cfg.timezone), -30)]);
    return { items: rows };
  });
  app.post('/api/admin/rate-periods', {
    schema: { body: { type: 'object', additionalProperties: false, required: ['unitIds', 'startDate', 'endDate'], properties: {
      unitIds: { type: 'array', minItems: 1, items: { type: 'integer' } }, startDate: DATE, endDate: DATE,
      priceCents: { type: 'integer', minimum: 0 }, minNights: { type: 'integer', minimum: 1, maximum: 365 }, note: { type: 'string', maxLength: 200 } } } },
  }, async (req) => {
    requireOwner(req.admin);
    const b = req.body;
    if (!isDate(b.startDate) || !isDate(b.endDate) || b.endDate <= b.startDate) throw bad('invalid_range', 'Einddatum moet na de begindatum liggen');
    if (b.priceCents == null && b.minNights == null) throw bad('validation', 'Vul een prijs en/of minimum aantal nachten in');
    const ids = [];
    for (const u of b.unitIds) {
      const { rows } = await pool.query('INSERT INTO rate_periods (unit_id, start_date, end_date, price_cents, min_nights, note) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
        [u, b.startDate, b.endDate, b.priceCents ?? null, b.minNights ?? null, b.note || null]);
      ids.push(rows[0].id);
    }
    await audit(pool, { ...who(req), action: 'rate_period.create', details: b });
    return { ids };
  });
  app.delete('/api/admin/rate-periods/:id', { schema: { params: ID } }, async (req) => {
    requireOwner(req.admin);
    const r = await pool.query('DELETE FROM rate_periods WHERE id = $1 RETURNING *', [req.params.id]);
    if (!r.rowCount) throw notFound();
    await audit(pool, { ...who(req), action: 'rate_period.delete', details: r.rows[0] });
    return { ok: true };
  });

  // ---- iCal-koppelingen ----
  const feedOut = (f) => ({ ...f, export_url: `${cfg.publicApiUrl}/ical/feed/${f.export_token}.ics` });
  app.get('/api/admin/ical-feeds', async () => {
    const { rows } = await pool.query('SELECT f.*, u.name AS unit_name FROM ical_feeds f JOIN units u ON u.id=f.unit_id ORDER BY u.sort_order, f.id');
    return { items: rows.map(feedOut) };
  });
  const urlSchema = { anyOf: [{ type: 'string', pattern: '^https://', maxLength: 1000 }, { type: 'string', maxLength: 0 }] };
  app.post('/api/admin/ical-feeds', {
    schema: { body: { type: 'object', additionalProperties: false, required: ['unitId', 'name'], properties: { unitId: { type: 'integer' }, name: { type: 'string', minLength: 1, maxLength: 60 }, importUrl: urlSchema } } },
  }, async (req) => {
    requireOwner(req.admin);
    const { rows } = await pool.query('INSERT INTO ical_feeds (unit_id, name, import_url, export_token) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.body.unitId, req.body.name, req.body.importUrl || null, randomToken(24)]);
    await audit(pool, { ...who(req), action: 'ical.create', entity: 'ical_feed', entityId: rows[0].id, details: { name: req.body.name } });
    if (rows[0].import_url) await syncFeed(pool, ctx, rows[0].id);
    return { feed: feedOut(rows[0]) };
  });
  app.patch('/api/admin/ical-feeds/:id', {
    schema: { params: ID, body: { type: 'object', additionalProperties: false, properties: { name: { type: 'string', minLength: 1, maxLength: 60 }, importUrl: urlSchema, active: { type: 'boolean' } } } },
  }, async (req) => {
    requireOwner(req.admin);
    const b = req.body;
    const r = await pool.query(
      `UPDATE ical_feeds SET name = COALESCE($2, name), import_url = CASE WHEN $3::boolean THEN NULLIF($4, '') ELSE import_url END,
              active = COALESCE($5, active) WHERE id = $1 RETURNING *`,
      [req.params.id, b.name ?? null, b.importUrl !== undefined, b.importUrl ?? null, b.active ?? null]);
    if (!r.rowCount) throw notFound();
    if (!r.rows[0].import_url || !r.rows[0].active) await pool.query('DELETE FROM blocks WHERE feed_id = $1', [req.params.id]);
    await audit(pool, { ...who(req), action: 'ical.update', entity: 'ical_feed', entityId: req.params.id, details: { name: b.name, active: b.active, urlChanged: b.importUrl !== undefined } });
    return { feed: feedOut(r.rows[0]) };
  });
  app.delete('/api/admin/ical-feeds/:id', { schema: { params: ID } }, async (req) => {
    requireOwner(req.admin);
    const r = await pool.query('DELETE FROM ical_feeds WHERE id = $1 RETURNING name', [req.params.id]);
    if (!r.rowCount) throw notFound();
    await audit(pool, { ...who(req), action: 'ical.delete', entity: 'ical_feed', entityId: req.params.id, details: r.rows[0] });
    return { ok: true };
  });
  app.post('/api/admin/ical-feeds/:id/sync', { schema: { params: ID } }, async (req) => syncFeed(pool, ctx, req.params.id));

  // ---- Beheerders (rollen) ----
  app.get('/api/admin/admins', async (req) => {
    requireOwner(req.admin);
    const { rows } = await pool.query('SELECT id, email, name, role, active, last_login_at, created_at, locked_until FROM admins ORDER BY id');
    return { items: rows };
  });
  app.post('/api/admin/admins', {
    schema: { body: { type: 'object', additionalProperties: false, required: ['email', 'name', 'password', 'role'], properties: {
      email: { type: 'string', format: 'email', maxLength: 200 }, name: { type: 'string', minLength: 1, maxLength: 100 },
      password: { type: 'string', maxLength: 200 }, role: { type: 'string', enum: ['owner', 'staff'] } } } },
  }, async (req) => {
    requireOwner(req.admin);
    const p = passwordProblem(req.body.password);
    if (p) throw bad('weak_password', p);
    try {
      const { rows } = await pool.query('INSERT INTO admins (email, name, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, email, name, role, active',
        [req.body.email.trim(), req.body.name.trim(), await hashPassword(req.body.password), req.body.role]);
      await audit(pool, { ...who(req), action: 'admin.create', entity: 'admin', entityId: rows[0].id, details: { email: rows[0].email, role: rows[0].role } });
      return { admin: rows[0] };
    } catch (e) {
      if (e.code === '23505') throw conflict('email_in_use', 'Er bestaat al een beheerder met dit e-mailadres');
      throw e;
    }
  });
  app.patch('/api/admin/admins/:id', {
    schema: { params: ID, body: { type: 'object', additionalProperties: false, properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 }, role: { type: 'string', enum: ['owner', 'staff'] }, active: { type: 'boolean' },
      password: { type: 'string', maxLength: 200 } } } },
  }, async (req) => {
    requireOwner(req.admin);
    const b = req.body;
    if (req.params.id === req.admin.id && (b.active === false || b.role === 'staff')) throw bad('self_lockout', 'U kunt uzelf niet deactiveren of degraderen');
    if (b.password) { const p = passwordProblem(b.password); if (p) throw bad('weak_password', p); }
    const r = await pool.query(
      `UPDATE admins SET name = COALESCE($2, name), role = COALESCE($3::admin_role, role), active = COALESCE($4, active),
              password_hash = COALESCE($5, password_hash), failed_attempts = 0, locked_until = NULL WHERE id = $1
        RETURNING id, email, name, role, active`,
      [req.params.id, b.name ?? null, b.role ?? null, b.active ?? null, b.password ? await hashPassword(b.password) : null]);
    if (!r.rowCount) throw notFound();
    if (b.active === false || b.password) await pool.query('DELETE FROM sessions WHERE admin_id = $1', [req.params.id]);
    await audit(pool, { ...who(req), action: 'admin.update', entity: 'admin', entityId: req.params.id, details: { role: b.role, active: b.active, passwordReset: !!b.password } });
    return { admin: r.rows[0] };
  });

  // ---- Logboek, export en e-mailtest ----
  app.get('/api/admin/audit', { schema: { querystring: { type: 'object', properties: { offset: { type: 'integer', minimum: 0, default: 0 } } } } }, async (req) => {
    requireOwner(req.admin);
    const { rows } = await pool.query('SELECT id, actor, action, entity, entity_id, details, created_at FROM audit_log ORDER BY id DESC LIMIT 100 OFFSET $1', [req.query.offset]);
    return { items: rows };
  });

  app.get('/api/admin/export/bookings.csv', async (req, reply) => {
    requireOwner(req.admin);
    const { rows } = await pool.query(
      `SELECT b.reference, u.name AS appartement, b.check_in AS aankomst, b.check_out AS vertrek, b.guests_count AS gasten, b.status,
              round(b.total_cents/100.0, 2) AS totaal_eur, g.first_name AS voornaam, g.last_name AS achternaam, g.email, g.phone AS telefoon,
              b.source AS bron, b.created_at AS aangemaakt
         FROM bookings b JOIN units u ON u.id=b.unit_id JOIN guests g ON g.id=b.guest_id ORDER BY b.check_in`);
    const cols = rows.length ? Object.keys(rows[0]) : ['reference'];
    const cell = (v) => {
      let s = v instanceof Date ? v.toISOString() : String(v ?? '');
      if (/^[=+\-@]/.test(s)) s = "'" + s; // voorkomt formule-injectie in Excel
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    await audit(pool, { ...who(req), action: 'export.bookings', details: { rows: rows.length } });
    reply.type('text/csv; charset=utf-8').header('Content-Disposition', `attachment; filename="boekingen-${todayIn(cfg.timezone)}.csv"`);
    return '﻿' + [cols.join(';'), ...rows.map((r) => cols.map((c) => cell(r[c])).join(';'))].join('\n');
  });

  app.post('/api/admin/test-email', async (req) => {
    requireOwner(req.admin);
    const s = await getSettings(pool);
    await queueAdminMail(pool, cfg, s, 'admin_test', null);
    await audit(pool, { ...who(req), action: 'email.test' });
    return { ok: true, to: s.admin_notify_email, mode: cfg.mail.transport };
  });
}
