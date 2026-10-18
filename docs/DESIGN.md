# Ilmgo — design language

**Name:** Ilmgo. **Tagline:** "Kampusdan karyeragacha, bitta orbitada."
**Concept:** a university career hub that feels like a product you'd actually want to open — dark, luminous, glassy, with motion that explains state (not decoration). Everything a student does is a step on a pipeline: *Discover → Apply → Interview → Offer*.

## Language and name
The product is called **Ilmgo**. All user-facing text on web and in the app is **Uzbek (Latin script)**. API enum values (`Internship`, `submitted`, ...) stay English; clients map them to Uzbek labels (`web/src/lib/i18n.js`, `app/lib/utils/labels.dart`). Orthography: `oʻ` / `gʻ` use U+02BB, the tutuq belgisi uses U+02BC; dates use Uzbek month/weekday names and a 24-hour clock.

## Palette (from the Ilmgo brand sheet)
| Name | Value | Use |
|---|---|---|
| Dark Azure | `#00638E` | primary fills, links on dark surfaces' fills |
| Paper White | `#FFFFFF` | text, offer/success |
| Onyx | `#000000` | app background |
| Onyx 2 | `#141414` | raised surfaces |
| Charcoal | `#2B2B2B` | borders, chips, inputs |
| Light Azure | `#BFD8E3` | highlights; muted text at 72% / faint at 50% |
| Branding gradient | `#000000 → #004A6B → #00638E → #8CB9CC` | hero, backdrops, splash |

Derived additions (outside the sheet, used sparingly): `azure-bright #2E9BCB` (a lighter tint of Dark Azure, only where azure must read as text/icon on black) and `danger #FF6B6B` (functional: errors, destructive actions, "rejected").

## Tokens (shared by web + Flutter)
| Token | Value |
|---|---|
| bg / bgRaised / charcoal | `#000000` / `#141414` / `#2B2B2B` |
| glass fill | `rgba(255,255,255,0.06)`; hover `0.10` |
| glass stroke | `rgba(191,216,227,0.14)` (hover/rim `0.26`) |
| text · muted · faint | `#FFFFFF` · `#8A9CA3` · `#606C71` |
| azure · azure-deep · sky · mist · paper | `#00638E` · `#004A6B` · `#8CB9CC` · `#BFD8E3` · `#FFFFFF` |
| fill gradient (buttons, active states) | azure → azure-deep, 135°, white text |
| aurora gradient (accents, charts) | azure → sky → mist, 135° |
| radii | 12 · 18 · 26 · pill |
| display font | Space Grotesk (600/700, tight tracking −0.02em) |
| body font | Inter (400/500/600) |
| blur | 24px backdrop blur + saturate(140%) on glass |

Status colours: submitted = sky, reviewing = mist, interview = azure-bright, offer = paper (white), rejected = danger, withdrawn = muted.

## Motion rules (from the motion-design / genjutsu / GSAP guidance)
- Define one *interaction thesis*: **"things arrive from depth and settle"** — entrances translate 16–24px up + fade + slight blur-to-sharp; exits are faster than entrances.
- Durations: micro feedback 120–180ms · state/UI transitions 250–400ms · hero/scroll reveals 600–900ms. Ease: entrances `cubic-bezier(.16,1,.3,1)` (expo-out), exits `cubic-bezier(.7,0,.84,0)`.
- Stagger 50–70ms between siblings, never more than ~10 items staggered.
- Animate transform + opacity only. No layout-property animation.
- Always honour reduced motion: no parallax/stagger/looping; keep opacity-only fades.
- Every interactive element has hover (desktop), pressed (scale .97) and focus-visible states; touch targets ≥ 44px.

## Signature elements
1. **Aurora mesh background** — slow-moving gradient (ShaderGradient on web, animated blurred radial blobs painter in Flutter) + subtle film grain.
2. **Liquid glass surfaces** — translucent, blurred, bright top-left rim light, soft inner glow, 1px stroke.
3. **Match ring** — circular progress showing how well a job fits the student's skills (0–100).
4. **Pipeline** — Yuborilgan → Koʻrib chiqilmoqda → Intervyu → Taklif shown as a connected timeline with colour-coded nodes.
5. **Liquid-metal logo mark** — a rounded "L"/orbit mark rendered with a flowing metallic shader on web hero, static gradient elsewhere.
