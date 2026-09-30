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
  sim/experimentHost.ts      same functions, for preset macros. No second solver.
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
  params.vacuumBore, params.ashton, params.rayMode, params.anchor, params.anchorKm, params.anchorBearing
  sim/engine.ts     syncBore copies vacuumBore onto display. Nothing computes it from E/Es or from the pair rate.
                    snapshot().axes is geometry telemetry only. It is not an input to dipoles, energy, or moveNodes.
  ui/Viewport.tsx   BoreHistory draws the hypothesis tube only when display.vacuumBore is set by that flag.
                    Aim axis is a short body-scale dashed ray. The range inset is log-compressed screen space.
                    Neither is a path to the anchor, and neither is read by the solver.
  ui/Instrument.tsx seam tab. The ????? cell is a label. It is not a transition.
```

## Experiment presets

`sim/presets.ts` defines five scripts as functions of integrator time.
`sim/experimentRun.ts` writes them through `experimentHost.setControls` before each existing `engine.step` in `TriadPage.tsx`.
Replay is the same script again. 0.25× changes `timeScale` only. The step stays 1/60 s.
Held keys are reapplied every step. That is not a solver lock.
`sim/runResult.ts` writes the post-run card from integrator-time samples already taken during that run. It does not step the solver and it does not add a threshold.
`seatBendDeg` is a geometric offset on node 2 when spacing is equal. Zero reproduces the old 120° ring. It is not an emitter phase and it does not enter `fields.ts` or `qed.ts`.

| Preset | Changes | Holds |
|---|---|---|
| 01 Control cliff | ω | speed, frame, E0, phase, frequency, airframe, R, a_max |
| 02 Break 120° | node-2 seat | E0, frequency, emitter phase, aircraft, ω |
| 03 Break phase | emitter phase | seats, R, ω, aircraft, E0, active count |
| 04 Schwinger sweep | E0 | aircraft, controller, geometry, phase, frequency, polarization, count |
| 05 Null A/B | one of E0, phase B, or active count | everything else |

E/Es = 1 does not set `vacuumBore`, the anchor, or a metric. Anchor range and bearing do not change peak E, peak B, F, G, the pair estimate, the energy ledger, or the controller.

## Not in this port

The ????? rung does not change the metric, the nodes, or the vacuum-bore flag.
No Pais, Puthoff, or Morris–Thorne transport law is implemented.


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
| Page clock | `TriadPage.tsx` `useSim` | fixed `1/60` s, max 5 substeps, publish every 0.1 s. Calls `experimentRun.beforeStep` then `engine.step`. |
| Reset | `sim/engine.ts` `reset`, reached from the Reset button through `sim/store.ts` |
| Preset scripts | `sim/presets.ts`, `sim/experimentRun.ts` | five macros over `experimentHost` |
| Aim axis / range inset | `ui/Viewport.tsx`, `ui/Experiments.tsx` `RangeInset`, `sim/anchorView.ts` | local ray; `compressedRadius` |

`clearHistory` on the engine drops plotted samples and source-locus samples only. It does not clear the latency buffer and it does not change the Maxwell update.

## TRIAD v0.1 · Research Instrument Preview

Release designation: **TRIAD v0.1 · Research Instrument Preview**. Not v1.0.
Feature development is frozen after this presentation pass. No new physics, solvers, hypothesis mechanisms, controls, presets, or experimental capabilities were added.

The visible header reads `TRIAD v0.1 · RESEARCH INSTRUMENT PREVIEW`. The subtitle remains `Source locus ≠ Maxwell structure · not a tunnel`. The MH370 epistemic disclaimer stays on the header.

Default / Reset presentation:

- Forbes-associated module (`ashton`) off
- plasma cosmetic shell off
- vacuum bore off
- destination anchor off
- source-locus history (`showBore`) off, so the helices do not dominate the first frame. The toggle still turns the existing history on.
- Display focus defaults to **Balanced**

Display focus is `BALANCED | AIRCRAFT | FIELD | SOURCES`. It changes viewport opacity only (`ui/displayFocus.ts`, read by `ui/Viewport.tsx`). It is not a `Params` field, does not enter `engine.step`, and is not written into COPY RUN.

`/research` is unchanged. `/observatory/triad` is unchanged.

### |E| / Es versus ε / Es

The on-screen ratio labeled E/Es is peak delivered `|E| / Es` (`ePeak / ES` in `qed.ts`). The pair approximation does **not** use that displayed peak. `pairRate` takes the invariant-derived electric-like eigenvalue `ε` (`eps`) and `β`. The exponent is `−π Es / ε`. A sweep can cross `|E|/Es` markers 0.01, 0.1, 1, and 10 while the pair series is responding to `ε`, which is not identical to displayed peak `|E|`. This release does not change that equation.

### Calibration record — 01 Control cliff

Parameters: R = 48 m, a_max = 80 m/s².
Predicted ωcrit = sqrt(80/48) = 1.291 rad/s.
Numerical first demand/cap > 1 occurred at ω = 1.292 rad/s, demand/cap = 1.002.
Max demand/cap = 4.045.
Tracking subsequently departed from commanded geometry.
Acquisition transitioned TRACK → SEARCH.

Interpretation: the numerical controller reproduces the analytically expected centripetal saturation boundary. This is a controller test and not an electromagnetic or aircraft-interaction result.

### Calibration record — 04 Schwinger sweep

Fixed: R = 48 m, ω = 1.2 rad/s, phase = 0/120/240°, frequency = 1e8 Hz, vertical polarization, 3 active sources, aircraft/controller/geometry frozen.
Sweep: E0 = 1.72e14 → 5.10e18 V/m.
Delivered E/Es ≈ 1e-3 → 2.99e1.
E/Es markers 0.01, 0.1, 1, 10 crossed.
Pair approximation became strongly nonlinear.
Vacuum bore remained off. Anchor remained off.
No transport or displacement transition exists.

Interpretation: the amplitude/QED diagnostic changes while geometry and hypothesis layers remain isolated. Pair nonlinearity follows `ε`, not a claim that displayed peak `|E|` is the exponent argument.

Release commit is recorded in git history for this documentation update. The Pages route remains `https://aethertopologist.github.io/misterylabs/observatory/triad`.

