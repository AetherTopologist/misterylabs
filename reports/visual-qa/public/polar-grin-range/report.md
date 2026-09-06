# Visual QA — Polar GRIN exploration range

- Route: `/observatory/polar-grin`
- Parent: `67c03cf` (live Apple of the Eye)
- Viewports: 390×844 and 1440×900
- Basename: `/misterylabs/`
- Change: UI range only. θ ∈ [−90, +90]. A_MAX 1.20 → 1.50. n ∈ [1.00, 2.50].
- Physics: unchanged (`n = 1 + A g`, launch, occupancy, classifier).

## Checks

- Frozen honest pair still `eeeesrrrrrr` → `rrrsrrrrrrr`
- Slider `aria-label="Target orientation"` min=−90 max=+90
- Strength 100% reads A=1.50
- Overflow: none observed on first screen
- Console: clean Polar GRIN runtime

## Files

- `before/` from live `67c03cf` (apple-of-the-eye-port after)
- `after/mobile-390.png`
- `after/desktop-1440.png`
