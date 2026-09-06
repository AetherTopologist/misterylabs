# Public UI verification — harden runtime foundation

Commit: `796bee5` `fix(public): harden runtime foundation`

## Routes

Captured:

- `/misterylabs/observatory` (Home of ResonanceSphere + gallery)
- `/misterylabs/broch-sphere`
- `/misterylabs/observatory/resonance-spheres` (after, canvas close-up)
- `/misterylabs/observatory/transport-sphere` (control — not modified)

Also verified locally against Vite `base: '/misterylabs/'` with **no `.env` file**:

- `/misterylabs/`
- `/misterylabs/observatory`
- `/misterylabs/observatory/resonance-spheres`
- `/misterylabs/observatory/fractal-inspiration`
- `/misterylabs/observatory/transport-sphere`
- `/misterylabs/broch-sphere` (including Receiver / Story Arc)

## Viewports

Minimum: 390×844 and 1440×900. Themes: `myl-theme` light and dark.

Production basename: `/misterylabs/`.

## What changed

1. Broch Sphere: `GraphLine` returns null when either endpoint node is missing. Dangling `s-myl` references no longer crash the SPA. Node model unchanged; `s-myl` was not added.
2. ResonanceSphere: CSS HSL channel tokens are wrapped as `hsl(...)` before canvas color APIs. Transport Sphere SVG untouched.
3. Resonance data: the wormhole contact-sheet texture/hero URLs now use `import.meta.env.BASE_URL`. Other raw `/assets/observatory_atlas/...` paths were left in place (deferred).

## What was verified

- Production build with no `VITE_SUPABASE_*` and no `.env`
- `/broch-sphere` renders header + prototype graph; no `longitude` TypeError; light/dark; 390 and 1440; Receiver/Story Arc does not crash
- ResonanceSphere routes (`/observatory`, `/observatory/resonance-spheres`, `/observatory/fractal-inspiration`) have no `addColorStop` error; light/dark
- Transport Sphere control remains clean
- `/misterylabs/assets/overview/wormhole_structure_contact_sheet.png` → 200 `image/png`
- Observatory/resonance pages no longer request `/assets/overview/wormhole_structure_contact_sheet.png` at site root

## What was not verified

- Live GitHub Pages after deploy
- Publishing unpublished `observatory_atlas` images into `public/`
- Adding or removing `s-myl` as a node (architecture-gated)

## Deferred similar asset-path findings

Still raw `/assets/...` in `src/data/resonance_spheres_data.ts` (not in `public/`, SPA HTML fallback if prefixed):

- `/assets/observatory_atlas/observer-disagreement-hero.png`
- `/assets/observatory_atlas/hermetic-closure-hero.png`
- `/assets/observatory_atlas/wormhole-dual-reality-curvature-map.png`
- `/assets/observatory_atlas/wormhole-dual-reality-full-stack.png`
- `/assets/observatory_atlas/hermetic-hit-closure-storyboard.png`
