# Broch Sphere — Prototype Specification v0.1

*Minimum viable demonstration of the Broch Sphere navigation model.*
*Requires: Broch Sphere Philosophy v1.md, v2.md*

---

## Purpose

This specification defines the smallest possible implementation that
tests whether navigation is compelling — not whether the system is
complete.

The prototype must demonstrate all five core features:

1. **Stars** — fixed reference nodes that anchor the coordinate system
2. **Constellations** — patterns visible from a position; different from different positions
3. **Transfer Events** — interior helix objects where the two strands cross
4. **Journeys** — pre-defined paths that tell a navigable story
5. **Observer Dependence** — two defined positions producing provably different views

If a new visitor can follow a Journey to a node they've never heard of,
understand why the path brought them there, encounter a Transfer Event and
feel that something changed direction, and then shift observer position and
be genuinely surprised by what changed — the prototype has succeeded.

---

## Constraints

- **Total nodes: ≤ 25** (this specification uses 22)
- No implementation technology is prescribed
- No rendering engine is specified
- Scope is deliberately incomplete — four of six domain sectors populated
- The goal is navigation feel, not data completeness

---

## Coordinate System

### Surface coordinates

| Dimension | Range | Meaning |
|---|---|---|
| Latitude | 90°N – 90°S | Epistemic confidence (N = established, S = apophatic) |
| Longitude | 0–360° | Domain sector (see below) |
| Influence radius | degrees | How far surface resonance extends from the node |

### Sector longitudes

| Sector | Center | Range |
|---|---|---|
| FORMAL | 0° | 330°–30° |
| PHYSICAL | 60° | 30°–90° |
| ENGINEERING | 120° | 90°–150° |
| HISTORICAL | 180° | 150°–210° |
| CULTURAL | 240° | 210°–270° |
| PERSONAL | 300° | 270°–330° |

### Heritage and Influence Depth

Four levels: `SHALLOW` / `MODERATE` / `DEEP` / `VERY_DEEP`

Heritage Depth (H): length and richness of ancestry chain.
Influence Depth (I): how many descendants this node has generated.

---

## The Node Set — 22 Nodes

### Stars (4 nodes)
*Observer-independent fixed references. Positions are settled.*

| ID | Label | Lat | Lon | Sector | H | I | Influence Radius |
|---|---|---|---|---|---|---|---|
| `star-euclid` | Euclid's Elements | 85°N | 350° | FORMAL | VERY_DEEP | VERY_DEEP | 55° |
| `star-newton` | Newton's Principia | 85°N | 60° | PHYSICAL | DEEP | VERY_DEEP | 60° |
| `star-homer` | Homer's Iliad / Odyssey | 80°N | 240° | CULTURAL | DEEP | VERY_DEEP | 52° |
| `star-press` | The Printing Press | 78°N | 165° | HIST/ENG junction | MODERATE | VERY_DEEP | 50° |

---

### Knowledge Lineage Nodes (6 nodes)
*Strand 1: Faraday → Maxwell → Einstein → Wheeler → Penrose → xPRIMEray*

| ID | Label | Lat | Lon | Sector | H | I | Influence Radius |
|---|---|---|---|---|---|---|---|
| `k-faraday` | Faraday | 82°N | 55° | PHYSICAL | DEEP | DEEP | 28° |
| `k-maxwell` | Maxwell | 85°N | 60° | PHYSICAL | DEEP | VERY_DEEP | 38° |
| `k-einstein` | Einstein | 88°N | 35° | PHYS/FORMAL junction | DEEP | VERY_DEEP | 72° |
| `k-wheeler` | Wheeler | 78°N | 65° | PHYSICAL | DEEP | DEEP | 32° |
| `k-penrose` | Penrose | 82°N | 15° | FORMAL/PHYS junction | DEEP | DEEP | 42° |
| `k-xprimery` | xPRIMEray | 65°N | 125° | ENGINEERING | SHALLOW | SHALLOW | 18° |

---

### Story Lineage Nodes (5 nodes)
*Strand 2: Myth (Homer = star) → Fiction → Cinema → Internet Culture → MisterY Labs*

