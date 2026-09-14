# Public UI verification — xPRIMEray semantic-seam narrow fix

Commit: `549ca921ae2ce79a313c3f186739444276c1b2cf`
Message: `fix(public): tighten xPRIMEray semantic seam`

No data models, routes, or xPRIMEray engine semantics were changed.
`XENO_CITATIONS`, `ATLAS_ENTRIES`, `INSPIRATIONS`, and `src/data/resonance_spheres_data.ts` were not touched.
No visual containment/badge system was added. No M4 work.

## Old → new copy

### 1. `src/pages/observatory/Quaternion.tsx`
- old: `Every 3D rotation in xPRIMEray's curved-transport field is encoded as a unit quaternion — four numbers (x, y, z, w) that compress a rotation axis and angle into a single algebraic object. This is the same mathematical structure that tracks ray orientations across the GRIN field boundary.`
- new: `Every 3D rotation can be encoded as a unit quaternion — four numbers (x, y, z, w) that compress a rotation axis and angle into a single algebraic object. Curved-transport renderers can use the same structure to track orientation across field boundaries.`

### 2. `src/pages/observatory/PoissonDot.tsx`
- old last sentence: `This models the boundary conditions xPRIMEray's GRIN field traversal encounters near wormhole seam and curved-transport inversion zones.`
- new last sentence: `This models boundary behavior a curved-transport renderer can encounter near an index-inversion seam.`

### 3. `src/pages/Research.tsx` H1
- old: `Research`
- new: `xPRIMEray Research`
- route remains `/research`. Navigation unchanged. `ACTIVE_SYSTEMS` / `PORTALS` / `TECH_DOCS` / `RESEARCH_DOMAINS` unchanged.

### 4. `src/components/ResonanceSpheresAtlas.tsx`
- added muted line under `SIGNAL RESONANCE`:
  `Interpretive resonance, not xPRIMEray documentation.`
- `expanded.node.xprimeRayAlignment` content unchanged.

## Verification

Local `vite preview`, basename `/misterylabs/`.
Routes: `/observatory/quaternion`, `/observatory/poisson-dot`, `/research`, `/observatory/resonance-spheres`.
Viewports: 390×844 and 1440×900. Themes: light and dark.

| Check | Result |
|---|---|
| build | PASS |
| new console errors | none (PASS) |
| Quaternion unhedged internals claim gone | PASS |
| Poisson unhedged internals claim gone | PASS |
| Research H1 exactly `xPRIMEray Research` | PASS |
| Resonance disclaimer exact | PASS |
| interactive components unchanged | PASS (copy-only) |

## Adjacent findings (not fixed)

- Shared `SiteFooter` still says “powered by xPRIMEray Observatory” on every page, including Quaternion and Poisson Dot. Out of allowed-file scope.
- `/observatory/resonance-spheres` mobile 390×844 `overflowX` = 95 (pre-existing).
- Research still shows a pulsing “Observatory Active” status (out of this pass).
