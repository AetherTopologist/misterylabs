# MisterY Labs --- Public Foundation Architecture Checkpoint

**Checkpoint:** Post-Supabase retirement, runtime hardening, Claude
architecture reconciliation\
**Purpose:** Preserve the current architecture decisions,
production-readiness direction, and next implementation sequence without
mixing in xPRIMEray engine-authority work or rapid-deploy Arcade
experimentation.

## 1. Current architectural doctrine

The ratified **Navigator Stack** remains authoritative:

-   **MisterY Labs** --- the navigator / public laboratory surrounding
    the system
-   **Broch Sphere** --- navigation layer; maps relationships between
    ideas
-   **Atlas** --- knowledge layer; organizes observations and learning
    paths
-   **Observatory** --- measurement layer; documents experiments and
    evidence
-   **xPRIMEray** --- upstream scientific instrument

The visitor journey does not need to mirror this ontology literally.

A compatible public journey is emerging:

**arrive → manipulate an exhibit → become curious → see
relationships/context → descend into Observatory → encounter xPRIMEray
authority**

This is the basis for a future **Experience** layer.

## 2. Firm `s-myl` decision

**Do not add `s-myl` as a Broch Sphere node.**

Claude's repository/history inspection established that:

-   the node historically existed;
-   it was deliberately removed when the charter/alignment work
    identified MisterY Labs-as-node as contradictory;
-   four stale references survived that deletion;
-   the recent runtime guard correctly prevented those stale references
    from crashing the SPA, but did not resolve their semantic debt.

**MisterY Labs is the navigator/container, not a node inside its own
graph.**

Follow-up should mechanically remove or convert the remaining `s-myl`
references without changing Broch Sphere topology or inventing a
replacement node.

## 3. Arcade / Experience verdict

The recent rapid-deploy experiments revealed a legitimate missing public
layer, but current implementation is structurally inconsistent.

Recent exhibits include:

-   Cavendish × Pais
-   Apple of the Eye / Polar GRIN
-   Saturn Polygon Lab
-   Dome Inversion

They do not currently share one coherent route, taxonomy, maturity
system, or landing page. Three live under Observatory routes; Dome
Inversion alone uses an Arcade route.

### Direction

**Experience** is the preferred visitor-facing concept.

**Arcade** can remain an internal/dev/demo taxonomy where useful.

Experience should eventually become the low-cost interactive doorway
into MisterY Labs, but it should **not yet become a new header
navigation item**. First build a coherent Experience surface and
consistent maturity grammar.

The Navigator Stack remains intact. Experience describes how a visitor
enters the laboratory, not a replacement architecture.

## 4. Production-readiness rule

**No silently broken public features.**

A page does not need to be finished to be public, but its state must be
unmistakable.

Useful public maturity states:

-   **STABLE**
-   **REDUCED MODEL**
-   **EXPERIMENTAL**
-   **PROTOTYPE**
-   **WORK IN PROGRESS**
-   **HISTORICAL**
-   **SEALED ARTIFACT**

A broken/offline surface should generally not be normally discoverable
until repaired.

This should eventually become a shared presentation component and
vocabulary rather than the several overlapping status systems currently
present across Atlas, Observatory, Research, and individual demos.

## 5. Immediate trust problem

Mission Control was deliberately preserved during Supabase retirement as
an **ungated but unadvertised maintainer surface**.

Home currently contradicts that decision by presenting a CTA labeled:

**Enter MisterY Labs → `/mission`**

This is not merely polish. It is a false affordance: the site's most
inviting language sends a public visitor into an internal project
tracker.

### Decision

**Remove the Mission Control card/link from Home.**

Do not relabel it into a public feature.

Keep `/mission`, `/dashboard`, and `/projects/:id` reachable directly
for maintainers. Do not reintroduce authentication as part of this
change.

## 6. Current production-readiness roadmap

### M1 --- Orientation: Home CTA honesty

Remove the public Home promotion of Mission Control.

### M2 --- Orientation: mobile hero legibility

Fix clipping of the `STRAIGHT TRANSPORT` / `CURVED TRANSPORT` chips at
\~390 px in the shared Transport Sphere visual.

Do not alter transport geometry or scientific semantics.

### M3 --- Foundation: Broch Sphere `s-myl` cleanup

