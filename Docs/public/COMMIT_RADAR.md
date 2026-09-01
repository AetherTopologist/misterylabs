# Commit Radar

**Status:** foundation (docs only)  
**Date:** 2026-09-01  
**Does not:** implement Three Suns, Schwinger explorer, or orb demos  
**Does:** rank them, name the plug-in points, protect xPRIMEray semantics

Commit Radar is the **implementation ranking** sitting on top of
[`INSPIRATION_QUEUE.md`](./INSPIRATION_QUEUE.md).

It is **not** the authenticated Mission Kanban
(`Backlog → Researching → Validating → Building → Launched` in Dashboard).
It is **not** Atlas. Atlas is lineage. Observatory is measurement.
Commit Radar is: *what small public exhibit earns its complexity next.*

```
Inspiration Queue  →  Commit Radar  →  Observatory fixture (layer 2/3)
         ↑                    ↓
   Atlas node            xPRIMEray (read-only engine)
```

---

## A. Existing architecture findings

Inspected: `AetherTopologist/misterylabs` @ `ed79cb855381f12aca593bf7fdd859b1a83f1be7`

### What already exists (plug here)

| Surface | Authority | Pais / Three Suns / Schwinger |
|---|---|---|
| [`Docs/public/MISTERY_LABS_PUBLIC_CHARTER.md`](./MISTERY_LABS_PUBLIC_CHARTER.md) | Public scientific + attribution contract | Already requires source / observation / interpretation / speculation split |
| [`Docs/public/INSPIRATION_QUEUE.md`](./INSPIRATION_QUEUE.md) | Capture template (currently empty of entries) | **Fill this first** |
| `src/pages/Atlas.tsx` `INSPIRATIONS[]` | Live Atlas cards | **`salvatore-pais` already exists** as tier `observer`, category `Frontier Interface Signals`. Wikipedia href. Correct stance, thin sources. |
| `AtlasEntry` (`source`, `researchQuestion`, `flowSteps`, `statusLabel`) | Deeper Atlas articles | Pais has a *card*, not a full `AtlasEntry` source stack |
| `src/types/inspiration.ts` | Resonance-spheres model (`externalLinks`, `xprimeRayAlignment`) | Better home for patent URLs than a single `href` |
| Observatory `Fixture` (`layer` 1–3, `status` mature/public/research/experimental/placeholder) | Public vs exploratory demos | New demos enter as **experimental** until the misconception-test is proven |
| FractalAcademia `exploratory: boolean` | Lattice badge | Reuse, do not invent a third badge system |
| `src/components/Badges.tsx` | Mission Status/Priority/Confidence | **Do not overload.** Epistemic labels are a different axis ([`EPISTEMIC_LABELS.md`](./EPISTEMIC_LABELS.md)) |
| Routes `/observatory/*` + `DemoWrapper` | Lazy public interactives | Future Schwinger / Three Suns live here, not in engine docs |
| `demos/portals_pocket/` | Exploratory demo seed | Pattern: pocket demo + README + public caption. Copy this, not Godot. |
| xPRIMEray | **Upstream, read-only** | `agents.md`: do not rewrite engine semantics to fit Pais |

### What does not exist

- No Schwinger, QED, magnetar, or solar-model exhibit
- No Commit Radar data model
- No epistemic badge component (Academia “Exploratory” is the closest)
- No model-selector primitive (same geometry, swap causal engine)
- Pais Atlas card does not link patents

### Doctrine already in force (do not re-legislate)

From public charter + Atlas charter + `agents.md`:

- Inclusion ≠ endorsement
- Speculative interpretation is not experimental evidence
- Mobile-first; one obvious manipulation; text secondary
- “What misconception does interaction dissolve?”
- **Do not begin the public journey with exotic geometry**

That last line decides the first demo.

---

## B. Inspiration node (Pais)

Keep Atlas id `salvatore-pais`. Do not fork a second Pais identity.

Upgrade path:

1. Source dossier: [`inspirations/pais/SOURCES.md`](./inspirations/pais/SOURCES.md)
2. Queue entry (this radar)
3. Later: `AtlasEntry` with patent `source.links[]` and `statusLabel: "Inspiration Node · Not a validated result"`
4. Later: Resonance node `externalLinks` for USPTO / IEEE

**Four provenance grades (must appear on every Pais-derived exhibit):**

| Grade | Example |
|---|---|
| 1 Pais as written | “accelerated vibration/spin of charged matter → high EM energy flux” (patent language) |
| 2 Mathematical analogy | Intense EM energy-momentum → possible optical / Gordon-like analogue metric |
| 3 MisterY Labs extrapolation | Standard solar interior + *hypothetical* active sheath |
| 4 Speculative visualization | Golden orb, Renaissance-science portrait, field-line illuminated manuscript |

