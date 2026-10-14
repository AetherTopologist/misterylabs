# MisterY Labs Ride → Map → Thought Path

Hydrogen is the first baseline implementation of this architecture.
It is feature-frozen. This record does not open the next scientific layer.

The frozen source is [`hydrogen/`](hydrogen/). It is stored beside the Vite
observatory, not inside it, so this baseline cannot retune TRIAD or any other
instrument.

## Architecture

- **Ride.** The living atom and its model control. Classical collapse, the
  Puthoff 1987 counterfactual, and the stationary quantum 1s stay separate
  pictures.
- **Map.** The typed Hydrogen tree. Branches up, roots down, hydrogen on the
  trunk. Relation kinds stay visually distinct. An invalid edge does not attach.
- **Thought path.** Selecting a node makes it the local origin. Following an
  edge is navigation history, not a derivation.

## Freeze

- Graph: 18 nodes, 21 edges. Validator rules unchanged.
- No new nodes, edges, equations, or instrument modes.
- TRIAD was not modified.
- One comparison-card string, and nothing else, changed for this release.
  Beside the quantum 1s, the Puthoff card is marked `SED model`. Quantum 1s
  stays `Calculated`. Those badges are not the same empirical status. The
  ride's own Puthoff picture, when it is not beside the 1s, still carries the
  epistemic tag Calculated.

## What η is

η is not in Puthoff, Phys. Rev. D 35, 3266 (1987). η = 1 uses the published
absorption term. Intermediate values are MisterY Labs counterfactual
sensitivity tests, not a measured zero-point-field strength. The equilibrium
guide r = η² a₀ is calculated by this instrument. Puthoff did not propose η.

## Verification recorded with this baseline

- Hydrogen tests: 24 passed. Tree layout, graph validator, Schrödinger 1s,
  classical collapse, Gaussian trial, and the Puthoff 1987 balance.
- Typecheck passed.
- Production build passed.
- Desktop and mobile visual check passed: no horizontal overflow, clean console.
- Comparison badges confirmed in the running instrument: Quantum 1s reads
  Calculated; the Puthoff comparison card reads SED model.

Public record: [/observatory/hydrogen](https://aethertopologist.github.io/misterylabs/observatory/hydrogen)
