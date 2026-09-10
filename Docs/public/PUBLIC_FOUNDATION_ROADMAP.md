# MisterY Labs — Public Foundation Roadmap

> **Status:** Active public-development checkpoint  
> **Authority:** Implementation roadmap, subordinate to `agents.md`,
> `Docs/public/MISTERY_LABS_PUBLIC_CHARTER.md`, and the ratified
> `charter/CHARTER_2026.md`.  
> **Purpose:** Preserve current public-architecture decisions and sequencing
> across GPT project management, Claude architecture review, Grok
> implementation, and Billy's hands-on acceptance.
>
> This document may evolve as milestones land. It does not redefine
> xPRIMEray engine authority.

**Checkpoint:** Post-Supabase retirement, runtime hardening, Claude architecture reconciliation, M1–M3 landed, H1 landed  
**Updated after:** `379efe4781cc5ee6ac98aa805896ef113e778bf6` — `fix(public): remove Mission Control from 404 recovery`

---

## 1. Current architectural doctrine

The ratified **Navigator Stack** remains authoritative:

- **MisterY Labs** — the navigator / public laboratory surrounding the system
- **Broch Sphere** — navigation layer; maps relationships between ideas
- **Atlas** — knowledge layer; organizes observations into learning paths
- **Observatory** — measurement layer; documents experiments and generates evidence
- **xPRIMEray** — upstream scientific instrument

The visitor journey does not need to mirror this ontology literally.

A compatible public journey is emerging:

**arrive → manipulate an exhibit → become curious → see relationships/context → descend into Observatory → encounter xPRIMEray authority**

This is the basis for a future **Experience** layer.

---

## 2. Firm `s-myl` decision

**Do not add `s-myl` as a Broch Sphere node.**

Claude's repository/history inspection established that:

- the node historically existed;
- it was deliberately removed when charter/alignment work identified MisterY Labs-as-node as contradictory;
- four stale references survived that deletion;
- the runtime guard added in `a566e89` correctly prevented those stale references from crashing the SPA, but did not resolve their semantic debt.

**MisterY Labs is the navigator/container, not a node inside its own graph.**

M3 mechanically removed the remaining `s-myl` references without changing Broch Sphere topology or inventing a replacement node.

---

## 3. Arcade / Experience verdict

The recent rapid-deploy experiments revealed a legitimate missing public layer, but current implementation is structurally inconsistent.

Recent exhibits include:

- Cavendish × Pais
- Apple of the Eye / Polar GRIN
- Saturn Polygon Lab
- Dome Inversion

They do not currently share one coherent route, taxonomy, maturity system, or landing page. Three live under Observatory routes; Dome Inversion alone uses an Arcade route.

### Direction

**Experience** is the preferred visitor-facing concept.

**Arcade** can remain an internal/dev/demo taxonomy where useful.

Experience should eventually become the low-cost interactive doorway into MisterY Labs, but it should **not yet become a new header navigation item**. First build a coherent Experience surface and consistent maturity grammar.

The Navigator Stack remains intact. Experience describes how a visitor enters the laboratory, not a replacement architecture.

---

## 4. Production-readiness rule

**No silently broken public features.**

A page does not need to be finished to be public, but its state must be unmistakable.

Useful public maturity states:

- **STABLE**
- **REDUCED MODEL**
- **EXPERIMENTAL**
- **PROTOTYPE**
- **WORK IN PROGRESS**
- **HISTORICAL**
- **SEALED ARTIFACT**

A broken/offline surface should generally not be normally discoverable until repaired.

This should eventually become a shared presentation component and vocabulary rather than the several overlapping status systems currently present across Atlas, Observatory, Research, and individual demos.

---

## 5. Roadmap maintenance rule

Repository reality outranks stale file-boundary assumptions in this roadmap.

If an agent discovers that an approved change is owned by a different file than recorded here, it must stop and report the discrepancy rather than expanding scope. Once reviewed and approved, update this roadmap to reflect the actual ownership.

Completed implementation briefs should be replaced by landed milestone records rather than retained as active instructions.

Visual evidence and runtime verification must exist before a milestone is marked LANDED.

---

## 6. Current execution state

**LANDED:** M1 — Home CTA honesty (`ee84d374`); M2 — mobile hero legibility (`ccb3cc62`); M3 — Broch Sphere `s-myl` cleanup (`f357d6a`); H1 — 404 Mission discoverability (`379efe4`)  
**NOW:** Public Reality Audit  
**ARCHITECTURE GATE (after reality-audit / pruning):** M4 — Experience coherence  