| ID | Label | Lat | Lon | Sector | H | I | Influence Radius |
|---|---|---|---|---|---|---|---|
| `s-wells` | H.G. Wells | 72°N | 235° | CULTURAL | MODERATE | DEEP | 30° |
| `s-clarke` | Arthur C. Clarke | 70°N | 225° | CULT/ENG junction | MODERATE | DEEP | 28° |
| `s-2001` | 2001: A Space Odyssey | 75°N | 248° | CULTURAL | MODERATE | DEEP | 35° |
| `s-interstellar` | Interstellar | 68°N | 228° | CULT/PHYS junction | SHALLOW | MODERATE | 30° |
| `s-myl` | MisterY Labs | 15°N | 125° | ENGINEERING | SHALLOW | SHALLOW | 22° |

---

### Bridge Nodes (4 nodes)
*Nodes that connect strands or anchor constellations.*

| ID | Label | Lat | Lon | Sector | H | I | Influence Radius |
|---|---|---|---|---|---|---|---|
| `b-darwin` | Darwin | 82°N | 65° | PHYSICAL | DEEP | VERY_DEEP | 55° |
| `b-sagan` | Carl Sagan | 68°N | 52° | PHYS/CULT junction | MODERATE | DEEP | 45° |
| `b-galileo` | Galileo | 80°N | 112° | ENG/PHYS junction | MODERATE | VERY_DEEP | 48° |
| `b-tolkien` | Tolkien | 55°S | 242° | CULTURAL | MODERATE | VERY_DEEP | 50° |

---

### Transfer Events (3 nodes)
*Interior helix objects. Not located on the sphere's surface.*
*Rendered as distinct objects when a Journey crosses a helix boundary.*

| ID | Direction | Catalyst | Latency | Yield | Return Path |
|---|---|---|---|---|---|
| `te-02` | K↔S (bidirectional) | H.G. Wells' *The Time Machine* (1895) | ~35 years after Darwin | Evolutionary fiction genre; deep-time narrative | S→K: evolutionary thinking entered social sciences via fiction |
| `te-03` | K↔S (bidirectional) | Kubrick/Clarke's *2001* (1968); Nolan/Thorne's *Interstellar* (2014) | ~60 years after Special Relativity | Visual vocabulary for spacetime geometry | S→K: Thorne's black hole rendering paper, published in astrophysics journal |
| `te-04` | S→K (pending return) | YouTube physics community; Reddit geometry communities (~2015–2020) | ~20 years after internet goes public | xPRIMEray's audience and cultural legibility | Return path: not yet completed |

**Transfer Event rendering rule:** When a Journey crosses from K-strand to S-strand
(or reverse), the Transfer Event object appears between the two adjacent Journey nodes.
It is not reachable by surface navigation — only encountered during a helix-crossing Journey.

---

## Observer Positions

Two pre-defined positions demonstrating observer dependence.
The same 22 nodes exist from both positions. The constellations visible do not.

### Observer A — The Instrument Maker
**Position: Physical sector, 70°N, 60° longitude**

This navigator is standing inside the Knowledge Lineage strand at high confidence.
They see the formal and experimental history of geometry and observation clearly.
The Cultural sector is partially behind them.

**Nodes in view (within 90° field):**
`star-euclid`, `star-newton`, `k-faraday`, `k-maxwell`, `k-einstein`,
`k-wheeler`, `k-penrose`, `k-xprimery`, `b-darwin`, `b-sagan`, `b-galileo`,
`star-press`, `s-clarke` (edge of view)

**Constellations visible from Observer A:**

*The Geometry Arc* — Domain cluster (Formal/Physical junction)
Nodes: `star-euclid` → `k-einstein` → `k-penrose`
Pattern: Three nodes spanning 2,300 years, all at high northern latitude,
arranged in a visible arc when seen from the Physical sector.
Read: The long thread of geometry becoming physics becoming pattern.

