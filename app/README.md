# Ilmgo: student app (Flutter)

Dark aurora-glass mobile app for students. Talks to the Ilmgo API in `../backend` (contract: `../docs/API.md`, design language: `../docs/DESIGN.md`).

## Run

```bash
flutter create . --platforms=android,ios,web   # once, generates android/ ios/ web/
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

`10.0.2.2` is the Android emulator's alias for your machine; use `http://localhost:3000` on iOS simulator or web. Physical device: use your computer's LAN IP. Demo login: `demo@ilmgo.uz` / `Demo1234!`.

## Screens

Splash, onboarding (3 pages), sign in / register (password strength), then five tabs behind a floating glass nav:
**Discover** (stat tiles, next interview, top matches carousel, search, filters, sort), **Saved**, **Pipeline** (filters, 4-stage track) with application detail (timeline, withdraw), **Inbox** (unread, deep links), **Me** (completeness ring, skills, interviews, edit profile with photo).
Flows: job detail with match breakdown, 3-step apply wizard (resume upload, 10 MB cap), interview scheduling (weekday calendar, live slots, conflict handling) and confirmation (confetti, copy `.ics`, cancel).

## Layout

```
lib/
  main.dart            app + aurora background
  theme/               tokens (colours, radii, motion, type)
  models/ services/    JSON models, one service per API area
  state/app_state.dart ChangeNotifier + InheritedNotifier, Load<T> per slice
  widgets/             glass card, match ring, chips, nav, skeletons...
  screens/             auth, shell, discover, jobs, apply, pipeline, interviews, inbox, profile
scripts/check.mjs      offline sanity check (node scripts/check.mjs)
```

## Status

Written without a Flutter SDK available: it has **not** been compiled. `node scripts/check.mjs` passes (brackets, imports, identifiers), but run `flutter analyze` and fix what it finds before anything else.
