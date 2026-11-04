// Centrale configuratie uit omgevingsvariabelen (.env). Geheimen staan nooit in de code.
function bool(v, d = false) {
  if (v === undefined || v === '') return d;
  return ['1', 'true', 'yes', 'ja'].includes(String(v).toLowerCase());
}
function list(v) {
  return (v || '').split(',').map((s) => s.trim()).filter(Boolean);
}

export function loadConfig(env = process.env) {
  const cfg = {
    env: env.NODE_ENV || 'development',
    port: Number(env.PORT || 3000),
    host: env.HOST || '0.0.0.0',
    databaseUrl: env.DATABASE_URL || 'postgres://postgres@localhost:5432/innvenlo',
    // Publieke adressen
    publicSiteUrl: (env.PUBLIC_SITE_URL || 'https://www.innvenlo.nl').replace(/\/$/, ''),
    publicApiUrl: (env.PUBLIC_API_URL || 'https://boeken.innvenlo.nl').replace(/\/$/, ''),
    corsOrigins: list(env.CORS_ORIGINS || 'https://www.innvenlo.nl,https://innvenlo.nl'),
    trustProxy: bool(env.TRUST_PROXY, true),
    cookieSecure: bool(env.COOKIE_SECURE, true),
    sessionHours: Number(env.SESSION_HOURS || 12),
    // Geheim voor het hashen van IP-adressen in logs (privacy)
    appSecret: env.APP_SECRET || '',
    timezone: 'Europe/Amsterdam',
    // E-mail
    mail: {
      transport: env.MAIL_TRANSPORT || (env.SMTP_HOST ? 'smtp' : 'log'), // smtp | log
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 587),
      secure: bool(env.SMTP_SECURE, false),
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      from: env.MAIL_FROM || 'InnVenlo Apartments <jamb.lamberts@ziggo.nl>',
      replyTo: env.MAIL_REPLY_TO || '',
    },
    scheduler: bool(env.SCHEDULER, true),
    logLevel: env.LOG_LEVEL || 'info',
  };
  if (cfg.env === 'production') {
    if (!cfg.appSecret || cfg.appSecret.length < 32) throw new Error('APP_SECRET ontbreekt of is korter dan 32 tekens');
  } else if (!cfg.appSecret) {
    cfg.appSecret = 'dev-secret-niet-voor-productie-gebruiken-0000';
  }
  return cfg;
}
