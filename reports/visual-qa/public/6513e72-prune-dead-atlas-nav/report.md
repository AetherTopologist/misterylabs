# Public UI verification — prune dead Atlas navigation

Commit: `6513e72831ca4fb49240d7e16b4ffb45bf9c583b`
Message: `fix(public): prune dead Atlas navigation`

## Ownership

- Dead Atlas section nav: `src/pages/Atlas.tsx` `ATLAS_NAV` / `AtlasInstrumentNav`
- HEART-EYE Atlas card: `src/pages/Atlas.tsx` `DEMO_CARDS` polar-grin `desc`
- HEART-EYE teaching sentence: `src/pages/observatory/PolarGrin.tsx` Teaching item 03

## What changed

Removed dead Atlas section-nav entries whose hash targets do not exist on `/atlas`:

- `Quaternion` → `#quaternion-explorer` (id lives on `/observatory/quaternion`, not Atlas)
- `Instruments` → `#higher-dimensional` (id lives on `/observatory/higher-dimensional`, not Atlas)
- `Lineage` → `#signals` (`SignalsSection` is defined in Atlas.tsx but not mounted on `AtlasPage`)

Preserved:

- Observatory → `#observatory-hero`
- XenoCitations → `#xeno-citations`
- Atlas → `#inspiration-atlas`
- Get Involved → `#get-involved`
- live DEMO_CARDS routes including `/observatory/quaternion` and `/observatory/higher-dimensional`

HEART-EYE copy repair (meaning preserved: HEART-EYE is the same ray records as MIND, categorical, no second population):

- Atlas card: `HEART-EYE is the same ray records.` → `HEART-EYE is the same ray records as MIND.`
- PolarGrin teaching: `HEART-EYE is the same records as a categorical scan.` → `HEART-EYE is the same records as MIND, shown as a categorical scan.`

Did not add replacement destinations. Did not delete unmounted `SignalsSection`. Did not redesign Atlas.

## Routes / viewports

Local `vite preview`, production basename `/misterylabs/`.

| File | Size | Surface |
|---|---|---|
| `before/mobile-390.png` | 390×844 | `/atlas` landing |
| `after/mobile-390.png` | 390×844 | `/atlas` landing |
| `before/desktop-1440.png` | 1440×900 | `/atlas` landing |
| `after/desktop-1440.png` | 1440×900 | `/atlas` landing |
| `before/atlas-nav-*.png` | element | Atlas section nav |
| `after/atlas-nav-*.png` | element | Atlas section nav |
| `before/atlas-apple-card-*.png` | element | Apple of the Eye card |
| `after/atlas-apple-card-*.png` | element | Apple of the Eye card |
| `before/polar-grin-hearteye-desktop-1440.png` | element | PolarGrin “Two readouts” |
| `after/polar-grin-hearteye-desktop-1440.png` | element | PolarGrin “Two readouts” |

## Verification

- `/atlas` HTTP 200 at 390×844 and 1440×900
- dead hashes gone from section nav
- surviving hashes resolve to mounted sections
- HEART-EYE copy coherent on Atlas card and PolarGrin teaching
- no new console / page errors
- no document `overflowX`

## Adjacent findings (not fixed)

- `SignalsSection` (`id="signals"`) remains defined in `Atlas.tsx` but unmounted.
- Atlas entry `ae-001` still has placeholder social `https://x.com/[REPLACE_WITH_HANDLE]`.