**Mission Control:** INTERNAL / MAINTAINER — direct `/mission` preserved; public discoverability removed.

---

## 7. Current production-readiness roadmap

### M1 — LANDED — Orientation: Home CTA honesty

**Status:** Complete  
**Commit:** `ee84d3740a7d84943e804a3c046744155578e339`  
**Message:** `fix(public): remove misleading Mission Control CTA`  
**Visual QA:** `reports/visual-qa/public/03d5975-remove-mission-cta/`

Removed the misleading public Home CTA:

`Enter MisterY Labs → /mission`

Actual owning component:

`src/components/SeeingIsNotOpeningYourEyes.tsx`

The change removed only the outline Mission Control button and its now-unused `Telescope` import.

Preserved:

- `Explore the Vault → /archive`
- the rest of the “Seeing Is Not Opening Your Eyes” section
- `/mission`
- `/dashboard`
- `/projects/:id`

Mission Control remains an ungated, unadvertised maintainer surface.

Verification passed at:

- 390×844
- 1440×900
- direct `/mission`
- no new console errors

**Deferred from M1:**

- Mission Control has a pre-existing header-overlap issue with the sticky site header.

The 404 Mission recovery link was closed in H1. Neither the 404 chip nor the header overlap belonged in M1.

---

### M2 — LANDED — Orientation: mobile hero legibility

**Status:** Complete  
**Commit:** `ccb3cc62a1d24395e635646f90be2be4a8cdc003`  
**Message:** `fix(public): improve mobile transport labels`  
**Visual QA:** `reports/visual-qa/public/699ac73-improve-mobile-transport-labels/`

Moved and narrowed the `STRAIGHT TRANSPORT` / `CURVED TRANSPORT` chips in the shared Transport Sphere visual so both labels remain fully legible at approximately 390 px.

Owning component:

`src/components/TransportSphereViz.tsx`

Ray paths, transport geometry, scientific semantics, route structure, and Transport Sphere behavior beyond presentation were not changed.

Verification passed at:

- Home 390×844 and 1440×900, light and dark
- `/observatory/transport-sphere` 390×844 and 1440×900, light and dark
- no new console errors
- no document `overflowX`

**Deferred from M2:**

