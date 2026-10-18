# Ilmgo — web

The marketing site, public job browser and **admin console** for Ilmgo. React 18 + Vite, plain CSS driven by design tokens.

| Route | What it is |
|---|---|
| `/` | Landing page: aurora background, 3D hero, featured-jobs marquee, pinned "How it works", bento features, app section |
| `/jobs`, `/jobs/:id` | Public job browser (search, filters, skill chips, sort) and job detail |
| `/admin` | Admin console (sign in with an admin account): overview charts, jobs CRUD, kanban applications, interviews, students |

## Run it

```bash
cd web
npm install
npm run dev          # http://localhost:5173  (proxies /api and /uploads to :3000)
npm run build        # outputs web/dist
npm run check        # offline sanity checks (syntax, imports, CSS variables, icons)
```

The backend (`../backend`) serves `web/dist` at `/` automatically once it exists, so in production a single `node src/server.js` serves API + site + admin.
Optional env: `VITE_API_URL` (API origin when the site is hosted separately).
Dev admin login: `admin@ilmgo.uz` / `Admin123!` (created by `npm run migrate` in the backend).

> **Honest status:** this project was authored in a sandbox with no npm access, so `npm install && npm run build` has never been run against it. `npm run check` (syntax, import resolution, exported names, CSS tokens, icon names) passes; expect to fix small version-specific details on first build, most likely in `src/three/ShaderLayer.jsx` (ShaderGradient props) or `src/three/HeroScene.jsx` (drei/three versions).

## Where each technique comes from

| Reference repo | Applied as |
|---|---|
| **shadergradient** | `three/ShaderLayer.jsx` — animated aurora mesh behind every public page (`lazyLoad`, `lightType="3d"` so nothing is fetched from a CDN). |
| **react-three-fiber** + **threejs-skills** | `three/HeroScene.jsx` — chrome orb (`MeshDistortMaterial`), orbit rings, sparks; `Lightformer` environment (offline), `dpr` clamp, frame-rate independent damping, render loop paused off-screen / hidden tab. |
| **gsap-skills** | `useGSAP` with scope + cleanup, `gsap.matchMedia()` for reduced-motion/mobile, SplitText hero reveal, ScrollTrigger pin + scrub in *How it works*, `Flip` for the animated jobs list, transform + autoAlpha only. Plugins registered once in `lib/gsap.js`. |
| **motion-design-skill** + **genjutsu** | One interaction thesis ("things arrive from depth and settle"), expo-out entrances, faster exits, 50–70 ms stagger capped at ~10 items, reduced-motion path for everything (see `docs/DESIGN.md`, `lib/motion.js`). |
| **design-dna** | Everything reads from `styles/tokens.css` (colour, type, radii, motion, layers); `npm run check` fails on undefined tokens. |
| **liquid-glass-js** | `components/LiquidGlass.jsx` — **the SVG-filter variant**: a generated displacement map + `feSpecularLighting` rim refract the backdrop in Chromium; other browsers get blur glass. (The original uses html2canvas + WebGL, which is fragile; this is our own implementation, not a port.) |
| **liquid-logo** | `components/LiquidLogo.jsx` — fragment shader (simplex noise, edge-driven flow, metallic palette) over the logo mark rendered to an offscreen canvas; static SVG fallback. Own implementation. |

## Robustness

Every WebGL piece sits in an `ErrorBoundary` + `Suspense` + `lazy()` with a pure-CSS fallback; WebGL / reduced-motion / low-power detection lives in `lib/env.js`; 3D never blocks content. `vite.config.js` splits `three`, `r3f` and `gsap` into separate chunks so the shell paints first.

## Structure

```
src/
  admin/        Admin console (Overview, Jobs, Applications kanban, Interviews, Students)
  components/   Shared UI (glass, drawer, toast, confirm, command palette, match ring, …)
  lib/          api client, auth, hooks, GSAP setup, env detection, sample data fallback
  pages/        Landing (+ landing/ sections), Jobs, JobDetail, NotFound
  styles/       tokens.css → base.css → app.css → page CSS
  three/        ShaderLayer (background) and HeroScene (3D hero)
```
