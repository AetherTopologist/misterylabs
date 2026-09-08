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

**Checkpoint:** Post-Supabase retirement, runtime hardening, Claude architecture reconciliation, M1 landed  
**Updated after:** `ee84d3740a7d84943e804a3c046744155578e339` — `fix(public): remove misleading Mission Control CTA`

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

Follow-up should mechanically remove or convert the remaining `s-myl` references without changing Broch Sphere topology or inventing a replacement node.

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

**LANDED:** M1 — Home CTA honesty (`ee84d374`)  
**NOW:** M2 — mobile hero legibility  
**NEXT:** M3 — Broch Sphere `s-myl` cleanup  
**ARCHITECTURE GATE:** M4 — Experience coherence

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

- `src/pages/NotFound.tsx` still exposes `{ to: "/mission", label: "Mission" }` in 404 recovery.
- Mission Control has a pre-existing header-overlap issue with the sticky site header.

Neither belongs in M1.

---

### M2 — NOW — Orientation: mobile hero legibility

Fix clipping of the `STRAIGHT TRANSPORT` / `CURVED TRANSPORT` chips at approximately 390 px in the shared Transport Sphere visual.

Do not alter transport geometry, scientific semantics, route structure, or Transport Sphere behavior beyond presentation required for legibility.

Expected owner:

`src/components/TransportSphereViz.tsx`

This component is shared by Home and `/observatory/transport-sphere`, so both consuming surfaces must be verified.

---

### M3 — NEXT — Foundation: Broch Sphere `s-myl` cleanup

Remove or convert the remaining dangling `s-myl` references left after the historical node deletion.

Known references were previously identified in:

- `src/data/brochSphere/constellations.ts`
- `src/data/brochSphere/journeys.ts`
- `src/data/brochSphere/observerStances.ts`

The journey step may be removed or rewritten as narration only if that preserves meaning without implying a graph node.

Do not add `s-myl`.

Keep the defensive render guard as cheap runtime insurance.

Acceptance target:

- no `s-myl` string remains in active Broch Sphere data;
- `/broch-sphere` still renders cleanly;
- no topology or Navigator Stack reinterpretation.

---

### M4 — ARCHITECTURE GATE — Experience coherence

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

## 9. Next Grok implementation brief — M2 only

### Title

**Fix mobile Transport Sphere label clipping**

### Mode

Implementation is approved and intentionally bounded.

### Scope

Expected implementation file:

`src/components/TransportSphereViz.tsx`

If repository inspection shows the clipping is owned elsewhere, stop and report the actual owner rather than expanding scope.

### Problem

At approximately 390 px viewport width, the shared Transport Sphere visual clips or partially cuts off the label chips:

- `STRAIGHT TRANSPORT`
- `CURVED TRANSPORT`

This affects at least:

- Home
- `/observatory/transport-sphere`

The visual itself is otherwise working.

### Do

1. Reproduce the clipping at approximately 390×844 before changing code.
2. Identify the smallest presentation-only cause.
3. Fix the chip sizing, positioning, wrapping, or responsive treatment required to make both labels fully legible.
4. Preserve desktop hierarchy and theme behavior.
5. Verify both consuming routes.
6. Capture before/after visual evidence at:
   - 390×844
   - 1440×900
7. Verify light and dark theme if the component renders differently by theme.
8. Archive evidence under the canonical `reports/visual-qa/public/` convention.

### Do not

- alter ray paths;
- alter straight/curved transport geometry;
- change scientific semantics;
- add Transport Sphere interactivity;
- redesign Home;
- change CTA copy;
- touch Mission Control;
- touch Broch Sphere data;
- touch Arcade/Experience demos;
- rename routes;
- change Vite or basename configuration;
- change xPRIMEray engine semantics or documentation;
- advance M3 or any deferred work.

### Acceptance criteria

- `STRAIGHT TRANSPORT` is fully legible at 390×844.
- `CURVED TRANSPORT` is fully legible at 390×844.
- no horizontal overflow is introduced;
- Home remains visually coherent;
- `/observatory/transport-sphere` remains visually coherent;
- desktop 1440×900 remains correct;
- no new console errors;
- no ray-path or transport-geometry change;
- only the approved implementation and visual-QA evidence are included.

### Commit

If verification passes:

`fix(public): improve mobile transport labels`

If the repair requires broader structural changes than expected, stop and report rather than expanding scope.

### Report back with

- commit SHA;
- exact file diff;
- root cause of the clipping;
- Home mobile/desktop PASS/FAIL;
- Transport Sphere mobile/desktop PASS/FAIL;
- light/dark PASS/FAIL where relevant;
- visual-QA folder;
- adjacent findings, reported but not fixed.

---

## 10. Deliberately deferred

Do not let these hijack M2:

- `NotFound.tsx` exposing Mission in 404 recovery
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
- Broch Sphere `s-myl` cleanup until M3
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
