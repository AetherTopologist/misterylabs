# MisterY Labs Charter Alignment Audit 2026

**Audited against:** CHARTER_2026.md  
**Date:** 2026-06-24  
**Method:** Source code review (all routes and components), navigation structure, documentation inventory, GitHub structure, charter and philosophy documents (v1, v2, Foundation).

The charter is taken as accepted. This document evaluates how well the current implementation embodies it, not whether the charter is correct.

---

## Scoring Guide

| Score | Meaning |
|---|---|
| 9–10 | Fully aligned. Implementation enacts the charter principle. |
| 7–8 | Substantially aligned. Minor gaps only. |
| 5–6 | Partial alignment. Core idea present but incomplete. |
| 3–4 | Weakly aligned. Structural gap between intent and implementation. |
| 1–2 | Minimal alignment. Implementation contradicts or ignores charter intent. |

---

## 1. Home

**Alignment Score: 4 / 10**

### Evidence

The hero headline ("Light doesn't always travel straight.") and TransportSphere visualization establish the xPRIMEray instrument identity with precision. The four flagship cards link to Atlas, Research, Media, and Observatory. Two CTAs point to the Godot demo and GitHub.

### Strengths

- The instrument is the focal point, which is coherent. Something specific is on display.
- The artifact grid (off-axis observer disagreement panels) is exactly what the charter describes as an Observatory Artifact — measurable, with inputs and classification data.
- The `FractalAcademia` and `SeeingIsNotOpeningYourEyes` sections gesture at the broader knowledge mission.

### Misalignments

- **The Navigator Stack is invisible.** Home does not communicate that MisterY Labs is the navigator and xPRIMEray is the instrument two levels below. The current presentation makes xPRIMEray and MisterY Labs feel like the same thing.
- **Broch Sphere does not appear on the home page.** It is the navigation layer — the charter's most philosophically distinctive claim. A first-time visitor has no indication it exists.
- **Community roles are not present.** Nothing invites the Verifier, the Receiver, the Lineage Navigator, or the Translator. The only implicit invitation is to the Instrument Maker ("Try Godot Demo").
- **"Get Involved" does not exist at this level.** The home page has no participation pathway.
- The sub-label "Gateway Observatory" on the header logo is evocative but undefined — a visitor cannot tell what it means without more context.

### Recommended Actions

| Action | Classification |
|---|---|
| Add a 3-sentence Navigator Stack statement to the hero or a below-fold section | RELEASE |
| Add a single Broch Sphere entry point (nav link or home card) | RELEASE |
| Add a compact role-selection block ("What kind of explorer are you?") linking to Atlas, Broch Sphere, and a contribution path | POST-LAUNCH |
| Replace "Gateway Observatory" with "Knowledge Observatory" or "Navigator" — something that names what the site *is* rather than where it *leads* | POST-LAUNCH |

---

## 2. Atlas

**Alignment Score: 6 / 10**

### Evidence

The Atlas page contains: a sub-nav (Observatory / Instruments / Lineage / Signals / Get Involved / Atlas), a demo instrument index, the FractalInspirationAtlas, FractalAcademia, XenoCitation section, ResonanceSpheresAtlas, and a "Get Involved" section. The structure is dense.

### Strengths

- The **knowledge layer function** is substantially present. Observations are organized. Lineage is traced. There is an inspiration atlas, an academic atlas, and a citation/signal section.
- The sub-nav structure maps loosely to the charter's Atlas responsibility: "organizes observations into coherent learning paths."
- The "Get Involved" section exists. This is the only place in the entire site where contribution is explicitly invited.
- The XenoCitation component (if it names lineage) enacts the "Lineage Navigator" role.

### Misalignments

- **The Atlas currently functions as a demo gallery, not a navigable knowledge layer.** The hero section introduces "Light doesn't always travel straight" again — the same headline as the home page — which collapses the distinction between Atlas and Home. A visitor cannot tell what makes the Atlas different from Home.
- **The FractalInspirationAtlas exists in the Atlas page but links nowhere.** It is a knowledge constellation that terminates in itself, not a path into deeper navigation.
- **The demo instrument index presents demos as attractions, not as Observatory Artifacts.** There are maturity badges (Stable / Experimental / Draft) which are good, but there is no artifact metadata: no inputs, no assumptions, no reproducibility status, no limitation statement — which the Foundation doc explicitly requires.
- **The "Signals" section (lineage) and the "Get Involved" section are buried below the fold at the end of a very long page.** The charter says community participation matters. The implementation says it barely matters (last in the hierarchy, lowest visual weight).