Remove/convert the four dangling references left after the historical
node deletion.

Keep the defensive render guard as cheap runtime insurance.

### M4 --- Experience coherence

Reconcile the four recent interactive exhibits into a coherent
visitor-facing Experience presentation.

No route renames required initially.

This is an architecture/product milestone and should receive a Claude
gate plus Billy hands-on interaction acceptance.

### M5 --- Shared maturity/status grammar

Create one reusable experiment-status presentation component and
canonical vocabulary.

Migrate existing badge systems gradually rather than rewriting Atlas,
Observatory, and Research in one commit.

### M6 --- Community / attribution

Begin surfacing provenance and creator/source attribution from the
Inspiration Queue into public exhibits.

### M7 --- Production readiness

Run bounded passes for: - route/link health; - GitHub Pages basename
behavior; - mobile interaction; - accessibility; - performance; - stale
current-looking content; - claim boundaries; - visual-QA completeness.

## 7. Visual QA doctrine

Meaningful public UI changes require evidence under:

`reports/visual-qa/public/`

Minimum default witnesses:

-   \~390×844 mobile
-   \~1440×900 desktop
-   before/after where the change is visual
-   concise `report.md`

Do not rewrite historical evidence merely to normalize old folder names.

## 8. Next Grok implementation brief

### Title

**Remove misleading Mission Control CTA from Home**

### Mode

Implementation is approved and intentionally tiny.

### Scope

`src/pages/Index.tsx` only.

Locate the Home card/CTA currently labeled **"Enter MisterY Labs"** and
linking to `/mission`.

### Do

1.  Remove that card/link from Home entirely.
2.  Preserve the surrounding Home layout with the smallest possible
    adjustment required by its removal.
3.  Confirm `/mission` still loads correctly by direct URL.
4.  Capture before/after visual evidence at approximately:
    -   390×844
    -   1440×900
5.  Archive the evidence using the canonical `reports/visual-qa/public/`
    convention.

### Do not

-   Touch `/mission`, `/dashboard`, or `/projects/:id`.
-   Touch `Dashboard.tsx` or `ProjectDetail.tsx`.
-   Add authentication.
-   Rename routes.
-   Replace the removed card with a newly invented CTA.
-   Modify any other Home section or copy.
-   Touch `TransportSphereViz.tsx`.
-   Touch Broch Sphere data.
-   Touch Arcade/Experience demos.
-   Touch xPRIMEray semantics or documentation.
-   Perform adjacent cleanup.

### Acceptance criteria

-   Home no longer advertises an internal maintainer surface as "MisterY
    Labs."
-   `/mission` remains directly reachable and functional.
-   No unrelated visual/copy changes.
-   No new console errors.
-   Mobile and desktop layout remain coherent after removal.
-   Working tree contains only the approved implementation and visual-QA
    evidence.

### Commit

If verification passes:

`fix(public): remove misleading Mission Control CTA`

If removal exposes a layout problem requiring broader Home
restructuring, stop and report instead of expanding scope.

### Report back with

-   exact files changed;
-   exact removed element;
-   `/mission` direct-route verification;
-   mobile/desktop PASS/FAIL;
-   visual-QA folder;
-   any adjacent findings, reported but not fixed.

## 9. Deliberately deferred

Do not let these hijack the next commit:

-   Experience/Arcade landing architecture
-   Cavendish × Pais missing visual-QA evidence
-   Dome Inversion's unexplained `White House Arcade` label
-   broader status-vocabulary consolidation
-   inspiration-model consolidation
-   historical visual-QA naming drift
-   external Supabase project decommissioning
-   stale Supabase/auth documentation cleanup
-   Transport Sphere interactivity
-   xPRIMEray engine work

## 10. North star

The objective is not to make MisterY Labs look prematurely finished.

The objective is a trustworthy, intuitive, production-quality **living
public laboratory** where:

-   working exhibits invite interaction quickly;
-   unfinished work says that it is unfinished;
-   speculation is labeled;
-   provenance is visible;
-   the Navigator Stack remains coherent underneath;
-   xPRIMEray remains upstream authority;
-   and increasingly weird experiments are earned through understandable
    visual grammar.

**Foundation first. Experience next. Community grows from the seam
between them.**
