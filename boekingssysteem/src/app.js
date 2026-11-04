import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fstatic from '@fastify/static';
import { AppError } from './lib/errors.js';
import { hmac } from './lib/security.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function buildApp({ cfg, pool, logger = true }) {
  const app = Fastify({
    logger: logger === true ? { level: cfg.logLevel, redact: ['req.headers.cookie', 'req.headers["x-csrf-token"]'] } : logger,
    trustProxy: cfg.trustProxy,
    bodyLimit: 64 * 1024,
    ajv: { customOptions: { removeAdditional: false, coerceTypes: 'array', allErrors: false } },
  });
  const log = app.log;

  // IP-adressen worden alleen gehasht opgeslagen (privacy)
  app.decorateRequest('ipHash', null);
  app.addHook('onRequest', async (req) => { req.ipHash = hmac(cfg.appSecret, req.ip).slice(0, 16); });

  await app.register(helmet, {
    contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], styleSrc: ["'self'", 'https://fonts.googleapis.com'], fontSrc: ["'self'", 'https://fonts.gstatic.com'], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"], frameAncestors: ["'none'"], formAction: ["'self'"], upgradeInsecureRequests: cfg.cookieSecure ? [] : null } },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
  await app.register(cookie);
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute', keyGenerator: (req) => req.ip });
  // CORS alleen voor de openbare API, en alleen voor de eigen website
  await app.register(cors, {
    delegator: (req, cb) => {
      const isPublic = (req.url || '').startsWith('/api/public/');
      cb(null, isPublic ? { origin: cfg.corsOrigins, methods: ['GET', 'POST'], maxAge: 600 } : { origin: false });
    },
  });

  app.setErrorHandler((err, req, reply) => {
    if (err.validation) {
      return reply.code(400).send({ error: 'validation', message: 'Controleer de ingevulde gegevens', details: err.validation.map((v) => ({ field: v.instancePath || v.params?.missingProperty, message: v.message })) });
    }
    if (err.statusCode === 429 && !(err instanceof AppError)) return reply.code(429).send({ error: 'rate_limited', message: 'Te veel verzoeken. Probeer het over enkele minuten opnieuw.' });
    if (err.statusCode && err.statusCode < 500) {
      return reply.code(err.statusCode).send({ error: err.code || 'error', message: err.message, details: err.details });
    }
    req.log.error(err);
    return reply.code(500).send({ error: 'server_error', message: 'Er ging iets mis. Probeer het later opnieuw.' });
  });

  await app.register(publicRoutes, { pool, cfg, log });
  await app.register(adminRoutes, { pool, cfg, log });

  // Beheerdashboard (statische bestanden)
  await app.register(fstatic, { root: path.join(root, 'admin'), prefix: '/beheer/', index: 'index.html', cacheControl: false });
  app.addHook('onSend', async (req, reply) => { if (req.url.startsWith('/beheer') || req.url.startsWith('/api/')) reply.header('Cache-Control', 'no-store'); });
  app.get('/beheer', (req, reply) => reply.redirect('/beheer/'));
  app.get('/', (req, reply) => reply.redirect(cfg.publicSiteUrl + '/boeken.html'));

  return app;
}
