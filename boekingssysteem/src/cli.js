// Beheeropdrachten: migraties draaien, beheerder aanmaken, wachtwoord resetten, e-mailverbinding testen.
import { createInterface } from 'node:readline/promises';
import { loadConfig } from './config.js';
import { createPool } from './db.js';
import { migrate } from './migrate.js';
import { hashPassword, passwordProblem } from './services/auth.js';
import { audit } from './services/audit.js';
import { createTransport } from './services/email.js';

const [cmd, ...args] = process.argv.slice(2);
const cfg = loadConfig();
const pool = createPool(cfg.databaseUrl);
const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => rl.question(q);

async function askPassword() {
  const pw = process.env.ADMIN_PASSWORD || (await ask('Wachtwoord (min. 12 tekens): '));
  const p = passwordProblem(pw);
  if (p) throw new Error(p);
  return pw;
}

try {
  if (cmd === 'migrate') {
    await migrate(pool);
  } else if (cmd === 'create-admin') {
    await migrate(pool);
    const email = args[0] || (await ask('E-mailadres: '));
    const name = args[1] || (await ask('Naam: '));
    const role = args[2] || 'owner';
    const hash = await hashPassword(await askPassword());
    await pool.query('INSERT INTO admins (email, name, password_hash, role) VALUES ($1,$2,$3,$4)', [email.trim(), name.trim(), hash, role]);
    await audit(pool, { actor: 'cli', action: 'admin.create', details: { email, role } });
    console.log(`Beheerder ${email} (${role}) aangemaakt.`);
  } else if (cmd === 'reset-password') {
    const email = args[0] || (await ask('E-mailadres: '));
    const hash = await hashPassword(await askPassword());
    const r = await pool.query('UPDATE admins SET password_hash=$2, failed_attempts=0, locked_until=NULL, active=true WHERE lower(email)=lower($1)', [email, hash]);
    if (!r.rowCount) throw new Error('Beheerder niet gevonden');
    await pool.query('DELETE FROM sessions WHERE admin_id IN (SELECT id FROM admins WHERE lower(email)=lower($1))', [email]);
    await audit(pool, { actor: 'cli', action: 'admin.password_reset', details: { email } });
    console.log('Wachtwoord gewijzigd; alle sessies van deze beheerder zijn beëindigd.');
  } else if (cmd === 'verify-smtp') {
    const t = createTransport(cfg.mail, console);
    await t.verify();
    console.log(`SMTP-verbinding in orde (modus: ${t.kind}).`);
  } else {
    console.log('Gebruik: node src/cli.js <migrate | create-admin [email naam rol] | reset-password [email] | verify-smtp>');
  }
} catch (e) {
  console.error('Fout:', e.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await pool.end();
}
