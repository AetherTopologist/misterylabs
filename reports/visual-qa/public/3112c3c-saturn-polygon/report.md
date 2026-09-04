# Visual QA — Saturn Polygon Lab

- Route: `/observatory/saturn-polygon`
- Feature commit: `3112c3c`
- Follow-up fix: `59333cd`
- Viewports: 390×844 and 1440×900 (desktop-1440 from 1440×900 capture; gallery before is 1280×800 live preview)
- Basename: `/misterylabs/` on GitHub Pages; preview here is the dual-write observatory.
- Overflow: none observed
- Console: clean on field-off load

## Notes

- New route. Reduced wave-mode analogy r(θ)=R+A cos(mθ+φ). Not a Saturn simulation.
- m=6 hexagon analog (default). m=10 south-pole decagon analog.
- Vertex coords rounded to 2 decimals to avoid SSR float mismatch.

## Files

- `before/` gallery context (route did not exist on 675b185)
- `after/mobile-390.png`
- `after/desktop-1440.png`
- `after/` extra control-at-max captures
