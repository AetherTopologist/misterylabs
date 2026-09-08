# Public UI verification — improve mobile transport labels

Commit: `699ac734824e0d951aad6d7dc8d7cde06b77d13d`
Message: `fix(public): improve mobile transport labels`

## Root cause

`src/components/TransportSphereViz.tsx` owns the chips.

The SVG uses `viewBox="0 0 1200 700"` and `preserveAspectRatio="xMidYMid slice"`. On Home the viz fills a `min-height: 100svh` hero. At 390×844 that slice shows only ~323 user-x units centered on CX=600, i.e. roughly `[438, 762]`.

The chips were 200×34 at `x=368` and `x=632` (span 368–832). `STRAIGHT TRANSPORT` overflowed ~50 px left; `CURVED TRANSPORT` overflowed ~40 px right. No document horizontal scroll (`overflow: hidden` on the hero).

`/observatory/transport-sphere` uses a shorter `h-[55vh]` frame, so the same chips were already fully visible there before the fix.

Ray paths, clip paths, and transport geometry were not changed.

## What changed

Moved and narrowed the annotation chips so they sit inside ~`[452, 748]`, with slightly tighter letter-spacing so the full strings fit the chip.

## Routes / viewports

Local `vite preview`, production basename `/misterylabs/`.

| File | Size | Surface |
|---|---|---|
| `before/mobile-390.png` | 390×844 | Home dark (clip) |
| `after/mobile-390.png` | 390×844 | Home dark (fixed) |
| `before/desktop-1440.png` | 1440×900 | Home dark |
| `after/desktop-1440.png` | 1440×900 | Home dark |
| `before/transport-sphere-mobile-390.png` | 390×844 | `/observatory/transport-sphere` dark |
| `after/transport-sphere-mobile-390.png` | 390×844 | `/observatory/transport-sphere` dark |
| `before/transport-sphere-desktop-1440.png` | 1440×900 | `/observatory/transport-sphere` dark |
| `after/transport-sphere-desktop-1440.png` | 1440×900 | `/observatory/transport-sphere` dark |
| `before/home-light-mobile-390.png` | 390×844 | Home light (clip) |
| `after/home-light-mobile-390.png` | 390×844 | Home light (fixed) |

## Verification

- Home 390×844 dark/light: `STRAIGHT TRANSPORT` and `CURVED TRANSPORT` fully in viewport (before: clipped; after: ok)
- Home 1440×900 dark/light: both labels fully visible
- `/observatory/transport-sphere` 390×844 and 1440×900 dark/light: both labels fully visible
- no new console / page errors
- no document `overflowX`
- ray-path code untouched

## Adjacent findings (not fixed)

- Axis labels `n(x)` / `n(0)` still clip at 390×844 on Home and on `/observatory/transport-sphere` (they sit at the sphere's left/right extremities, outside the slice window).
- `NotFound.tsx` still exposes `/mission` in 404 recovery (M1 deferred).
- Mission Control sticky-header overlap (M1 deferred).
