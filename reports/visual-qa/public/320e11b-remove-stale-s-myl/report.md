# Public UI verification — remove stale Broch Sphere s-myl references

Commit: `320e11b3a1ccb8d7a021ef027f1355fff09263fe`
Message: `fix(public): remove stale Broch Sphere s-myl references`

## Scope

Mechanical cleanup of remaining dangling `s-myl` references in active Broch Sphere data.

Do not add `s-myl` as a node. Do not invent replacement topology. Keep the `GraphLine` missing-endpoint guard.

## What changed

- `src/data/brochSphere/journeys.ts`
  - Observer's Path: removed last step `{type:"node", id:"s-myl", caption:"MisterY Labs sits south of the high-confidence chain, still forming."}` so the path is Galileo → Sagan → xPRIMEray (matches the existing subtitle).
  - Removed edges `observer-x-myl` (`k-xprimery` → `s-myl`, beacon, `te-04`) and `story-interstellar-myl` (`s-interstellar` → `s-myl`, great-circle).
  - `te-04` remains on `return-interstellar-x`.
- `src/data/brochSphere/constellations.ts`
  - Story Arc `nodeIds`: dropped `s-myl`.
- `src/data/brochSphere/observerStances.ts`
  - Receiver `visibleNodeIds`: dropped `s-myl`.

The journey step was removed, not rewritten as narration. The caption was the invalid Labs-as-node claim; rewriting it would invent topology.

Preserved:

- `src/components/brochSphere/BrochSpherePrototype.tsx` `GraphLine` guard `if (!from || !to) return null;`
- Navigator Stack semantics
- Default `/broch-sphere` landing (Return Path)

## Routes / viewports

Local `vite preview`, production basename `/misterylabs/`.

| File | Size | Surface |
|---|---|---|
| `before/mobile-390.png` | 390×844 | `/broch-sphere` default landing |
| `after/mobile-390.png` | 390×844 | `/broch-sphere` default landing |
| `before/desktop-1440.png` | 1440×900 | `/broch-sphere` default landing |
| `after/desktop-1440.png` | 1440×900 | `/broch-sphere` default landing |
| `before/observers-panel-mobile-390.png` | element | Observer's Path last step panel |
| `after/observers-panel-mobile-390.png` | element | Observer's Path last step panel |
| `before/observers-panel-desktop-1440.png` | element | Observer's Path last step panel |
| `after/observers-panel-desktop-1440.png` | element | Observer's Path last step panel |
| `before/observers-last-desktop-1440.png` | 1440×900 | Observer's Path last step full viewport |
| `after/observers-last-desktop-1440.png` | 1440×900 | Observer's Path last step full viewport |

Default landing is visually unchanged: `s-myl` was already unrendered (missing node + GraphLine guard). The visible change is Observer's Path last step. On mobile the journey panel sits below the fold, so panel element shots are the mobile witness.

## Verification

- `/broch-sphere` HTTP 200 at 390×844 and 1440×900
- no `s-myl` string remains in `src/`
- no `s-myl` string in the built bundle
- no south-of-the-chain caption in the live DOM
- Observer's Path last step: before `Step 4 / 4` + south caption and no node card; after `Step 3 / 3` + xPRIMEray caption and xPRIMEray node card
- no new console / page errors
- no document `overflowX`
- GraphLine missing-endpoint guard retained

## Adjacent findings (not fixed)

- Historical `s-myl` remains in charter/alignment docs, internal Broch specs, and old visual-QA reports (provenance, not active data).
- `NotFound.tsx` still exposes `/mission` in 404 recovery (M1 deferred).
- Mission Control sticky-header overlap (M1 deferred).
- Axis labels `n(x)` / `n(0)` still clip at 390×844 (M2 deferred).
