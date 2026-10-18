const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { assertJwtSecret } = require('../lib/config');
const { HttpError } = require('../lib/httpError');
const { asyncHandler } = require('../lib/asyncHandler');

const expiresIn = () => process.env.JWT_EXPIRES_IN || '7d';

/** Signs a session token. Payload: { sub: userId, role }. */
function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, assertJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: expiresIn(),
  });
}

/** Returns the user id inside a Bearer header, or null if absent/invalid/expired. */
function userIdFromHeader(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), assertJwtSecret(), { algorithms: ['HS256'] });
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Requires a valid token; sets req.userId. */
function authMiddleware(req, res, next) {
  if (!(req.headers.authorization || '').startsWith('Bearer ')) {
    return next(new HttpError(401, 'Avtorizatsiya tokeni yoʻq'));
  }
  const userId = userIdFromHeader(req);
  if (!userId) return next(new HttpError(401, 'Token yaroqsiz yoki muddati tugagan'));
  req.userId = userId;
  return next();
}

/** Sets req.userId when a valid token is present; otherwise carries on anonymously. */
function optionalAuth(req, res, next) {
  req.userId = userIdFromHeader(req) || undefined;
  next();
}

/**
 * Lets browser downloads (which cannot set headers) authenticate with `?token=`.
 * Only mount it on routes that need it; an explicit Authorization header wins.
 */
function tokenFromQuery(req, res, next) {
  if (!req.headers.authorization && typeof req.query.token === 'string' && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}

/** Requires an authenticated admin. The role is read from the database, never from the token. */
const requireAdmin = [
  authMiddleware,
  asyncHandler(async (req, res, next) => {
    const { rows } = await pool.query('SELECT role FROM users WHERE id = $1', [req.userId]);
    if (!rows[0]) throw new HttpError(401, 'Hisob endi mavjud emas');
    if (rows[0].role !== 'admin') throw new HttpError(403, 'Administrator huquqi talab qilinadi');
    next();
  }),
];

module.exports = { signToken, authMiddleware, optionalAuth, requireAdmin, tokenFromQuery };
