import crypto from 'node:crypto';

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
export const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
export const hmac = (secret, s) => crypto.createHmac('sha256', secret).update(String(s)).digest('hex');

// Boekingsreferentie zonder verwarrende tekens (0/O, 1/I/L)
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export function bookingReference() {
  const bytes = crypto.randomBytes(6);
  let out = 'IV-';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
