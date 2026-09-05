# Visual QA — Apple of the Eye (frozen Polar GRIN port)

- Route: `/observatory/polar-grin` (unchanged)
- Basename: `/misterylabs/`
- Parent HEAD: `b382470` (kick-halo Polar GRIN)
- Viewports: 390×844 and 1440×900
- Production preview: `vite preview` on `/misterylabs/observatory/polar-grin`
- Hard refresh: 200 (SPA `404.html` fallback intact)
- Overflow: none (390 and 1440)
- Console: clean

## Frozen reference tuple (acceptance gate)

TARGET: θ=0° · feature scale=0.50× · recess=2.00×

| State | Ribbon | RED | STEM | ESC |
| --- | --- | --- | --- | --- |
| FIELD OFF | `eeeesrrrrrr` | 6 | 1 | 4 |
| FIELD ON CENTER HIGH A=0.60 w=2.40 | `rrrsrrrrrrr` | 10 | 1 | 0 |

ΔRED = +4. Inspector ray 04: STEM, launch (80.0, 65.0), terminal (393.2, 150.5). HEART-EYE 11 cells. Not 11/11.

## Notes

- Replaces the old kick-halo / WITNESS-bead / FIELD OFF→BEND→SHADOW→WRAP→REVEAL instrument in place.
- Scientific semantics from frozen App Builder commit `0444cf0`. Destination shell (Vite + React Router + GitHub Pages) unchanged.
- ONE FIELD · TWO READOUTS. HEART-EYE is the same `RayPath[]` as MIND. No second ray population.
- Recess / scale / θ change the object. Field changes transport. Stem/leaf never scale to 0.
- n = 1 + A g, n ≥ 1. No negative index. No Dome inversion. No xPRIMEray engine claim. Not a cloaking proof.
- Honest result is field-driven partial reassignment (B). Measured 11/11 exists only where FIELD OFF already hid features.

## Files

- `before/mobile-390.png` — kick-halo Polar GRIN Apple at `b382470`
- `before/desktop-1440.png`
- `after/mobile-390.png` — Apple of the Eye first screen
- `after/desktop-1440.png`
- `after/mobile-off-heart.png` / `after/mobile-on-heart.png`
- `after/desktop-off-heart.png` / `after/desktop-on-heart.png`
- `after/mobile-on-viewport.png` / `after/desktop-on-viewport.png`
- `after/mobile-inspector.png` / `after/desktop-inspector.png`