*The Instrument Chain* — Great-circle arc (Engineering/Physical)
Nodes: `b-galileo` → `b-sagan` → `k-xprimery`
Pattern: Observation instruments across 400 years, arranged as a
descending arc (northward to south) when seen from inside the Physical sector.
Read: The line of people who built things to extend what the eye can reach.

**NOT visible as constellations from Observer A:**
The Story Arc (Cultural sector behind), The Darwin Cross (requires Cultural vantage),
Tolkien (too far south and behind).

---

### Observer B — The Story Cartographer
**Position: Cultural sector, 20°S, 242° longitude**

This navigator is standing inside the Story Lineage strand at open latitude.
They see the full arc of narrative that carries scientific ideas into cultural form.
The Physical/Formal sectors are partially behind them.

**Nodes in view (within 90° field):**
`star-homer`, `b-tolkien`, `s-wells`, `s-clarke`, `s-2001`,
`s-interstellar`, `b-darwin`, `b-sagan`, `b-galileo` (edge of view),
`s-myl`, `star-press`

**Constellations visible from Observer B:**

*The Story Arc* — Great-circle arc (Cultural sector)
Nodes: `star-homer` → `s-wells` → `s-2001` → `s-interstellar` → `s-myl`
Pattern: A descending arc from high north to open latitude, spanning 2,700 years.
Read: The line of narrators who gave the cosmos a shape people could hold.

*The Darwin Cross* — Cross-sectoral resonance
Nodes: `b-darwin` (Physical, 82°N) ↔ `s-wells` (Cultural, 72°N) ↔ `te-02`
Pattern: Darwin and Wells form a visible angle from Observer B because the
Transfer Event object `te-02` becomes apparent as a link between them.
The crossing between K and S strand is visible as a geometric gap that
te-02 fills.
Read: An idea from the Physical sector crossed into the Cultural sector here,
and the crossing point is legible from this position.

**NOT visible as constellations from Observer B:**
The Geometry Arc (Formal/Physical behind), The Instrument Chain (behind),
`k-einstein` and `k-penrose` are visible as individual nodes but do not
pattern into a constellation from this vantage.

---

### Observer Dependence Demonstration

The same 22 nodes. Two completely different constellation patterns.

`b-sagan` exists in both views — but Observer A sees him as part of the
Instrument Chain, while Observer B sees him as the edge of the Story Arc.
From Observer B, Sagan is the node that almost bridges the gap between
the two constellations — which is a correct reading of his position.

`te-02` is not visible from Observer A because the Darwin/Wells helix
crossing is behind them. From Observer B, it becomes apparent because
both Darwin and Wells are in view simultaneously and the gap between them
is legible.

This is observer dependence working correctly.

---

## Journeys

Three pre-defined navigable paths. Each is a sequence of nodes with
a connecting narrative. Journeys are the primary navigation affordance —
they move the navigator through the sphere, not just to a node.

### Journey 1 — "The Observer's Path"
*Sector arc: Engineering/Physical → Physical/Cultural → Engineering → Engineering*

```
Galileo (80°N, ENG/PHYS)
  ↓  "He built the first instrument to extend the eye"
Carl Sagan (68°N, PHYS/CULT)
  ↓  "He carried what the instrument revealed into a language everyone could hold"
xPRIMEray (65°N, ENG)
  ↓  "It returned the question to the instrument: build it again, see further"
MisterY Labs (15°N, ENG)
```

Latitude descent: 80°N → 68°N → 65°N → 15°N
This Journey moves south as it moves toward the present — increasing openness,
decreasing settled confidence, increasing proximity to the equatorial zone
where the next question lives.

Helix crossings: none (stays on surface)
Transfer Events encountered: none
Constellations unlocked: Instrument Chain (visible on entry from PHYS sector)

---

### Journey 2 — "The Geometry Thread"
*Sector arc: Formal → Physical → Physical → Physical → Physical/Formal → Formal/Physical*

