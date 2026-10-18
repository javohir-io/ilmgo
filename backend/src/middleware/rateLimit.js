const rateLimit = require('express-rate-limit');

const tooMany = (message) => (req, res) => res.status(429).json({ error: message });

/** Login / register: 20 attempts per 15 minutes per IP. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooMany('Juda koʻp urinish boʻldi. Bir necha daqiqadan keyin qayta urinib koʻring.'),
});

/** General API: 300 requests per minute per IP. */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooMany('Juda koʻp soʻrov yuborildi. Iltimos, sekinroq harakat qiling.'),
});

module.exports = { authLimiter, apiLimiter };
