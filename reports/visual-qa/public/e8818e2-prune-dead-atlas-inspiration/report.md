# Public UI verification — isolate Atlas inspiration graph data

Commit: `e8818e22924d563a43fae6e29c2ef890d2d71386`
Message: `refactor(public): isolate Atlas inspiration graph data`

## Why the dataset was relocated, not deleted

`INSPIRATIONS` / `InspirationNode` / `InspirationTier` are a **live dependency of `/observatory/force-graph`** via `src/lib/atlasGraph.ts` → `getAtlasGraphData()`. The dead Atlas lineage UI (`SignalsSection` and related) was unmounted and is now deleted. The dataset itself was preserved verbatim and moved to `src/data/atlasInspirations.ts` so ownership is explicit.

This is a relocation, not a content rewrite. All 33 INSPIRATIONS entries and fields match HEAD.

## Files

- `src/pages/Atlas.tsx` — dead UI removed; dataset no longer lives here
- `src/data/atlasInspirations.ts` — new owner of `INSPIRATIONS`, `InspirationNode`, `InspirationTier`
- `src/lib/atlasGraph.ts` — imports from `@/data/atlasInspirations`

## Symbols removed from Atlas.tsx

- `SignalsSection`
- `InspirationCard`
- `SIGNAL_CATEGORIES`
- `TIER_CARD_CLS`
- `TIER_BADGE`

## Force-graph node count

`getAtlasGraphData()` = 1 core + 5 personal-resonance + 33 INSPIRATIONS = **39 nodes before and after**. IDs unchanged.

## Untouched

- `XENO_CITATIONS`, `XenoCitationCard`
- `ATLAS_ENTRIES`, `AtlasEntry`, `AtlasSourceLink`
- `XenoCitationSection`, `InspirationAtlasSection`
- `Docs/public/INSPIRATION_QUEUE.md`
- `src/components/ObservatoryForceGraph.tsx` (orphaned duplicate; adjacent finding)

## Verification

Local `vite preview`, basename `/misterylabs/`.

| Check | Result |
|---|---|
| `/atlas` 390×844 / 1440×900 light+dark | PASS — 200, no new console errors, overflowX 0, landing unchanged |
| `/observatory/force-graph` both viewports | PASS — canvas present, no fallback, no console errors |
| src grep dead UI symbols | zero |
| TypeScript/import | build succeeded |

## Adjacent findings (not fixed)

- `src/components/ObservatoryForceGraph.tsx` is an unused duplicate of the live `ObservatoryGraph` used by `/observatory/force-graph`.
- Three lineage/provenance models remain unresolved: INSPIRATIONS, XENO_CITATIONS, ATLAS_ENTRIES.
- Historical reports/roadmap still mention `SignalsSection` as RA-2 provenance; not live code.