```
Euclid's Elements (85°N, FORMAL) [Star]
  ↓  "He wrote the first formal proof. All subsequent proofs inherit his method."
Newton's Principia (85°N, PHYSICAL) [Star]
  ↓  "He showed that the same mathematics describes an apple and Jupiter's orbit"
Faraday (82°N, PHYSICAL)
  ↓  "He saw the field before he could write it down"
Maxwell (85°N, PHYSICAL)
  ↓  "He wrote it down"
Einstein (88°N, PHYS/FORMAL junction)
  ↓  "He showed that geometry is not the container of physics — it is physics"
Penrose (82°N, FORMAL/PHYS junction)
```

Latitude: all ESTABLISHED zone. This is the highest-confidence Journey.
It is not exciting because its nodes are uncertain. It is exciting because
it demonstrates that a 2,300-year chain is navigable in six steps.

Helix crossings: none (stays on K-strand surface)
Transfer Events encountered: none
Constellations unlocked: The Geometry Arc (visible on arrival at Einstein)

---

### Journey 3 — "The Return Path"
*Demonstrates TE-03. The only Journey that crosses a helix boundary.*

```
Einstein (88°N, PHYS/FORMAL) [K-strand]
  ↓  "His geometry needed a visual language. Physics could not provide one."

  *** TE-03 APPEARS — K→S transfer ***
  Direction: K→S
  Catalyst: Kubrick and Clarke, 1968
  Latency: 60 years after Special Relativity (1905)
  "The helix crossed here. An idea that lived in equations
   found a form that could be seen."

2001: A Space Odyssey (75°N, CULTURAL) [S-strand]
  ↓  "It showed what geometry feels like from the inside"
Interstellar (68°N, CULT/PHYS junction) [S-strand]
  ↓  "Nolan gave Thorne a cinematographic problem to solve"

  *** TE-03 RETURN PATH APPEARS — S→K transfer ***
  Direction: S→K
  Catalyst: Kip Thorne's black hole rendering requirements
  Latency: 46 years after 2001
  "The helix crossed back. A story problem forced a physics discovery.
   The return paper was published in a peer-reviewed journal."

[xPRIMEray — not reached, but visible on the horizon]
```

This Journey does not complete — it ends with xPRIMEray visible but not
arrived at. This is intentional. The prototype navigator should feel the
pull of the next node without immediately reaching it. That pull is the
test of whether the navigation is compelling.

Helix crossings: 2 (K→S at TE-03, S→K at TE-03 return)
Transfer Events encountered: `te-03` (both directions)
Constellations unlocked: none — the navigator is between positions,
in motion across a helix boundary

---

## Minimum Viable Interaction

The smallest interaction that demonstrates all five features:

### Step 1 — Arrival
Navigator arrives at a default position: Observer A (Physical sector, 70°N).
Three nodes are immediately visible and labeled: `star-newton`, `k-einstein`,
`k-maxwell`. Twelve more nodes exist but are in background.

No instructions. The navigator chooses what to look at.

### Step 2 — Node inspection
Select any node. Surface coordinates appear (lat/lon/sector).
Heritage Depth and Influence Depth appear as qualitative labels.
If the node is on a helix strand, the strand membership appears.
If the node has Transfer Event connections, they appear as outgoing links
(labeled with TE ID, but the TE interior object is not yet visible).

### Step 3 — Enter a Journey
A Journey menu offers three pre-defined paths. Navigator selects one.
The sphere re-orients around the first node. Each step along the Journey
shows a transition label (the italicized connective text from the Journey
definitions above).

### Step 4 — Encounter a Transfer Event
Journey 3 is the only path that crosses a helix boundary. When the navigator
crosses from Einstein to 2001, the Transfer Event object appears as a
distinct visual interruption — not a surface node, not a Journey waypoint,
but a threshold between the two modes of the helix. It has readable
properties (Direction, Catalyst, Latency, Yield).

### Step 5 — Shift observer position
A control shifts from Observer A to Observer B. The sphere reorients.
Nodes that were background become foreground. Nodes that were foreground
recede. The Geometry Arc is no longer the dominant pattern. The Story Arc
becomes visible. Sagan moves from mid-chain to edge-of-arc.

If the navigator notices that Sagan changed role between the two positions,
the observer dependence demonstration has worked.