### Recommended Actions

| Action | Classification |
|---|---|
| Give the Atlas a distinct hero statement that names what it *is* ("This is the knowledge layer. Observations organized into paths.") | RELEASE |
| Add Observatory Artifact metadata to each demo card: inputs, assumptions, reproducibility status | POST-LAUNCH |
| Move "Get Involved" earlier — not to the top, but to its own section above the fold on a scroll, not beneath everything else | POST-LAUNCH |
| Connect the FractalInspirationAtlas to Broch Sphere nodes (link nodes to their sphere coordinates) | LONG-TERM |
| Rename the Atlas sub-nav item "Atlas" (currently links to `#inspiration-atlas`) to "Knowledge Map" — reduce confusion between the page and its section | RELEASE |

---

## 3. Observatory

**Alignment Score: 5 / 10**

### Evidence

The Observatory page contains: OpsStatusBar (Mission Control — project tracking KPIs, GPU/pipeline/storage readouts), a project list with statuses (Building / Validating / Blocked / Ready / Launched), an Observatory force-graph diagram, and links to demo routes (`/observatory/force-graph`, `/observatory/resonance-spheres`, etc.). Auth-gated dashboard at `/dashboard`.

### Strengths

- The **measurement layer concept** is present. The OpsStatusBar tracks what is being built and validated. The project pipeline is visible.
- The demo route structure (`/observatory/force-graph`, `/observatory/poisson-dot`, etc.) creates a coherent instrument sub-domain.
- The visual identity of Mission Control (monospace readouts, KPI cluster, live clock) strongly embodies the cosmic observatory aesthetic and the "disciplined curiosity" ethos.
- The Observatory force-graph provides a visual map of what is being worked on.

### Misalignments

