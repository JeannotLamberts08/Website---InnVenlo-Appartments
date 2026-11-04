// Fout met HTTP-status en een stabiele code die de frontend kan vertalen.
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message || code);
    this.statusCode = status;
    this.code = code;
    this.details = details;
  }
}
export const bad = (code, msg, details) => new AppError(400, code, msg, details);
export const notFound = (msg = 'Niet gevonden') => new AppError(404, 'not_found', msg);
export const forbidden = (msg = 'Geen toegang') => new AppError(403, 'forbidden', msg);
export const conflict = (code, msg) => new AppError(409, code, msg);