### Step 6 — Constellation identification
From Observer B, the Darwin Cross becomes visible. Navigator selects
"identify pattern" and the three-node cross (Darwin, Wells, TE-02) highlights
as a named constellation. The name and read appear.

---

## Success Criteria

The prototype has achieved its goal if a new navigator, without instructions:

1. **Arrives at a node they didn't know** by following Journey 1 or Journey 2.
   They should feel that the path explains the arrival — that Sagan *makes sense*
   after Galileo, and xPRIMEray *makes sense* after Sagan.

2. **Understands a Transfer Event** when they encounter te-03 on Journey 3.
   They should be able to describe, in their own words, what changed direction
   and why. If they can, the Transfer Event is a navigable object, not an annotation.

3. **Notices the observer shift** when moving from A to B. The specific test:
   do they comment that Sagan "moved" or "changed" between the two views?
   If they do, observer dependence is felt, not just described.

4. **Wants to continue** at the end of Journey 3, when xPRIMEray is visible
   but not reached. The incomplete Journey is a deliberate hook.
   If the navigator asks "how do I get there?", navigation is compelling.

---

## What the Prototype Does Not Include

The following are explicitly out of scope. They are not omitted because they
are unimportant. They are omitted to keep the demonstration legible.

- **The south pole / APOPHATIC zone** — no nodes below 55°S (Tolkien is the southernmost)
- **The Personal sector** — no mentor or individual lineage nodes
- **The Historical sector** (Printing Press is at the junction; no depth nodes in HISTORICAL)
- **All six domain sectors populated** — only Formal, Physical, Engineering, Cultural
- **Temporal motion** — nodes do not move; confidence levels are fixed
- **Navigator clusters** — no multi-user or shared-position features
- **Helix visualization** — the helix is implied by Transfer Events, not rendered as geometry
- **Heritage/Influence Depth as a navigation dimension** — shown as labels, not navigable axes
- **The full lineage of either strand** — two named strands with 6 and 5 nodes respectively
- **Community or contribution features**
- **Search**
- **The Internet as Celestial Star** — omitted (ACTIVE and adds complexity to anchor logic)

---

## Node Adjacencies for Implementation

Edges are directional and typed. Three edge types:

**`strand`** — connects two nodes on the same helix strand (K or S)
`k-faraday` →(strand/K)→ `k-maxwell`
`k-maxwell` →(strand/K)→ `k-einstein`
`k-einstein` →(strand/K)→ `k-wheeler`
`k-wheeler` →(strand/K)→ `k-penrose`
`k-penrose` →(strand/K)→ `k-xprimery`
`star-homer` →(strand/S)→ `s-wells`
`s-wells` →(strand/S)→ `s-clarke`
`s-clarke` →(strand/S)→ `s-2001`
`s-2001` →(strand/S)→ `s-interstellar`
`s-interstellar` →(strand/S)→ `s-myl`

**`great-circle`** — surface path connecting two nodes across sectors
`b-galileo` →(great-circle)→ `b-sagan`
`b-sagan` →(great-circle)→ `k-xprimery`
`k-xprimery` →(great-circle)→ `s-myl`
`star-euclid` →(great-circle)→ `star-newton`
`star-newton` →(great-circle)→ `k-faraday`
`k-einstein` →(great-circle)→ `k-penrose`
`b-darwin` →(great-circle)→ `b-sagan`
`b-sagan` →(great-circle)→ `s-2001`

**`te-crossing`** — helix boundary edge (only appears during a Journey)
`k-einstein` →(te-crossing/te-03)→ `s-2001`
`s-interstellar` →(te-crossing/te-03-return)→ `k-xprimery` (unreached in Journey 3)
`b-darwin` →(te-crossing/te-02)→ `s-wells`
`s-wells` →(te-crossing/te-02-return)→ `b-darwin` (partial — the S→K return was diffuse)

---

*Broch Sphere Prototype Spec v0.1 — MisterY Labs · June 2026*
*22 nodes. 3 journeys. 2 observer positions. 3 transfer events.*
*Goal: test whether navigation is compelling.*
