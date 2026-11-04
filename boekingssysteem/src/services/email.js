import nodemailer from 'nodemailer';
import { adminMail, guestMail } from './mailtexts.js';

// Transport: 'smtp' (echte verzending via uw eigen SMTP-server/verzenddienst) of 'log' (alleen loggen; voor testen).
export function createTransport(mailCfg, log) {
  if (mailCfg.transport === 'smtp') {
    const t = nodemailer.createTransport({
      host: mailCfg.host, port: mailCfg.port, secure: mailCfg.secure,
      auth: mailCfg.user ? { user: mailCfg.user, pass: mailCfg.pass } : undefined,
    });
    return { kind: 'smtp', send: (msg) => t.sendMail(msg), verify: () => t.verify() };
  }
  const sent = [];
  return {
    kind: 'log', sent,
    send: async (msg) => { sent.push(msg); log?.info?.({ to: msg.to, subject: msg.subject }, 'E-mail (log-modus, niet verzonden)'); },
    verify: async () => true,
  };
}

async function enqueue(db, { bookingId = null, kind, to, subject, text, html, sendAfter = null }) {
  if (!to) return;
  await db.query(
    `INSERT INTO email_outbox (booking_id, kind, to_address, subject, body_text, body_html, send_after)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, now()))`,
    [bookingId, kind, to, subject, text, html, sendAfter],
  );
}

// Wordt binnen de boekingstransactie aangeroepen: de mail staat dus alleen in de wachtrij als de boeking echt is opgeslagen.
export async function queueGuestMail(db, cfg, settings, kind, booking, opts = {}) {
  const m = guestMail(kind, booking, settings, opts);
  await enqueue(db, { bookingId: booking.id, kind, to: booking.email, ...m });
}

export async function queueAdminMail(db, cfg, settings, kind, booking, extra) {
  const adminUrl = booking ? `${cfg.publicApiUrl}/beheer/#/boeking/${booking.id}` : `${cfg.publicApiUrl}/beheer/`;
  const m = adminMail(kind, booking, settings, { adminUrl, extra });
  await enqueue(db, { bookingId: booking?.id ?? null, kind, to: settings.admin_notify_email, ...m });
}

// Verwerkt de wachtrij. Mislukte verzending wordt opnieuw geprobeerd met oplopende wachttijd (max. 8 pogingen).
export async function processOutbox(pool, cfg, transport, log, limit = 20) {
  const client = await pool.connect();
  let processed = 0;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT * FROM email_outbox WHERE status = 'pending' AND send_after <= now()
        ORDER BY id LIMIT $1 FOR UPDATE SKIP LOCKED`, [limit]);
    for (const m of rows) {
      try {
        await transport.send({
          from: cfg.mail.from, to: m.to_address, replyTo: cfg.mail.replyTo || undefined,
          subject: m.subject, text: m.body_text, html: m.body_html,
        });
        await client.query("UPDATE email_outbox SET status = 'sent', sent_at = now(), attempts = attempts + 1, last_error = NULL WHERE id = $1", [m.id]);
      } catch (err) {
        const attempts = m.attempts + 1;
        const failed = attempts >= 8;
        await client.query(
          `UPDATE email_outbox SET attempts = $2, last_error = $3, status = $4,
             send_after = now() + make_interval(mins => $5) WHERE id = $1`,
          [m.id, attempts, String(err.message).slice(0, 500), failed ? 'failed' : 'pending', 2 ** attempts]);
        log?.warn?.({ id: m.id, err: err.message }, 'E-mail verzenden mislukt');
      }
      processed++;
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
  return processed;
}
