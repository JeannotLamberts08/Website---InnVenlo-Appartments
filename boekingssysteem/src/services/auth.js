import argon2 from 'argon2';
import { forbidden } from '../lib/errors.js';
import { randomToken, sha256 } from '../lib/security.js';
import { audit } from './audit.js';

export const COOKIE = 'iv_session';
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

export const hashPassword = (pw) => argon2.hash(pw, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });

export function passwordProblem(pw) {
  if (typeof pw !== 'string' || pw.length < 12) return 'Wachtwoord moet minimaal 12 tekens hebben';
  if (pw.length > 200) return 'Wachtwoord is te lang';
  if (!/[a-zA-Z]/.test(pw) || !/[^a-zA-Z]/.test(pw)) return 'Gebruik letters én cijfers of leestekens';
  return null;
}

// Vaste dummy-hash zodat een onbekend e-mailadres even lang duurt als een fout wachtwoord (geen gebruikersopsomming).
let dummyHash;

export async function login(pool, cfg, email, password, meta) {
  dummyHash ??= await hashPassword('dummy-wachtwoord-123');
  const { rows } = await pool.query('SELECT * FROM admins WHERE lower(email) = lower($1)', [email]);
  const a = rows[0];
  if (!a || !a.active) {
    await argon2.verify(dummyHash, password).catch(() => false);
    await audit(pool, { actor: String(email).slice(0, 100), action: 'auth.login_failed', ip: meta.ip });
    return { error: 'invalid' };
  }
  if (a.locked_until && new Date(a.locked_until) > new Date()) {
    await audit(pool, { admin: a, action: 'auth.login_locked', ip: meta.ip });
    return { error: 'locked' };
  }
  const ok = await argon2.verify(a.password_hash, password).catch(() => false);
  if (!ok) {
    const fails = a.failed_attempts + 1;
    await pool.query(
      `UPDATE admins SET failed_attempts = $2, locked_until = CASE WHEN $3 THEN now() + make_interval(mins => $4) END WHERE id = $1`,
      [a.id, fails >= MAX_FAILS ? 0 : fails, fails >= MAX_FAILS, LOCK_MINUTES]);
    await audit(pool, { admin: a, action: 'auth.login_failed', ip: meta.ip, details: { attempt: fails } });
    return { error: fails >= MAX_FAILS ? 'locked' : 'invalid' };
  }
  const token = randomToken(32);
  const csrf = randomToken(24);
  await pool.query(
    `INSERT INTO sessions (token_hash, admin_id, csrf_token, expires_at, ip, user_agent)
     VALUES ($1, $2, $3, now() + make_interval(hours => $4), $5, $6)`,
    [sha256(token), a.id, csrf, cfg.sessionHours, meta.ip, String(meta.userAgent || '').slice(0, 300)]);
  await pool.query('UPDATE admins SET failed_attempts = 0, locked_until = NULL, last_login_at = now() WHERE id = $1', [a.id]);
  await audit(pool, { admin: a, action: 'auth.login', ip: meta.ip });
  return { token, csrf, admin: publicAdmin(a) };
}

export const publicAdmin = (a) => ({ id: a.id, email: a.email, name: a.name, role: a.role });

export async function sessionFromToken(pool, token) {
  if (!token || token.length > 100) return null;
  const { rows } = await pool.query(
    `SELECT s.csrf_token, a.* FROM sessions s JOIN admins a ON a.id = s.admin_id
      WHERE s.token_hash = $1 AND s.expires_at > now() AND a.active`, [sha256(token)]);
  return rows[0] ? { admin: rows[0], csrf: rows[0].csrf_token } : null;
}

export async function logout(pool, token) {
  if (token) await pool.query('DELETE FROM sessions WHERE token_hash = $1', [sha256(token)]);
}

export function requireOwner(admin) {
  if (admin.role !== 'owner') throw forbidden('Alleen de eigenaar mag dit doen');
}
