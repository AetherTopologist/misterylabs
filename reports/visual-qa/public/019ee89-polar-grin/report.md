# Visual QA — Polar GRIN Apple

- Route: `/observatory/polar-grin`
- Feature commit: `019ee89`
- Follow-up fix: `2a455fd`
- Viewports: 390×844 and 1440×900 (desktop-1440 from 1440×900 capture; gallery before is 1280×800 live preview)
- Basename: `/misterylabs/` on GitHub Pages; preview here is the dual-write observatory.
- Overflow: none observed
- Console: clean on field-off load

## Notes

- New route. Parent 675b185 has no Polar GRIN page (direct load would 404 via SPA fallback).
- Model: reduced illustrative polar-halo angular kick. Vacuum at s=0. Not xPRIMEray.
- s=0: 11/11 surface hits. Sequence FIELD OFF → BEND → SHADOW → WRAP → REVEAL.
- Object occupancy never alpha-faded. Rays masked against apple fill.

## Files

- `before/` gallery context (route did not exist on 675b185)
- `after/mobile-390.png`
- `after/desktop-1440.png`
- `after/` extra control-at-max captures
