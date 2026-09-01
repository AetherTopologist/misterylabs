# Public UI verification — first-screen lab contract

Implementation commit: [`6932ff3`](https://github.com/AetherTopologist/misterylabs/commit/6932ff322f3a60e5f77d85d9bc3535974389dc85)  
Parent: `1e30652`  
Message: `feat(public): establish first-screen lab contract`

## Routes

Captured:

- `/misterylabs/` (home hero + header)

Checked locally against Vite `base: '/misterylabs/'` (not re-checked on live GitHub Pages after deploy):

- `/misterylabs/`
- `/misterylabs/observatory/transport-sphere`
- `/misterylabs/observatory`
- `/misterylabs/atlas`
- `/misterylabs/observatory#optical-portal`

## Viewports

| File | Size | Source |
|---|---|---|
| `before/mobile-390.png` | 390×844 | Public Commit #1, live GitHub Pages before `6932ff3` |
| `before/desktop-1440.png` | 1440×900 | Recaptured from `1e30652` locally — original PC1 session only had 1280×800 |
| `after/mobile-390.png` | 390×844 | Public Commit #1, local `/misterylabs/` |
| `after/desktop-1440.png` | 1440×900 | Public Commit #1, local `/misterylabs/` |

Production basename: `/misterylabs/`.

## What changed

Touched files in `6932ff3`:

- `src/components/AppHeader.tsx`
- `src/pages/Index.tsx`

Header: `MisterY Labs` wordmark was `hidden sm:block` (invisible at 390px). It is now always visible. “Gateway Observatory” stays `hidden sm:block`.

Hero:

- Charter sentence, verbatim: “xPRIMEray is the upstream scientific instrument. MisterY Labs is the public laboratory surrounding it.”
- One primary CTA: “See the straight-vs-curved transport comparison” → `/observatory/transport-sphere` (does not claim manipulation)
- Two `/atlas` buttons collapsed to one demoted Atlas link
- Broken `href="/observatory/#optical-portal"` replaced with `<Link to="/observatory#optical-portal">`
- Godot demo removed from the first fold

## What was verified

- Wordmark visible at 390×844 after the change; hidden before
- Charter sentence present after
- Primary CTA `href` = `/misterylabs/observatory/transport-sphere`
- Optical Transport Illusion `href` = `/misterylabs/observatory#optical-portal`
- `#optical-portal` present in the Observatory DOM
- Transport-sphere, observatory, and atlas routes resolve under `/misterylabs/` (HTTP 200 locally)
- No remaining `href="/...` in the touched files that would skip the basename
- No unrelated source files in `6932ff3`

## What was not verified

- Live GitHub Pages after `6932ff3` deployed
- Transport Sphere interactivity (exhibit is static; out of scope)
- Light theme
- Viewports other than 390×844 and 1440×900 (a 1280×800 after-shot exists in the original session notes only)
- Generator scripts (`visual:qa`, `capture:screens`, `release:artifacts`)

## Known 1280×800 hero-height limitation

The hero section uses `min-height: 100svh` and can grow. After the extra charter sentence, a **1280×800** first screen can clip the primary CTA below the fold. The CTA is in view at **390×844** and **1440×900**. Archive desktop evidence at 1440×900 for that reason. Do not treat 1280×800 as the desktop contract for this change.
