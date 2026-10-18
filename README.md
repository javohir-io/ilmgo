# Ilmgo

**Kampusdan karyeragacha, bitta orbitada.** (_From campus to career, in one orbit._) A university internship and career-services platform: students discover roles that match their skills, apply with a resume, track every application and book interviews; admins run the whole pipeline from a web console.

| Part | Folder | Stack |
|---|---|---|
| Student mobile app | [`app/`](app) | Flutter, dark aurora-glass UI, Uzbek |
| Web: landing, public jobs, **admin console** | [`web/`](web) | React + Vite, react-three-fiber, GSAP, ShaderGradient |
| API | [`backend/`](backend) | Node, Express, PostgreSQL |
| Contracts and design language | [`docs/`](docs) | `API.md`, `DESIGN.md` |

## Language and palette

The whole product (web, app, API messages and seed data) is in **Uzbek**. The brand palette is Dark Azure `#00638E`, Paper White, Onyx `#000000`/`#141414`, Charcoal `#2B2B2B`, Light Azure `#BFD8E3` with the `#000000 → #004A6B → #00638E → #8CB9CC` branding gradient; see [`docs/DESIGN.md`](docs/DESIGN.md). API enums stay English and are translated by the clients.

## What's in it

- **Match score**: every job shows how well it fits the student's skills, which skills matched and which are missing.
- **Application pipeline**: Yuborilgan, Koʻrib chiqilmoqda, Intervyu, Taklif (yoki Rad etilgan / Bekor qilingan) with a timeline of every status change and in-app notifications.
- **Interview booking**: real 30-minute weekday slots; double-booking is impossible (database-enforced), and a 409 reloads the slots.
- **Admin console**: overview charts, jobs CRUD, drag-and-drop kanban for applications, interview calendar, student list, CSV export. Admin is a database role, not a shared secret.
- **Polish**: dark aurora background, liquid-glass surfaces, 3D hero, page-scroll choreography, reduced-motion support, skeletons, empty and error states everywhere.

## Run it (about 5 minutes)

```bash
# 1. API + database
cd backend
npm install
cp .env.example .env            # set JWT_SECRET
docker compose up -d            # PostgreSQL (or point DATABASE_URL at your own)
npm run migrate && npm run seed:demo
npm run dev                     # http://localhost:3000

# 2. Web (second terminal)
cd web && npm install && npm run dev      # http://localhost:5173, admin at /admin

# 3. Mobile (third terminal)
cd app
flutter create . --platforms=android,ios,web    # once: generates platform folders
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000   # Android emulator; use http://localhost:3000 for iOS sim / web
```

Demo logins: student `demo@ilmgo.uz` / `Demo1234!`, admin `admin@ilmgo.uz` / `Admin123!`. Seed data uses fictional companies.

## Honest status

| Part | Verified how |
|---|---|
| `backend/` | 35 unit tests pass, and the API was exercised against a real PostgreSQL 16 instance (schema, seeds, auth, applications, slot conflicts, admin routes). |
| `web/` | **Never built or run.** It was written where the npm registry was unreachable, so only `npm run check` (syntax, imports, CSS tokens, icon names) was run. Expect small first-build fixes, most likely in `src/three/` (library version details). |
| `app/` | **Never compiled or run.** There was no Flutter SDK. `node scripts/check.mjs` checks brackets, imports and identifiers; run `flutter analyze` first and fix whatever it reports. |

## Upgrading from the earlier "Launchpad" build

The database is now named `ilmgo` (see `backend/.env.example` and `docker-compose.yml`). An existing local `launchpad` database is not migrated; point `DATABASE_URL` at a fresh one and run `npm run migrate && npm run seed:demo`.

## Credits

Techniques adapted from public repos: AThevon/genjutsu, lottiefiles/motion-design-skill, zanwei/design-dna, cloudai-x/threejs-skills, greensock/gsap-skills, pmndrs/react-three-fiber, dashersw/liquid-glass-js, ruucm/shadergradient, collidingScopes/liquid-logo. Glass and logo effects are our own implementations, not copies.
