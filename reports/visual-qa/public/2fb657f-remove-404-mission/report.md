# Public UI verification — remove Mission Control from 404 recovery

Commit: `2fb657f4c460f9002e0b6503c6200977ac4ce647`
Message: `fix(public): remove Mission Control from 404 recovery`

## Scope

`src/pages/NotFound.tsx`, `ROUTES` array only.

Remove:

`{ to: "/mission", label: "Mission" }`

Preserve Home, Atlas, Archive, Research, and Media exactly.

This changes 404 discoverability, not route existence.

## What changed

Removed the Mission chip from the 404 Known Routes grid.

Preserved:

- Home, Atlas, Archive, Research, Media chips
- 404 copy, layout, primary Return to Observatory CTA
- `/mission` as a direct route
- `/dashboard`, `/projects/:id`
- Mission Control internals, routing, banners

## Routes / viewports

Local `vite preview`, production basename `/misterylabs/`.

Witness route: `/misterylabs/this-route-does-not-exist`

| File | Size | Surface |
|---|---|---|
| `before/mobile-390.png` | 390×844 | 404 Known Routes includes Mission |
| `after/mobile-390.png` | 390×844 | 404 Known Routes without Mission |
| `before/desktop-1440.png` | 1440×900 | 404 Known Routes includes Mission |
| `after/desktop-1440.png` | 1440×900 | 404 Known Routes without Mission |

## Verification

- 404 HTTP 200 (SPA fallback) at 390×844 and 1440×900
- before: Known Routes includes Mission → `/mission`
- after: Mission chip gone; Home, Atlas, Archive, Research, Media unchanged
- direct `/mission`: HTTP 200, Mission Control renders, no login wall
- no document `overflowX`
- no new console / page errors (pre-existing `console.error("404 — route not found: …")` remains)

## Adjacent findings (not fixed)

- Mission Control sticky-header overlap (M1 deferred)
- Axis labels `n(x)` / `n(0)` still clip at 390×844 (M2 deferred)
