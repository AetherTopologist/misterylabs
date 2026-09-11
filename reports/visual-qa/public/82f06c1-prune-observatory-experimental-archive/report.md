# Public UI verification — prune Observatory experimental archive

Commit: `82f06c17038298e8c8a9d2012037f5a4c852c726`
Message: `fix(public): prune Observatory experimental archive`

## File

`src/pages/Observatory.tsx` only.

## What changed

1. Deleted `cathedral-probe` from `FIXTURES`
2. Deleted Difference Fixture teaser card
3. Deleted `<section id="experimental">` Experimental Archive
4. Removed derived `experimental` array
5. Removed Experimental / Placeholder filter button
6. Removed unused `statusClass`, `layerLabel`, `ResonanceSphere` import, and imported `type Fixture` (local `interface Fixture` preserved)

Did not touch `#optical-portal`, other fixtures, `FixtureCard.tsx`, layout/spacing, or xPRIMEray semantics.

## Viewports

Local `vite preview`, production basename `/misterylabs/`. Default theme: light.

| File | Size | Surface |
|---|---|---|
| `before/mobile-390.png` | 390×844 | `/observatory` landing |
| `after/mobile-390.png` | 390×844 | `/observatory` landing |
| `before/desktop-1440.png` | 1440×900 | `/observatory` landing |
| `after/desktop-1440.png` | 1440×900 | `/observatory` landing |
| `before/filters-*.png` | element | filter bar with Experimental / Placeholder |
| `after/filters-*.png` | element | All / Mature / Public / Research only |
| `before/experimental-*.png` | element | Experimental Archive |
| `after/research-desktop-1440.png` | element | Research fixtures without Difference teaser |
| `after/after-research-desktop-1440.png` | 1440×900 | Resonance Spheres; no experimental shell |
| `before/optical-portal-desktop-1440.png` | element | `#optical-portal` before |
| `after/optical-portal-desktop-1440.png` | element | `#optical-portal` after |

## Verification

- `/observatory` HTTP 200 at 390×844 and 1440×900
- Canonical fixtures remain (6)
- Research fixture remains (Atomic Orbital GRIN Room)
- `#optical-portal` present and unchanged
- Resonance Spheres heading/embed present
- filters: All / Mature / Public / Research only; all clickable
- no Experimental Archive / Cathedral Probe / Difference Fixture
- no new console / page errors

## Adjacent findings (not fixed)

- mobile 390×844 document `overflowX` = 95 (pre-existing; also seen on other Observatory-adjacent surfaces)
- Layer 3 legend item remains in the filter legend (`Layer 3: Performance (gated)`)
- `FixtureStatus` still includes unused `"experimental" | "placeholder"` union members
