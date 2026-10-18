# Ilmgo backend

Express + PostgreSQL REST API (CommonJS, Node 18+). The API contract lives in
[`../docs/API.md`](../docs/API.md); that file is the source of truth for every endpoint, request and response shape.

## Setup

```bash
cd backend
npm install
cp .env.example .env        # then edit JWT_SECRET (and ADMIN_PASSWORD)
docker compose up -d        # PostgreSQL 16 on localhost:5432 (user/password/db: ilmgo)
npm run migrate             # schema + 10 sample jobs + admin account
npm run seed:demo           # optional: demo student and ~12 fake students with applications
npm run dev                 # http://localhost:3000
```

Without Docker, create any PostgreSQL database and point `DATABASE_URL` at it.

## Scripts

| Script | What it does |
|---|---|
| `npm start` | Run the API (`node src/server.js`) |
| `npm run dev` | Same, restarting on file changes |
| `npm run migrate` | Applies `src/db/schema.sql` (idempotent), seeds jobs if the table is empty, creates the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` if missing |
| `npm run seed:demo` | Idempotent demo data: `demo@ilmgo.uz` / `Demo1234!` (applications in several statuses, a scheduled interview, notifications, saved jobs) plus 12 fake students (`student01@example.test`...) with applications over the last 14 days. Run `migrate` first |
| `npm test` | Unit tests (`node --test`), no database needed |

Seeded accounts: admin `admin@ilmgo.uz` / `Admin123!` (unless `ADMIN_EMAIL`/`ADMIN_PASSWORD` are set), student `demo@ilmgo.uz` / `Demo1234!`.

## Configuration (`.env`)

| Variable | Notes |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Required. In production the server refuses to start if it is missing, the placeholder, or under 32 characters |
| `JWT_EXPIRES_IN` | Default `7d` |
| `CORS_ORIGINS` | Comma-separated allowed browser origins. Unset allows localhost only; `*` is ignored in production |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used by `npm run migrate`. In production the default password is never used |
| `TRUST_PROXY` | Number of proxy hops when behind a reverse proxy, so rate limits use real client IPs |
| `PORT`, `NODE_ENV`, `DB_POOL_MAX` | Optional |

## Endpoints

See [`../docs/API.md`](../docs/API.md). Also: `GET /api/health`, static `/uploads/*`, and, if `../web/dist` exists, the built web app at `/` (SPA fallback; the admin console is under `/admin`). Unknown `/api/*` paths return a JSON 404.

## Project layout

```
src/
  server.js        app wiring, security middleware, error handler
  db/              pool, schema.sql, migrate.js, seedJobs.js, seedDemo.js
  routes/          auth, jobs, applications, interviews, notifications, me, admin
  repositories/    all SQL, one file per area
  services/        status changes (event + notification), job personalisation
  middleware/      auth (JWT, role from DB), rate limits, uploads
  lib/             validation, CSV, slots, match score, config
test/              node:test unit tests
```

## Security notes

- Passwords are hashed with bcrypt; login does a constant-work comparison for unknown emails.
- Admin access is a role stored in the database (checked on every request, not trusted from the token). There is no shared admin secret.
- `?token=` is accepted only on `GET /api/admin/applications.csv` (browser downloads cannot send headers) and is redacted from access logs. Prefer the `Authorization` header elsewhere.
- Helmet (with a CSP) is enabled; CORS is an allow-list; auth endpoints are limited to 20 attempts per 15 minutes per IP and the API to 300 requests per minute.
- Uploads: extension allow-list, size limits (resume 10 MB, images 5 MB), magic-byte check, generated filenames. Resumes are served from `/uploads` by unguessable UUID names, so treat that folder as semi-public; use private object storage for real data.
- Errors never include stack traces or SQL details; multer errors map to 400.
- All SQL is parameterised; LIKE wildcards in search input are escaped.