Art direction (solemn figure holding a miniature sun) is grade 4 + **ART DIRECTION**.
Never caption it as a historical painting of Pais.

---

## C. Ranked candidates

Scoring axes (qualitative, 1–5):

- **Sci dep** — needs settled numbers / sources
- **Engine dep** — needs xPRIMEray (0 = WebGL/SVG toy)
- **Public value** — wonder × clarity of the border
- **Difficulty**
- **Mislead risk** — chance a visitor thinks we “proved” the exotic model

### NOW

#### 1. Epistemic chrome + queue fill
- **Concept:** Labels, source cards, “established / speculative” on *any* future demo
- Sci 2 · Engine 0 · Value 5 · Diff 1 · Mislead **lowers** future risk
- **Smallest commit:** `EPISTEMIC_LABELS.md` + Pais `SOURCES.md` + this radar (this branch)

#### 2. Schwinger Scale Explorer (recommended first *visual*)
- **Concept:** Logarithmic field elevator. Same glyph of a solar/lab structure. Slider moves decades of \(E\) or \(B\). Regimes light up. Gap to \(E_c\) always visible.
- Sci 3 (need honest order-of-magnitude table, not Pais) · Engine 0 · Value 5 · Diff 2 · Mislead 2
- **Misconception dissolved:** “solar plasma / Navy patents / Schwinger vacuum are the same scale”
- **Smallest commit:** one `/observatory/schwinger-scale` toy; Layer 3 experimental; labels ESTABLISHED PHYSICS on the *rungs*, SPECULATIVE VISUALIZATION on any “what if local spike” overlay
- **Scale rungs (research labels, not Pais):**

| Rung | Approx | Label |
|---|---|---|
| Quiet-Sun photospheric B | \(\sim 10^{-4}\,\mathrm{T}\) | OBSERVATION |
| Sunspot B | \(\sim 0.1\)–\(0.4\,\mathrm{T}\) | OBSERVATION |
| Lab tokamak B | \(\sim 5\)–\(10\,\mathrm{T}\) | ESTABLISHED PHYSICS |
| Petawatt-class laser \(E\) | \(\sim 10^{13}\)–\(10^{15}\,\mathrm{V/m}\) | ESTABLISHED PHYSICS (lab) |
| Magnetar surface B | \(\sim 10^{8}\)–\(10^{11}\,\mathrm{T}\) | OBSERVATION |
| QED critical \(B_c\) | \(\approx 4.4\times 10^{9}\,\mathrm{T}\) | ESTABLISHED PHYSICS (theory) |
| Schwinger \(E_c\) | \(\approx 1.32\times 10^{18}\,\mathrm{V/m}\) | ESTABLISHED PHYSICS (theory) |

Sunspot \(B\) vs \(B_c\): **~10 orders of magnitude**. That number is the exhibit.

Schwinger is a **scale marker**, not evidence the Sun (or a Pais device) reaches it.

### NEXT

#### 3. Generic rotating charged orb (toy)
- Counter-rotating charge/plasma shells; field compression *glyph*
- Sci 2 · Engine 0 · Value 4 · Diff 3 · Mislead 3
- **Smallest commit:** 2-D canvas/WebGL toroid + “TOY MODEL” + link to US10144532B2 as inspiration, not mechanism proof

#### 4. Pais sheath toy (not a star yet)
- Standard ball + optional sheath/filament toggle
- Sci 3 · Engine 0 · Value 4 · Diff 3 · Mislead 3
- Grade 3 extrapolation. Question: *if* a localized structure approached nonlinear-QED, what optical/plasma/pair signatures?

#### 5. Three Suns — same ball, different first cause
- Selector: `[ STANDARD ] [ PAIS SHEATH ] [ ELECTRIC SUN ]`
- Same camera, same photosphere glyph
- Causal arrows must pop: fusion-core **outward** vs sheath **local** vs EU **inward from external current**
- Sci 4 · Engine 0 for v0 · Value 5 · Diff 4 · Mislead **5** if shipped before Schwinger explorer
- **Depends on 1–4.** Charter: do not start with exotic geometry.
- Standard model is **ESTABLISHED PHYSICS** (neutrinos, helioseismology, 5800 K, hot corona, remaining opacity/coronal-heating as OPEN QUESTION)
- Pais sheath is **PAIS-INSPIRED** + **MISTERY LABS EXTRAPOLATION**
- Electric Sun is **ALTERNATIVE MODEL** — conflicts with neutrinos, helioseismology, energy budget, charge neutrality, heliosphere. Do not merge with Pais.

### LATER