- **The Observatory conflates two roles that the charter separates.** Mission Control is a *project management* tool (Instrument Maker role). The Observatory, per the charter, is a *measurement* and *evidence generation* layer. Currently it serves one role (tracking what's being built) while the charter expects it to serve another (generating and organizing evidence).
- **No Observatory Artifact format exists anywhere.** The Foundation doc specifies that artifacts should state inputs, assumptions, limitations, and reproducibility status. Nothing in the Observatory page matches this specification.
- **The demo routes under `/observatory/*` are labeled as "observatory" but they are instruments** (they generate artifacts, they don't archive them). The naming inverts the stack: Observatory should house the *outputs* of instruments, not the instruments themselves.
- **The connection from Observatory to Atlas is not visible.** Per the charter, Observatory generates evidence that Atlas organizes. There is no pathway between them in the current UI.

### Recommended Actions

| Action | Classification |
|---|---|
| Add a minimal Observatory Artifact template — even a single `artifact-metadata.json` format that all demos can reference | POST-LAUNCH |
| Consider renaming `/observatory/*` demo routes to `/instruments/*` — instruments are below Observatory in the stack | LONG-TERM |
| Add a single link/section in Observatory pointing toward Atlas ("Evidence organized in the Atlas →") | RELEASE |
| Keep Mission Control as-is — it is valuable and coherent within its own scope | — |

---

## 4. Broch Sphere

**Alignment Score: 8 / 10**

### Evidence

The Broch Sphere at `/broch-sphere` contains: a 22-node interactive knowledge graph (SVG, lat/lon coordinate system, six domain sectors, influence radii), Journey Panel, Stance Toggle (Verifier / Receiver), Node Card with open questions and stance readings, Transfer Event Card, Constellation Panel. Philosophy v1 and v2 exist as internal documents in `assets/internal/`.

### Strengths

- **This is the most charter-aligned feature in the repository.** The navigation layer concept is fully implemented — nodes, sectors, confidence axis, great-circle paths, transfer events, two stances (Verifier/Receiver matching charter community roles), open questions, uncertainty annotations.
- **The Verifier/Receiver stance toggle directly implements two of the charter's five community roles.** This is sophisticated.
- **Philosophy v1 and v2 are complete, rigorous documents.** They are internally consistent, extend each other correctly, and align precisely with the Foundation doc's citation framework.
- The node data (22 nodes including the Knowledge and Story lineage chains) correctly implements the v2 Helix concept.

### Misalignments

- **Broch Sphere is not in the primary navigation.** It is the navigation layer — the charter's most distinctive architectural claim — and a first-time visitor has zero chance of finding it. It is accessible only if you know the URL `/broch-sphere` or happen to see an internal link.
- **The philosophy documents are internal only.** A visitor interacting with the Broch Sphere graph has no way to access the philosophical framework that makes the coordinates meaningful. The "what am I looking at?" question is unanswered.
- **MisterY Labs appears as a node on the graph** (s-myl, at latitude 15, longitude 125, Engineering sector). Per Philosophy v1 explicitly: "MisterY Labs: not a node. The navigator." This is a direct contradiction of the philosophy documents.
- **The Constellation Panel and Transfer Event data are sparse.** The full Helix concept (v2) describes Transfer Events as "first-class objects" — but the current data has only a handful.

### Recommended Actions

| Action | Classification |
|---|---|
| Add "Broch Sphere" to the primary navigation (AppHeader NAV_LINKS) | FOUNDATIONAL |
| Remove MisterY Labs as a node from the sphere data — it is the navigator, not a node | FOUNDATIONAL |
| Add a "Philosophy" link or expandable panel within the Broch Sphere page linking to the v1/v2 framework (even as a readable summary) | RELEASE |
| Expand Transfer Event data — at least 3–5 documented transfer events between Knowledge Lineage and Story Lineage nodes | POST-LAUNCH |

---

## 5. Demo Routes (`/observatory/*`)

**Alignment Score: 5 / 10**

### Evidence

Seven active demo routes: ForceGraph, ResonanceSpheres, FractalInspiration, TransportSphere, PoissonDot, Quaternion, HigherDimensional. Each is a standalone interactive visualization. Accessible from the Atlas demo card index with maturity badges (Stable / Experimental / Draft).

### Strengths

- These are genuine **instruments** in the charter's sense — they generate observable artifacts, they produce measurable outputs.
- The maturity badge system (Stable / Experimental / Draft) is a lightweight epistemic status marker — a good instinct that aligns with the charter's "careful speculation" principle.
- The `DemoWrapper` error boundary and lazy loading are technically appropriate.

### Misalignments

- **No demo has artifact metadata.** The Foundation doc is explicit: artifacts should state inputs, assumptions, limitations, and reproducibility status. None of the seven demos does this.
- **The demos are presented as entertainment** (visual attractions, "see what this does") rather than as instruments generating Observatory Artifacts. The description text could be any interactive portfolio piece.
- **The naming prefix `/observatory/` mislocates these features** in the stack — they are below Observatory, not within it.
- **None of the demos link to Broch Sphere coordinates.** The Fractal Inspiration Atlas features nodes (Sagan, Feynman, etc.) that are also nodes on the Broch Sphere, but there is no cross-reference.

### Recommended Actions

| Action | Classification |
|---|---|
| Add a minimal "instrument card" metadata block to each demo: one paragraph stating what the instrument measures, what assumptions it makes, what the output means | POST-LAUNCH |
| Add Broch Sphere coordinate annotations to demos where relevant (e.g., "This instrument sits at Engineering/ACTIVE — see it on the Broch Sphere") | LONG-TERM |
| Keep `/observatory/*` route prefix — renaming routes would break URLs and harm SEO | — |

---

## 6. Navigation

**Alignment Score: 3 / 10**

### Evidence

Primary nav: Home, Atlas, Observatory, Archive, Media, xPRIMEray (external), GitHub (external). Mobile nav mirrors desktop. Header logo reads "MisterY Labs / Gateway Observatory". No Broch Sphere. No Research in nav (accessible at `/research` but not linked from nav).

### Strengths

- Navigation is clean, accessible, and technically well-implemented (mobile menu, active states, theme toggle).
- Including external links to xPRIMEray demo and GitHub directly in nav is a useful bridge to the instrument.

### Misalignments

- **The Navigator Stack order is completely invisible in navigation.** A visitor sees: Home → Atlas → Observatory → Archive → Media. Nothing in this sequence communicates the relationship between these layers or why that sequence exists.
- **Broch Sphere is absent from navigation.** This is the most significant single misalignment in the entire site. The navigation layer of the Navigator Stack cannot be found via navigation.
- **"Gateway Observatory" sub-label is confusing.** The header says "MisterY Labs / Gateway Observatory" — but Observatory is also a page in the nav. A visitor naturally assumes these are the same thing. They are not.
- **Archive is in primary nav, Broch Sphere is not.** Archive is a secondary evidence vault. Broch Sphere is the navigation philosophy. The ordering suggests the inverse of the charter's priority.
- **Research page exists but is not in primary nav.** Research is the precursor to Observatory Artifacts — it has epistemic weight in the stack.

### Recommended Actions

| Action | Classification |
|---|---|
| Add "Broch Sphere" to primary nav | FOUNDATIONAL |
| Replace "Gateway Observatory" sub-label with something that names the navigator role, e.g. "Knowledge Observatory" or "Navigator" | RELEASE |
| Consider moving Archive out of primary nav into a secondary footer or Atlas sub-nav | POST-LAUNCH |
| Consider adding Research to primary nav or Atlas sub-nav, removing Archive from primary | POST-LAUNCH |

---

## 7. Documentation

**Alignment Score: 2 / 10**

### Evidence

Files present: `README.md` (dev setup + deploy), `GROK.md` (agent rules), `LINK_AUDIT.md`, `charter/CHARTER_2026.md`, `charter/EVOLUTION_LOG.md` (stub), `assets/internal/MisterYLabs_Foundation.md`, `assets/internal/Broch Sphere Philosophy v1.md`, `assets/internal/Broch Sphere Philosophy v2 — The Helix.md`.

The charter document itself ends with a proposed sub-document structure that does not exist:
```
docs/charter/
├── CHARTER_2026.md     ← exists (in charter/, not docs/charter/)
├── RELEASE_PHILOSOPHY.md  ← does not exist
├── COMMUNITY_PRINCIPLES.md ← does not exist
├── CONTRIBUTOR_ROLES.md  ← does not exist
└── EVOLUTION_LOG.md    ← exists (as a 7-line stub)
```

### Strengths

- The **Philosophy documents (v1, v2) are excellent** — rigorous, internally consistent, well-written. They are the strongest documentation in the repository.
- The **Foundation doc** is comprehensive and coherent.
- The Charter itself is clear and well-structured.

### Misalignments

- **`README.md` communicates nothing about MisterY Labs.** It reads as a purely technical deployment guide. A person who clones this repository learns how to start a dev server. They learn nothing about why this project exists, what the Navigator Stack is, what they might contribute, or how the repository is organized philosophically.
- **The Evolution Log is a 7-line template with zero entries.** This is the document the charter describes as "priceless in five years." It is currently empty.
- **Three charter sub-documents are referenced but do not exist.** `RELEASE_PHILOSOPHY.md`, `COMMUNITY_PRINCIPLES.md`, `CONTRIBUTOR_ROLES.md` — these are referenced in the charter's own structure diagram.
- **The philosophy documents are internal only.** They live in `assets/internal/` and are not linked from anywhere publicly. A visitor exploring the Broch Sphere cannot access the conceptual framework.
- **No `CONTRIBUTING.md` exists.** The charter describes five community roles and six participation types. There is no document that tells a potential contributor what any of those mean in practice.

### Recommended Actions

| Action | Classification |
|---|---|
| Rewrite `README.md` to open with the MisterY Labs mission statement (2–3 sentences from the Charter), then provide the technical setup below | RELEASE |
| Write the first Evolution Log entry — Q2 2026, four questions, even briefly | FOUNDATIONAL |
| Create `CONTRIBUTING.md` describing the five community roles and linking to each relevant feature | POST-LAUNCH |
| Write `charter/CONTRIBUTOR_ROLES.md` — the simplest of the missing sub-documents | POST-LAUNCH |
| Make Philosophy v1 accessible from the Broch Sphere page (link or embedded summary) — remove "internal only" status | RELEASE |
| Write `charter/RELEASE_PHILOSOPHY.md` and `charter/COMMUNITY_PRINCIPLES.md` when the community grows enough to need them | LONG-TERM |

---

## 8. GitHub Structure

**Alignment Score: 2 / 10**

### Evidence

GitHub repository structure visible through filesystem. No `.github/` folder examined (beyond deploy workflow). No issue templates, discussion structure, or community templates confirmed present.

### Strengths

- GitHub Actions deploy pipeline is working.
- The repository *exists* and is public — the prerequisite for everything else.
- External nav links to GitHub are present in the site header.

### Misalignments

- **The repository communicates nothing about the project mission.** A visitor arriving at GitHub sees a React+Vite setup without any indication of why it exists.
- **No community structure.** No issue templates for "Instrument Report," "Constellation Proposal," or "Observatory Artifact" submission. The charter names these as participation types — none are scaffolded.
- **No CONTRIBUTING.md** (covered in Documentation, but applies here too).
- **No GitHub Discussions** (or evidence of it). The charter describes a community of participants. There is no community infrastructure.
- **The repository name** (`misterylabs`) communicates the brand but not the mission.

### Recommended Actions

| Action | Classification |
|---|---|
| Add GitHub repository description + topics to improve discoverability | RELEASE |
| Update repository `About` section with the mission statement | RELEASE |
| Add GitHub issue templates for: Bug Report, Instrument Report, Constellation Proposal | POST-LAUNCH |
| Enable GitHub Discussions with categories matching charter participation types | POST-LAUNCH |
| Add `CONTRIBUTING.md` to repository root | POST-LAUNCH |

---

## 9. Contribution Pathways

**Alignment Score: 3 / 10**

### Evidence

Auth system (Supabase) exists with sign-in at `/auth`. Signed-in users access Mission Control (dashboard) with project kanban, progress tracking, QuickCreateDialog. "Get Involved" section in Atlas (content not fully examined but exists). No role-specific pathways confirmed beyond project management.

### Strengths

- The auth system and dashboard exist. There is a real pathway for Instrument Makers to join and track work.
- The "Get Involved" section in Atlas shows awareness that participation matters.
- The QuickCreateDialog provides a low-friction entry for new project proposals.

### Misalignments

- **Only one of five community roles has a pathway.** Mission Control serves the Instrument Maker. The Verifier, Receiver, Lineage Navigator, and Translator have no distinct entry points, no documentation of what their contribution would look like, no tools built for them.
- **The Broch Sphere Stance toggle (Verifier / Receiver) is the one feature that serves multiple roles** — but it is a reading stance, not a contribution pathway. The Verifier can read from their angle; they cannot submit a verification.
- **No participation type is formalized.** The charter names: Observatory Artifacts, Expedition Logs, Resonance Echoes, Constellation Proposals, Instrument Reports, Transfer Event documentation. None of these has a submission format or landing page.
- **The "Get Involved" section exists in the Atlas but is at the bottom of a very long page** — it communicates low priority in the information hierarchy.

### Recommended Actions

| Action | Classification |
|---|---|
| Define what a "Constellation Proposal" looks like concretely — a text format, a GitHub issue template, or a Broch Sphere node submission format | POST-LAUNCH |
| Define what a "Resonance Echo" is — a written response? A linked artifact? The term appears in the charter but has no implementation anywhere | POST-LAUNCH |
| Make "Get Involved" a proper route (`/get-involved`) rather than a buried section, or at minimum give it a primary-nav-level card on the home page | POST-LAUNCH |
| For v1 release: acknowledge that only the Instrument Maker pathway is ready, and say so explicitly ("Expanding participation roles in Phase 2") | RELEASE |

---

## Summary Scorecard

| Area | Score | Primary Gap |
|---|---|---|
| Home | 4 / 10 | Navigator Stack invisible; Broch Sphere absent; only Instrument Maker invited |
| Atlas | 6 / 10 | Functions as demo gallery; no artifact metadata; Get Involved buried |
| Observatory | 5 / 10 | Conflates project management with measurement layer; no artifact format |
| **Broch Sphere** | **8 / 10** | **Most aligned feature; absent from nav; MisterY Labs incorrectly as a node** |
| Demo Routes | 5 / 10 | Instruments without artifact metadata; presented as entertainment |
| Navigation | 3 / 10 | Stack invisible; Broch Sphere not linked; Archive over-weighted |
| Documentation | 2 / 10 | README is dev-only; Evolution Log empty; charter sub-docs missing |
| GitHub Structure | 2 / 10 | No mission communication; no community templates |
| Contribution Pathways | 3 / 10 | Only Instrument Maker served; no role pathways; participation types undefined |
| **Overall** | **4.2 / 10** | |

---

---

# MisterY Labs Alignment Roadmap 2026

Organized to **remove work whenever possible** and prefer simplification over expansion.

The roadmap is honest about what Phase 1 (Release Candidate) cannot include. Participation infrastructure should not ship half-formed. One clear pathway beats five vague ones.

---

## Phase 1 — Release Candidate

*Goal: Make the existing implementation coherent with the charter. No new features.*

*Principle: A visitor should be able to understand what MisterY Labs is, navigate to its navigation layer, and find one clear path to participate.*

**FOUNDATIONAL — must ship before release**

1. **Add Broch Sphere to primary navigation** (`AppHeader.tsx` NAV_LINKS)  
   One line of code. Highest-leverage change in the entire roadmap.

2. **Remove MisterY Labs as a node from the Broch Sphere graph** (`nodes.ts`)  
   Philosophy v1 is explicit: MisterY Labs is the navigator, not a node. This is a direct contradiction that must be resolved.

3. **Write the first Evolution Log entry** (`charter/EVOLUTION_LOG.md`)  
   Four questions, Q2 2026. This document was designed to be the "priceless record in five years." Year one, entry zero — it needs to exist.

**RELEASE — should ship with Release Candidate**

4. **Add 2–3 sentence Navigator Stack statement to home page**  
   Below the hero, above the artifact section. Not a redesign — one paragraph. Tells visitors where they are in the stack.

5. **Rewrite README.md** to open with the mission statement (3 sentences), then dev setup below.  
   Current README tells developers how to clone. It doesn't tell anyone why.

6. **Fix the Atlas hero headline** — it currently repeats the home page headline verbatim.  
   Give Atlas its own statement: what the knowledge layer *is* and why it is different from Home.

7. **Update GitHub repository About/description** with mission statement and topics.  
   Zero code change. Affects discoverability immediately.

8. **Make Philosophy v1 accessible from Broch Sphere page**  
   Add a "Framework" link or a collapsed "About this map" section that summarizes or links to the v1 philosophy. Visitors interacting with the sphere deserve to understand the coordinate system.

**Remove or defer**

- `charter/RELEASE_PHILOSOPHY.md`, `charter/COMMUNITY_PRINCIPLES.md`, `charter/CONTRIBUTOR_ROLES.md` — do not create these before launch. The charter references them but they add no user-facing value at v1. Mark them as "roadmap" in the charter footer rather than implied-present.
- Participation role pathways (Verifier, Receiver, Lineage Navigator, Translator) — do not create half-formed pathways. One real pathway (Instrument Maker via dashboard) is better than five gestures.

---

## Phase 2 — Community Foundations

*Goal: Open participation beyond the Instrument Maker role.*

*Principle: Each new role must have a real pathway — a form, a template, a place to submit. No new role without a corresponding submission mechanism.*

**In scope**

9. **Create `CONTRIBUTING.md`** describing the five community roles and what a contribution from each looks like concretely.

10. **Define the Constellation Proposal format** — a specific document structure or GitHub issue template. Test it with one real proposal before making it public.

11. **Define the "Resonance Echo" format** — what is a Resonance Echo in practice? A written reflection? A linked artifact? A Broch Sphere node annotation? Decide and document before naming it publicly.

12. **Add Observatory Artifact metadata to demo cards** — inputs, assumptions, reproducibility status. Matches the Foundation doc spec. Start with the two most mature instruments (Transport Sphere, Poisson Dot).

13. **Add GitHub issue templates** for Instrument Report and Constellation Proposal.

14. **Create `charter/CONTRIBUTOR_ROLES.md`** — the most practically useful of the missing sub-documents.

15. **Move or elevate "Get Involved"** — either its own route or a home page card. Not a buried Atlas section.

**Remove or defer**

- Do not add GitHub Discussions until there is at least one person who is not the project creator to participate in it. Empty forums signal abandonment.
- Do not build Verifier or Receiver submission tools until those roles have real participants who have expressed interest in contributing. Build for the people in front of you.

---

## Phase 3 — Knowledge Network

*Goal: Connect the layers. Make the Navigator Stack navigable, not just described.*

*Principle: A visitor should be able to start at any layer and reach any other layer without leaving the site.*

**In scope**

16. **Connect FractalInspirationAtlas nodes to Broch Sphere coordinates.** When a visitor clicks "Carl Sagan" in the Inspiration Atlas, they should be able to navigate to his Broch Sphere node.

17. **Connect Observatory demos to their Broch Sphere coordinates.** Add a small "Where this sits on the Sphere →" annotation to each instrument card in Atlas.

18. **Expand Transfer Event data.** At minimum 3–5 documented events between the Knowledge Lineage strand and the Story Lineage strand. These are the Helix's most distinctive feature. Currently thin.

19. **Add Research to primary navigation or Atlas sub-nav.** Research has real epistemic content — it's the precursor lineage. It shouldn't be invisible in the nav.

20. **Consider moving Archive out of primary nav.** Archive is evidence vault infrastructure, not primary navigation. Footer or Atlas sub-section is more appropriate.

21. **Write `charter/COMMUNITY_PRINCIPLES.md`** — the principles are already in the charter; this sub-document organizes them for practical governance.

**Remove or defer**

- Do not attempt to make every Atlas section cross-link to Broch Sphere. Start with the highest-value nodes (Sagan, Feynman, Einstein) and expand from evidence of engagement.

---

## Phase 4 — Long-Term Vision

*Goal: The repository becomes the observatory it describes. Contributors can navigate the knowledge space and add to it.*

**In scope**

22. **Broch Sphere becomes dynamic.** Community members can propose new nodes via Constellation Proposals. Accepted proposals are merged. The sphere grows through collective refinement.

23. **Observatory Artifacts are formal records.** Each artifact has a persistent URL, version history, inputs, assumptions, limitations, and reproducibility status. The Foundation doc spec is fully implemented.

24. **The Evolution Log is updated quarterly.** The four-questions format is answered every Q. Future contributors can read the intellectual history of the project.

25. **`charter/RELEASE_PHILOSOPHY.md`** written when there is enough release history to extract principles from evidence rather than projection.

26. **GitHub Discussions active.** Categories: Observatory Artifacts, Expedition Logs, Constellation Proposals, Open Questions. Each category has real activity before being publicized.

**Remove or defer**

- There is no item 27. The charter's definition of success is not a feature count: *"I see this a little more clearly than I did before."* The roadmap ends when the observatory is doing its job, not when all the boxes are checked.

---

## Roadmap Reduction Summary

The roadmap above intentionally defers or removes:

| Deferred / Removed | Why |
|---|---|
| `RELEASE_PHILOSOPHY.md`, `COMMUNITY_PRINCIPLES.md` (Phase 1) | No user-facing value at launch; add complexity without clarity |
| Verifier/Receiver/Translator/Lineage Navigator submission tools (Phase 1–2) | Build for real participants, not projected ones |
| GitHub Discussions (Phase 2) | Empty infrastructure signals abandonment |
| Full Broch Sphere node cross-linking (Phase 3) | Start with highest-value nodes; evidence of engagement first |
| Dynamic Broch Sphere node submission (Phase 1–3) | Community governance requires a community first |

The most important change in the entire roadmap is also the smallest:

> Add Broch Sphere to the navigation.

Everything else follows from whether visitors can find the layer that explains what MisterY Labs is for.

---

*Audit prepared: 2026-06-24. Charter version: Founding Charter (2026).*
