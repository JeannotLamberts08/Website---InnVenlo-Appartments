import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createPool } from './db.js';
import { migrate } from './migrate.js';
import { createTransport } from './services/email.js';
import { startScheduler } from './services/scheduler.js';

const cfg = loadConfig();
const pool = createPool(cfg.databaseUrl);
const app = await buildApp({ cfg, pool });
await migrate(pool, app.log);
const transport = createTransport(cfg.mail, app.log);
if (cfg.mail.transport === 'log') app.log.warn('E-mail staat in log-modus: berichten worden NIET verzonden. Stel SMTP_HOST e.d. in.');
const stop = cfg.scheduler ? startScheduler(pool, { cfg, log: app.log }, transport) : () => {};

await app.listen({ port: cfg.port, host: cfg.host });

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    stop();
    await app.close();
    await pool.end();
    process.exit(0);
  });
}
