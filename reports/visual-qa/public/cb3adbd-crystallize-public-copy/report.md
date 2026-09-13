# Public UI verification — crystallize public copy (RA-7)

Commit: `cb3adbdf6ece8158e08b10750fc892e4c257a3c5`
Message: `fix(public): crystallize misleading public copy`

XenoCitation `feature:` roster was **NOT** touched pending external verification against the GD_xPRIMEray repo.

Live-repo facts re-verified at edit time:
- `brochNodes.length` = 18
- seed projects = 15; `is_validated: true` = 1
- header NAV_LINKS = Home, Atlas, Observatory, Broch Sphere, Archive, Media
- Saturn provenance from `Docs/public/INSPIRATION_QUEUE.md` Saturn polar polygons entry

## Files and old → new text

### 1. `src/pages/Atlas.tsx` — ObservatoryHeroSection h1
- old: `Light doesn't always travel straight.`
- new: `Off-Axis Observer Disagreement`
- Home h1 left unchanged.

### 2. `src/pages/Atlas.tsx` — GetInvolvedSection
- deleted function, call site, and ATLAS_NAV `{ href: "#get-involved", label: "Get Involved" }`
- no replacement copy

### 3. `src/pages/Atlas.tsx` — ae-001 social placeholder
- old: `label: "X / @[REPLACE_WITH_HANDLE]"`, `href: "https://x.com/[REPLACE_WITH_HANDLE]"`
- new: `label: "X / Social — pending"`, `href: ""`
- `placeholder: true` and `type: "social"` unchanged

### 4. XENO_CITATIONS
- HOLD. `feature:` values identical to pre-RA-7 HEAD.

### 5. `src/components/brochSphere/BrochSpherePrototype.tsx`
- old: `22-node toy prototype`
- new: `18-node toy prototype`

### 6. `src/pages/Archive.tsx`
- old: `Validated repository snapshots, visual artifacts, and historical milestones that establish the research lineage feeding into the active xPRIMEray observatory.`
- new: `A validated Research Object and its evidence trail — repository snapshots and milestones that establish research lineage feeding into the active xPRIMEray observatory. This record grows as more work is validated.`

### 7. `src/pages/arcade/DomeInversion.tsx`
- old: `White House Arcade: Dome Inversion`
- new: `Dome Inversion`
- kicker and ScienceBoundary untouched (still mentions White House in the disclaimer)

### 8. `src/pages/observatory/SaturnPolygon.tsx`
- appended citation using inspiration-queue sources:
  `See Agustín Sánchez-Lavega et al., Science Advances (Sept. 2026) and NASA/Hubble`
- NASA/Hubble is a clickable link to
  `https://science.nasa.gov/missions/hubble/nasas-hubble-tracks-new-decagon-encircling-saturns-south-pole/`

### 9. `src/pages/NotFound.tsx` ROUTES
- old: Home, Atlas, Archive, Research, Media
- new (matches AppHeader NAV_LINKS): Home, Atlas, Observatory, Broch Sphere, Archive, Media
- Research removed; no seventh entry

## Verification

Local `vite preview`, basename `/misterylabs/`. All six surfaces at 390×844 and 1440×900, light and dark.

| Check | Result |
|---|---|
| no new console errors | PASS |
| Atlas h1 ≠ Home h1 | PASS |
| src `REPLACE_WITH_HANDLE` | zero |
| Atlas.tsx `get-involved` | zero |
| Broch badge = 18 | PASS |
| 404 known routes match header | PASS |
| build | PASS |

## Adjacent findings (not fixed)

- Archive mobile 390×844 `overflowX` = 57 (pre-existing)
- ae-001 placeholder renderer still appends `· pending`, so the visible badge reads `X / Social — pending · pending`
- Dome Inversion ScienceBoundary still mentions “any real White House phenomenon” (explicitly left untouched)
