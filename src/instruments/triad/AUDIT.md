# TRIAD audit map

Reference for the GitHub Pages port of the sandbox instrument.
This file is a map. It is not a new physical claim.

Route: `/observatory/triad`
Deployed: `https://aethertopologist.github.io/misterylabs/observatory/triad`
Base path: `vite.config.ts` → `base: '/misterylabs/'`
Pages refresh: `npm run build` copies `dist/index.html` to `dist/404.html`. `index.html` restores a `?/…` path if the source `public/404.html` redirector is what Pages served.

## Pipeline

Manual controls and a future preset macro share one path. The hypothesis drawing does not write back into it.

```
CONTROL
  ui/Instrument.tsx          sliders, modes, Freeze A/B, Test Maneuver, Schwinger sweep button
  sim/store.ts               patch / reset / maneuver / experiment / freeze / publish
  sim/experimentHost.ts      same functions, for a future macro. No presets are defined.
        ↓
GEOMETRY / NODE STATE
  sim/engine.ts              step, moveNodes, seek, integrateCraft, enforceClearance
  sim/airframe.ts            skinDistance, minimumClearRadius, splitRadii, B777 solid
        ↓
SOURCE PARAMETERS
  sim/engine.ts              dipoles(), fieldScale(), energyStep()
  sim/fields.ts              solveDipoleMoment, radiatedPower
        ↓
MAXWELL CALCULATION
  sim/fields.ts              fieldAt, poynting, emagnitude, bmagnitude, cyclePeakNearDipoles
  sim/sampling.ts            evaluateSweep (Maxwell face / geometric sweep readout)
        ↓
FIELD TELEMETRY
  sim/engine.ts              snapshot(), qedReadout() uses delivered dipoles()
  ui/Instrument.tsx          numbers on screen, including commanded vs delivered
        ↓
STRONG-FIELD / PAIR APPROXIMATION
  sim/qed.ts                 invariantsOf (F, G), regimeOf, pairRate, sampleStrongField, sweepCommanded
  sim/engine.ts              schwingerSweep() calls sweepCommanded. It does not set vacuumBore.
```

Separately, and only forward:

```
?????  →  HYPOTHESIS VISUALIZATION
  params.vacuumBore, params.ashton, params.rayMode, params.anchor
  sim/engine.ts     syncBore copies vacuumBore onto display. Nothing computes it from E/Es or from the pair rate.
  ui/Viewport.tsx   BoreHistory draws the hypothesis tube only when display.vacuumBore is set by that flag.
  ui/Instrument.tsx seam tab. The ????? cell is a label. It is not a transition.
```

## Where to read each piece

| Concern | File | Symbols |
|---|---|---|
| Controller / tracking | `sim/engine.ts` | `moveNodes`, `seek`, `delayed`, `commandAngles`, `saturationOf` |
| Latency and acceleration cap | `sim/engine.ts` | `delayed` (latency buffer), `seek` (clips acceleration at `aMax`) |
| Orbit rate and ω²R | `sim/engine.ts` | `seek` subtracts `ω²` times the slot offset; `saturationOf` reports `ω²R / a_max` |
| Commanded R vs clearance vs actual | `sim/airframe.ts` `splitRadii`; `sim/engine.ts` `clearedR`, `enforceClearance`, `clearanceReadout` |
| 777-200ER solid | `sim/airframe.ts` | `B777`, `skinDistance`, `AIRFRAME_MESH` |
| Geometry frames | `sim/engine.ts` | `orbitPlane`, `borePlane`; `sim/types.ts` `GeoFrame` |
| Modes | `sim/types.ts` `Mode`; `sim/engine.ts` `moveNodes` (scripted / tracking / networked / phase-locked) |
| Source / emitter state | `sim/engine.ts` `dipoles`, `emPhase`, `updatePhase`, `onPreset`; phases on `Params` |
| Logarithmic amplitude | `ui/Instrument.tsx` | the source-amplitude slider writes `eRef` |
| Reservoir vs delivered field | `sim/engine.ts` | `energyStep`, `fieldScale`; telemetry in `qedReadout` |
| Maxwell point sample | `sim/fields.ts` | `fieldAt` |
| Maxwell face / Poynting | `sim/engine.ts` `paintField`; `ui/Viewport.tsx` `FieldSlice`, `PoyntingArrows` |
| Source-locus history | `sim/engine.ts` `recordBore`, `syncBore`; `ui/Viewport.tsx` `BoreHistory` |
| Field telemetry | `sim/engine.ts` `snapshot`, `qedReadout` | peak \|E\|, peak \|B\|, E/Es, c\|B\|/Es, where |
| F and G | `sim/qed.ts` | `invariantsOf` |
| Constant-field pair estimate | `sim/qed.ts` | `pairRate`, called from `sampleStrongField` |
| Ladder | `ui/Instrument.tsx` | `StrongFieldLadder` — CLASSICAL EM → STRONG-FIELD QED → E/Es = 1 → PAIR PRODUCTION → ????? |
| Schwinger sweep | `sim/qed.ts` `sweepCommanded`; `sim/engine.ts` `schwingerSweep`; chart in `ui/Instrument.tsx` |
| Freeze A / Freeze B | `sim/store.ts` `freeze`; comparison text `sim/qed.ts` `compareCaptures` |
| Test Maneuver | `sim/engine.ts` `triggerManeuver` (14 s command override) |
| Control-experiment buttons | `sim/engine.ts` `applyExperiment` |
| Page clock | `TriadPage.tsx` `useSim` | fixed `1/60` s, max 5 substeps, publish every 0.1 s |
| Reset | `sim/engine.ts` `reset`, reached from the Reset button through `sim/store.ts` |

`clearHistory` on the engine drops plotted samples and source-locus samples only. It does not clear the latency buffer and it does not change the Maxwell update.

## Not in this port

Preset experiments are not implemented. `experimentHost` is the macro surface only.
The ????? rung does not change the metric, the nodes, or the vacuum-bore flag.
