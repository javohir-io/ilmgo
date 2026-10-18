/** Environment validation helpers (pure; take `env` so tests can inject it). */

const JWT_PLACEHOLDER = 'change-this-to-a-long-random-string';
const DEV_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

/** Throws if JWT_SECRET is unusable; returns the secret otherwise. */
function assertJwtSecret(env = process.env) {
  const secret = env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set. Copy .env.example to .env and set a long random value.');
  if (env.NODE_ENV === 'production') {
    if (secret === JWT_PLACEHOLDER) throw new Error('JWT_SECRET is still the placeholder value; refusing to start in production.');
    if (secret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }
  return secret;
}

/** Splits CORS_ORIGINS (comma separated) into a clean list. */
function parseCorsOrigins(value) {
  return String(value || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
}

/**
 * Decides whether a request Origin may call the API.
 *  - no Origin header (curl, mobile apps, same-origin) -> allowed
 *  - CORS_ORIGINS unset -> localhost dev origins only
 *  - '*' in the list -> everything, but only outside production
 */
function isOriginAllowed(origin, { origins = [], nodeEnv } = {}) {
  if (!origin) return true;
  if (origins.length === 0) return DEV_ORIGIN_RE.test(origin);
  if (origins.includes('*') && nodeEnv !== 'production') return true;
  return origins.includes(origin.replace(/\/$/, ''));
}

module.exports = { JWT_PLACEHOLDER, assertJwtSecret, parseCorsOrigins, isOriginAllowed };