- Axis labels `n(x)` / `n(0)` still clip at 390×844 on Home and on `/observatory/transport-sphere` (they sit at the sphere's left/right extremities, outside the slice window).

---

### M3 — LANDED — Foundation: Broch Sphere `s-myl` cleanup

**Status:** Complete  
**Commit:** `f357d6a46ad1c93cea6ea62a56157f7f80e57512`  
**Message:** `fix(public): remove stale Broch Sphere s-myl references`  
**Visual QA:** `reports/visual-qa/public/320e11b-remove-stale-s-myl/`

Mechanically removed remaining dangling `s-myl` references from active Broch Sphere data without adding `s-myl` as a node and without inventing replacement topology.

Changed files:

- `src/data/brochSphere/journeys.ts` — removed Observer's Path last step (`s-myl`, “sits south of the high-confidence chain”) and edges `observer-x-myl` / `story-interstellar-myl`; path is now Galileo → Sagan → xPRIMEray
- `src/data/brochSphere/constellations.ts` — Story Arc `nodeIds` dropped `s-myl`
- `src/data/brochSphere/observerStances.ts` — Receiver `visibleNodeIds` dropped `s-myl`

Preserved:

- `GraphLine` missing-endpoint guard in `src/components/brochSphere/BrochSpherePrototype.tsx`
- Navigator Stack semantics
- default `/broch-sphere` landing (Return Path)

Verification passed:

- no `s-myl` string remains in active Broch Sphere data (`src/`)
- `/broch-sphere` renders cleanly at 390×844 and 1440×900
- Observer's Path last step is `Step 3 / 3` with the xPRIMEray caption and node card
- no new console errors
- no document `overflowX`

---

### H1 — LANDED — Foundation: 404 Mission discoverability

**Status:** Complete  
**Commit:** `379efe4781cc5ee6ac98aa805896ef113e778bf6`  
**Message:** `fix(public): remove Mission Control from 404 recovery`  
**Visual QA:** `reports/visual-qa/public/2fb657f-remove-404-mission/`

Removed `{ to: "/mission", label: "Mission" }` from the 404 Known Routes grid.

Owning file:

`src/pages/NotFound.tsx` (`ROUTES` array only)

Preserved:

- Home, Atlas, Archive, Research, Media
- 404 copy, layout, and primary Return to Observatory CTA
- `/mission` as a direct route
- `/dashboard`
- `/projects/:id`

**Mission Control classification:** INTERNAL / MAINTAINER. Direct route preserved; public discoverability removed.

Verification passed:

- 404 at 390×844 and 1440×900 no longer exposes Mission
- direct `/mission` HTTP 200, Mission Control renders, no login wall
- no new console errors
- no document `overflowX`

---

### M4 — ARCHITECTURE GATE — Experience coherence

Follows Public Reality Audit / pruning work. Not the current execution pointer.

Reconcile the recent interactive exhibits into a coherent visitor-facing **Experience** presentation.

No route renames are required initially.

Goals:

- the four recent exhibits should read as part of one visitor journey rather than disconnected side quests;
- Experience should become the low-cost interactive doorway into MisterY Labs;
- Broch Sphere, Atlas, Observatory, and xPRIMEray retain their existing roles;
- “Arcade” may remain an internal/demo taxonomy;
- do not add Experience to primary navigation until the coherent surface exists.

This milestone requires:

- Claude architecture gate
- Billy hands-on interaction acceptance
- visual-QA evidence at mobile and desktop

---

### M5 — Shared maturity/status grammar

Create one reusable experiment-status presentation component and canonical vocabulary.

Candidate states:

- STABLE
- REDUCED MODEL
- EXPERIMENTAL
- PROTOTYPE
- WORK IN PROGRESS
- HISTORICAL
- SEALED ARTIFACT

Migrate existing badge systems gradually rather than rewriting Atlas, Observatory, Research, and every demo in one commit.

---

### M6 — Community / attribution

Begin surfacing provenance and creator/source attribution from the Inspiration Queue into public exhibits.

Public-facing grammar should make clear:

- who or what inspired the experiment;
- original source / creator when known;
- attribution unresolved when not known;
- what MisterY Labs changed or extended;
- where visitors can go to the source/community.

Do not manufacture attribution.

---

### M7 — Production readiness

Run bounded passes for:

- route/link health
- GitHub Pages basename behavior
- mobile interaction
- accessibility
- performance
- stale current-looking content
- claim boundaries
- visual-QA completeness
- orphaned or misleading navigation
- public vs maintainer-surface separation

Act on findings in small follow-up commits.

---

## 8. Visual QA doctrine

Meaningful public UI changes require evidence under:

`reports/visual-qa/public/`

Minimum default witnesses:

- approximately 390×844 mobile
- approximately 1440×900 desktop
- before/after where the change is visual
- concise `report.md`

Do not rewrite historical evidence merely to normalize old folder names.

If one pair of screenshots cannot show the relevant change, add route-specific frames without turning a bounded UI commit into a full-site sweep.

---

## 9. Next Grok implementation brief

None. Current work is a **Public Reality Audit**, not an M4 implementation task.

M4 remains the next architecture milestone after reality-audit / pruning work. It still requires Claude architecture review and Billy hands-on interaction acceptance before any implementation brief is written.

Do not invent an M4 implementation brief yet.

---

## 10. Deliberately deferred

Do not let these hijack the Public Reality Audit:

- Mission Control sticky-header overlap
- Experience/Arcade landing architecture
- Cavendish × Pais missing visual-QA evidence
- Dome Inversion's unexplained `White House Arcade` label
- broader status-vocabulary consolidation
- inspiration-model consolidation
- historical visual-QA naming drift
- external Supabase project decommissioning
- stale Supabase/auth documentation cleanup
- Transport Sphere interactivity
- Transport Sphere axis labels `n(x)` / `n(0)` mobile clipping
- xPRIMEray engine work

---

## 11. North star

The objective is not to make MisterY Labs look prematurely finished.

The objective is a trustworthy, intuitive, production-quality **living public laboratory** where:

- working exhibits invite interaction quickly;
- unfinished work says that it is unfinished;
- speculation is labeled;
- provenance is visible;
- the Navigator Stack remains coherent underneath;
- xPRIMEray remains upstream authority;
- increasingly weird experiments are earned through understandable visual grammar.

**Foundation first. Experience next. Community grows from the seam between them.**
