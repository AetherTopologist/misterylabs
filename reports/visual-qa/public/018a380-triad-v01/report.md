# Public UI verification — TRIAD v0.1 presentation freeze

Presentation commit: `018a380090df4212b651276fbbe9810895f967e3`
Message: `fix(public): freeze TRIAD v0.1 presentation`

Local `vite preview`, basename `/misterylabs/`.
Routes: `/atlas`, `/observatory/triad`.
Viewports: 390×844 and 1440×900. Canonical TRIAD shots are the dark instrument palette. Atlas checked in dark and light.

No Maxwell, QED, controller, preset, or integrator equations were changed.
The only `Params` default change is `showBore: false` (source-locus history drawing). Hypothesis flags were already off.
Display focus is opacity only. It is not a solver input and it is not written into COPY RUN.

## Checks

| Check | Result |
|---|---|
| `npm test -- --run src/instruments/triad` | 5 files, 28 tests PASS |
| `npm run build` | PASS |
| console errors on Atlas and TRIAD | none |
| horizontal overflow at 390 and 1440 | 0 |
| TRIAD version line | `TRIAD v0.1 · RESEARCH INSTRUMENT PREVIEW` |
| subtitle unchanged | `Source locus ≠ Maxwell structure · not a tunnel` |
| MH370 disclaimer | present |
| experiment entry | five presets visible on the first screen at 390 and 1440 |
| default aircraft | recognizable; source-locus helices not drawn |
| Atlas H1 | `MISTERY LABS · ATLAS` |
| Atlas order | `#instruments` before `#foundations` |
| routes | `/observatory/triad` and `/research` unchanged |

## Shots

- `before/` and `after/`: `mobile-390.png`, `desktop-1440.png` are `/observatory/triad`
- `atlas-mobile-390.png`, `atlas-desktop-1440.png` are `/atlas`
- `after/atlas-light-*.png` is the light theme of Atlas