#### 6. Pinch / toroid compression
#### 7. Field envelope (assumed optical/metric region around an object)
#### 8. Vacuum-response fade (Maxwell glyph → hypothetical nonlinear vacuum)
#### 9. “What would an observer see?” — feed assumed n(x) / analogue metric into **existing** transport viz (`TransportSphere`, Poisson/negative-IOR toys). Still not engine rewrite.
#### 10. xPRIMEray-compatible field → Observatory experiment → comparative probes  
Ladder (do not skip rungs):

```
STATIC ART
→ WebGL field glyph
→ parameterized toy
→ xPRIMEray-compatible field (engine-owned)
→ Observatory experiment
→ comparative probe views
```

Ask the engine, don’t fake it: ray paths, lensing, displacement, redshift analogue, caustics, occlusion, time-delay analogue, later polarization, observer-dependent geometry, shells/toroids/filaments.

Same frame. Same transport. Different questions.
Outcome → Contact Events → Transport Effort.

### MOONSHOT

#### 11. MH370 optical-signature sandbox
- Modes: ordinary / synthetic compositing / sensor artifact / hypothetical exotic field
- Frame: “geometry / compositing / motion / optical-signature **hypothesis explorer**”
- Not a declaration of what occurred
- Lower than Sun, Schwinger, generic orbs
- Adjacent Atlas node `ashton-forbes` already carries the “not endorsement” clause — keep them linked, not fused

#### 12. Illuminated-manuscript physics (art layer)
- Renaissance-science figure, golden sphere, gold-leaf → field lines
- **ART DIRECTION** only. Media route, never Layer 1 Observatory.

---

## D. Dependency graph

```
Public Charter + Epistemic Labels
        ↓
Pais SOURCES (patents/IEEE)     Schwinger 1951 + solar/magnetar OBSERVATION table
        \                      /
         \                    /
          v                  v
        Schwinger Scale Explorer          ← FIRST VISUAL
                  ↓
        Rotating charged orb (toy)
                  ↓
        Pais sheath toy (not a star)
                  ↓
        Three Suns model selector
           /        |         \
    STANDARD    PAIS SHEATH   ELECTRIC SUN
    (baseline)  (extrapolation) (alternative)
                  ↓
        xPRIMEray optical probe (only with a real field representation)
                  ↓
        Observer-dependent signatures
                  ↓
        MH370 sandbox (last)
```

Better than the prompt’s linear Pais→Schwinger→orb→sheath→solar→xPRIMEray graph because **Schwinger scale does not depend on Pais**. It is established QED. Pais hangs off it as “how far is the hypothesis from this rung?”

---

## E. First stable spine (3–6 commits)

Favor infrastructure that later hosts *many* Inspirations.

| # | Commit | Touches | Locks us to Pais? |
|---|---|---|---|
| 1 | Epistemic labels + Pais source dossier + this radar | `Docs/public/*` only | No |
| 2 | Fill Inspiration Queue entries (Pais, Schwinger, Three Suns, orbs, MH370) | `INSPIRATION_QUEUE.md` | No |
| 3 | Atlas Pais `href` → source card / patent list; keep Wikipedia as locator | `Atlas.tsx` | No (already there) |
| 4 | `<EpistemicBadge>` reused beside Academia/Observatory status | `src/components/` | No |
| 5 | Schwinger Scale Explorer, Observatory layer 3, one slider | `/observatory/schwinger-scale` | No |
| 6 | Model-selector primitive (same scene, swap causal engine metadata) | shared component | No — Three Suns is the first *user* of it |

Do **not** ship Three Suns in this spine.
Do **not** add Godot/xPRIMEray fields yet.

---

## F. Public language guardrails

See [`EPISTEMIC_LABELS.md`](./EPISTEMIC_LABELS.md).

Hard bans (GROK.md already): never “proves,” “confirms,” “endorsed by,” “Navy demonstrated.”

Required footer on Pais-adjacent pages:

> This is a thought-experiment laboratory. If we assume a field/configuration exists, what follows? A simulation is not a claim that nature works that way.

---

## G. First demo recommendation

**Schwinger Scale Explorer.**

Not Three Suns. Three Suns is the higher-wonder *second* visual, after the visitor can *feel* the decade gap.

Charter match:

- one obvious manipulation (log slider)
- visual change in ~10 seconds
- misconception dissolved without a wall of text
- engine dependency: none
- mislead risk: low if rungs are tagged ESTABLISHED PHYSICS and the “local spike” overlay is tagged SPECULATIVE

xPRIMEray connection (honest): none yet. Later, the explorer’s “assumed local \(E\)” becomes a parameter fed to a toy refractive analogue, then — only if the engine already supports that field class — an Observatory probe.

Art: the elevator can be a golden sphere whose *texture of meaning* changes with rung (photosphere → lab plasma → magnetar → vacuum spark). Same ball. Different first cause of the *label*, not yet of the star.

---

## Protection clause

Protect the weirdness.
Protect the science.

The border is the product.
