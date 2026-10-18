require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const pool = require('./db/pool');
const { assertJwtSecret, parseCorsOrigins, isOriginAllowed } = require('./lib/config');
const { redactToken } = require('./lib/redact');
const { HttpError } = require('./lib/httpError');
const { apiLimiter } = require('./middleware/rateLimit');
const { UPLOAD_ROOT } = require('./middleware/upload');

const isProduction = process.env.NODE_ENV === 'production';
const WEB_DIST = path.join(__dirname, '..', '..', 'web', 'dist');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // Set TRUST_PROXY=1 behind a reverse proxy so rate limits see the real client IP.
  if (process.env.TRUST_PROXY) {
    const v = process.env.TRUST_PROXY;
    app.set('trust proxy', /^\d+$/.test(v) ? Number(v) : v === 'true' ? true : v);
  }

  app.use(helmet({
    // Uploaded images/resumes and the API are consumed by web apps on other origins.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        mediaSrc: ["'self'", 'blob:'],
        workerSrc: ["'self'", 'blob:'],
        connectSrc: ["'self'", 'data:', 'blob:'],
        objectSrc: ["'none'"],
        // Plain-http localhost must keep working in development.
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
  }));

  const origins = parseCorsOrigins(process.env.CORS_ORIGINS);
  app.use(cors({
    origin: (origin, cb) => cb(null, isOriginAllowed(origin, { origins, nodeEnv: process.env.NODE_ENV })),
    maxAge: 600,
  }));

  // Never log the ?token= JWT used by the CSV download.
  morgan.token('url', (req) => redactToken(req.originalUrl || req.url));
  if (process.env.NODE_ENV !== 'test') app.use(morgan(isProduction ? 'combined' : 'dev'));

  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', database: 'connected', time: new Date().toISOString() });
    } catch (err) {
      console.error('Health check failed:', err.message);
      res.status(503).json({ status: 'error', database: 'unreachable', error: 'Maʼlumotlar bazasi mavjud emas' });
    }
  });

  app.use('/api', apiLimiter);
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/jobs', require('./routes/jobs'));
  app.use('/api/applications', require('./routes/applications'));
  app.use('/api/interviews', require('./routes/interviews'));
  app.use('/api/notifications', require('./routes/notifications'));
  app.use('/api/me', require('./routes/me'));
  app.use('/api/admin', require('./routes/admin'));

  app.use('/uploads', express.static(UPLOAD_ROOT, { index: false, fallthrough: true }));

  // Unknown API / upload paths get JSON, never the SPA shell.
  app.use(['/api', '/uploads'], (req, res) => {
    res.status(404).json({ error: `Yoʻnalish topilmadi: ${req.method} ${req.path}` });
  });

  // Serve the built web app (and its /admin console) with an SPA fallback, when present.
  if (fs.existsSync(path.join(WEB_DIST, 'index.html'))) {
    app.use(express.static(WEB_DIST, { index: false }));
    app.get('*', (req, res, next) => {
      if (path.extname(req.path)) return next(); // missing asset: real 404
      return res.sendFile(path.join(WEB_DIST, 'index.html'));
    });
  }

  app.use((req, res) => {
    res.status(404).json({ error: `Yoʻnalish topilmadi: ${req.method} ${req.path}` });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (err && err.name === 'MulterError') {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Yuklangan fayl juda katta'
        : err.code === 'LIMIT_UNEXPECTED_FILE' ? 'Kutilmagan fayl maydoni'
          : 'Yuklash xatosi';
      return res.status(400).json({ error: message });
    }
    if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Soʻrov tanasi yaroqli JSON emas' });
    if (err && err.type === 'entity.too.large') return res.status(413).json({ error: 'Soʻrov tanasi juda katta' });
    console.error(err); // details stay in the server log, never in the response
    return res.status(500).json({ error: 'Server ichki xatosi' });
  });

  return app;
}

function start() {
  try {
    assertJwtSecret(); // refuses a missing secret, and the placeholder/short one in production
  } catch (err) {
    console.error(`Refusing to start: ${err.message}`);
    process.exit(1);
  }
  const port = Number(process.env.PORT) || 3000;
  const server = createApp().listen(port, () => {
    console.log(`Ilmgo API running on http://localhost:${port}`);
  });
  const shutdown = () => {
    server.close(() => pool.end().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  return server;
}

if (require.main === module) start();

module.exports = { createApp, start };
