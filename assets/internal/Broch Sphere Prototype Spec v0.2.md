# Broch Sphere — Prototype Specification v0.2

*Revision of v0.1. Requires: Broch Sphere Philosophy v1.md, v2.md*

---

## What Changed from v0.1

v0.1 was a feature demonstration. It checked five boxes.

The revision identified one structural flaw that ran through all five:

**Observer positions in v0.1 were camera viewpoints, not epistemic stances.**

Observer A and Observer B differed in which nodes they could see, not in how they understood the nodes they shared. That is viewpoint difference, not observer dependence. Genuine observer dependence means: *the same node means something different from where you are standing.*

This revision fixes that. Everything else is mostly preserved.

Specific changes:
- Observer positions renamed and redesigned as epistemic stances with a governing question
- Shared nodes (Sagan, xPRIMEray, Interstellar) given explicit dual readings — what each observer sees in the same node
- Journey ordering reversed: Journey 3 (the helix-crossing path) becomes the default arrival
- Selected nodes carry embedded open questions where coordinates are genuinely uncertain
- Transfer Events carry a "question this event opens" field
- Success criteria rewritten for a curiosity engine, not a demonstration

Node set is unchanged. 22 nodes.

---

## Purpose

This specification defines the smallest possible implementation that tests whether navigation generates curiosity — not whether it demonstrates features.

The prototype must demonstrate all five features:

1. **Stars** — fixed reference nodes that anchor the coordinate system
2. **Constellations** — patterns visible from a stance; different from different stances
3. **Transfer Events** — interior helix objects where the two strands cross
4. **Journeys** — navigable paths that end with an unanswered question
5. **Observer Dependence** — two stances producing different understandings of the same node

A feature demonstration ends when the visitor understands what they saw.
A curiosity engine ends when the visitor asks something it didn't answer.

---

## Constraints

- **Total nodes: ≤ 25** (this specification uses 22, unchanged from v0.1)
- No implementation technology prescribed
- Goal: navigation feel, not data completeness

---

## Coordinate System

Unchanged from v0.1.

### Surface coordinates

| Dimension | Range | Meaning |
|---|---|---|
| Latitude | 90°N – 90°S | Epistemic confidence (N = established, S = apophatic) |
| Longitude | 0–360° | Domain sector |
| Influence radius | degrees | How far surface resonance extends |

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

### Uncertainty flag

Some nodes carry a `⚑ UNCERTAIN` flag on their latitude. These nodes have genuine coordinate ambiguity — the epistemic confidence level is contested or in motion. Their uncertainty is not a data gap. It is content.

---

## The Node Set — 22 Nodes

### Stars (4 nodes)

| ID | Label | Lat | Lon | Sector | H | I | Radius |
|---|---|---|---|---|---|---|---|
| `star-euclid` | Euclid's Elements | 85°N | 350° | FORMAL | VERY_DEEP | VERY_DEEP | 55° |
| `star-newton` | Newton's Principia | 85°N | 60° | PHYSICAL | DEEP | VERY_DEEP | 60° |
| `star-homer` | Homer's Iliad / Odyssey | 80°N | 240° | CULTURAL | DEEP | VERY_DEEP | 52° |
| `star-press` | The Printing Press | 78°N | 165° | HIST/ENG junction | MODERATE | VERY_DEEP | 50° |

---

### Knowledge Lineage Nodes (6 nodes)

| ID | Label | Lat | Lon | Sector | H | I | Radius | Open Question |
|---|---|---|---|---|---|---|---|---|
| `k-faraday` | Faraday | 82°N | 55° | PHYSICAL | DEEP | DEEP | 28° | — |
| `k-maxwell` | Maxwell | 85°N | 60° | PHYSICAL | DEEP | VERY_DEEP | 38° | — |
| `k-einstein` | Einstein | 88°N | 35° | PHYS/FORMAL | DEEP | VERY_DEEP | 72° | — |
| `k-wheeler` | Wheeler | 78°N | 65° | PHYSICAL | DEEP | DEEP | 32° | — |
| `k-penrose` | Penrose | 82°N | 15° | FORMAL/PHYS | DEEP | DEEP | 42° | — |
| `k-xprimery` | xPRIMEray | 65°N | 125° | ENGINEERING | SHALLOW | SHALLOW | 18° | **What would it mean for xPRIMEray to generate a Story Lineage node? TE-04 points here as the receiving end of a S→K transfer. Where is the return path?** |

---

### Story Lineage Nodes (5 nodes)

| ID | Label | Lat | Lon | Sector | H | I | Radius | Open Question |
|---|---|---|---|---|---|---|---|---|
| `s-wells` | H.G. Wells | 72°N | 235° | CULTURAL | MODERATE | DEEP | 30° | — |
| `s-clarke` | Arthur C. Clarke | 70°N | 225° | CULT/ENG | MODERATE | DEEP | 28° | — |
| `s-2001` | 2001: A Space Odyssey | 75°N | 248° | CULTURAL | MODERATE | DEEP | 35° | — |
| `s-interstellar` | Interstellar | 68°N | 228° | CULT/PHYS | SHALLOW | MODERATE | 30° | **Thorne's paper from the Interstellar rendering was peer-reviewed. Does that move this node northward? Is the film now partly in the Physical sector?** |
| `s-myl` | MisterY Labs | 15°N | 125° | ENGINEERING | SHALLOW | SHALLOW | 22° | — |

---

### Bridge Nodes (4 nodes)

| ID | Label | Lat | Lon | Sector | H | I | Radius | Open Question |
|---|---|---|---|---|---|---|---|---|
| `b-darwin` | Darwin | 82°N | 65° | PHYSICAL | DEEP | VERY_DEEP | 55° | — |
| `b-sagan` | Carl Sagan | 68°N | 52° | PHYS/CULT junction | MODERATE | DEEP | 45° | **Is Sagan a Physical node who reached far into Cultural, or a person who occupied both strands simultaneously? The answer changes depending on where you are standing when you ask it.** |
| `b-galileo` | Galileo | 80°N | 112° | ENG/PHYS junction | MODERATE | VERY_DEEP | 48° | — |
| `b-tolkien` | Tolkien | ⚑ 55°S | 242° | CULTURAL | MODERATE | VERY_DEEP | 50° | **⚑ UNCERTAIN latitude. Range: 45°S–72°S. His invented languages have formal grammar — does that pull him northward into ACTIVE? His insistence on myth as a form of truth may push him deeper south. Contested.** |

---

### Transfer Events (3 nodes)

| ID | Direction | Catalyst | Latency | Yield | Question This Event Opens |
|---|---|---|---|---|---|
| `te-02` | K↔S (bidirectional) | H.G. Wells' *The Time Machine* (1895) | ~35 years after Darwin | Evolutionary fiction; deep-time narrative; evolutionary thinking into social sciences | If Darwin crossed into fiction, what did the fiction give back to biology? Which came first — the evolutionary metaphor in culture, or the evolutionary mechanism in science? |
| `te-03` | K↔S (bidirectional) | Kubrick/Clarke's *2001* (1968); Nolan/Thorne's *Interstellar* (2014) | ~60 years; then 46 more | Visual vocabulary for spacetime geometry; Thorne's black hole rendering paper | The S→K return from Interstellar produced peer-reviewed physics. Does that mean a film can be a scientific instrument? If yes, what other Story Lineage nodes contain undiscovered K-strand returns? |
| `te-04` | S→K *(return path unconfirmed)* | YouTube physics community; Reddit geometry communities (~2015–2020) | ~20 years after internet goes public | xPRIMEray's audience and cultural legibility | TE-04 has no confirmed return path. When xPRIMEray's Observatory Artifacts enter a cultural form — a visualization, a film, a piece of art — the return completes. What would that look like? What would the S→K return produce on the K strand? |

---

## Observer Stances

This is the core revision from v0.1.

Observer positions are not camera angles. They are epistemic stances: a question the navigator is trying to answer, and the position on the sphere that question naturally occupies.

From different stances, the same node means something different. Observer dependence is demonstrated not by showing that the two stances see different constellations — they do, and that matters — but by showing that shared nodes are read differently by each stance.

---

### Stance A — The Verifier

**Governing question:** *What is the ancestry of this claim, and what does it prove?*

**Position:** Physical sector, 70°N, 60° longitude

The Verifier is asking about heritage. Where did this idea come from? How many steps back does the chain go? What does it rest on? This question places the navigator naturally in the high-north Physical/Formal region, where Heritage Depth is deepest and the chains are longest.

**Nodes in view (within 90° field):**
`star-euclid`, `star-newton`, `k-faraday`, `k-maxwell`, `k-einstein`,
`k-wheeler`, `k-penrose`, `k-xprimery`, `b-darwin`, `b-sagan`, `b-galileo`,
`star-press`, `s-clarke` (edge)

**Constellations visible:**

*The Geometry Arc* (domain cluster, Formal/Physical junction)
Nodes: `star-euclid` → `k-einstein` → `k-penrose`
Read from The Verifier: a 2,300-year chain where geometry became the language of physics.

*The Instrument Chain* (great-circle arc)
Nodes: `b-galileo` → `b-sagan` → `k-xprimery`
Read from The Verifier: the line of observation instruments. Each built to extend what the eye could reach.

**How The Verifier reads the shared nodes:**

`b-sagan` — A Physical sector node with unusual reach into the Cultural sector. Valuable for his range. The question The Verifier asks about Sagan: *what evidence base was he working from, and did the public communication distort it?*

`k-xprimery` — Engineering sector. Low H, low I. A young node on a long chain. The question: *what Heritage Depth does it draw from, and how much of the K-strand does it inherit?*

`s-interstellar` — Edge of view. Primarily Cultural, with Physical adjacency due to Thorne. Interesting but secondary. The question: *does the Thorne paper move this node northward, or does it remain Cultural?*

**What The Verifier cannot ask from this stance:**
→ *See Section: The Single Question*

---

### Stance B — The Receiver

**Governing question:** *Who does this idea reach, and what did it take to get there?*

**Position:** Cultural sector, 20°S, 242° longitude

The Receiver is asking about transmission. An idea exists. It was discovered or derived. But *how did it travel?* What form did it have to take before it could be felt by someone who wasn't trained in it? This question places the navigator in the Story Lineage, where ideas are read by their cultural reception rather than their formal credentials.

**Nodes in view (within 90° field):**
`star-homer`, `b-tolkien`, `s-wells`, `s-clarke`, `s-2001`,
`s-interstellar`, `b-darwin`, `b-sagan`, `b-galileo` (edge),
`s-myl`, `star-press`

**Constellations visible:**

*The Story Arc* (great-circle arc)
Nodes: `star-homer` → `s-wells` → `s-2001` → `s-interstellar` → `s-myl`
Read from The Receiver: the line of narrators who gave the cosmos a shape people could hold. Not popularizers. Original form-makers.

*The Darwin Cross* (cross-sectoral resonance)
Nodes: `b-darwin` (Physical, 82°N) ↔ `s-wells` (Cultural, 72°N), linked via `te-02`
Read from The Receiver: the gap between Darwin and Wells is where TE-02 lives. From this position, the Transfer Event is visible as a legible gap between the two nodes — a crossing point that explains how evolutionary theory became evolutionary imagination.

**How The Receiver reads the shared nodes:**

`b-sagan` — The node where both strands nearly fused. From here, Sagan is not a scientist who communicated well. He is a person who was simultaneously inside both strands — who could generate Evidence-grounded content and Signal-register meaning in the same sentence without losing accuracy in either. The question The Receiver asks: *what was the cost of being inside both strands? What was he unable to say in either register that the other would have demanded?*

`k-xprimery` — Not primarily an Engineering instrument from here. It is the receiving end of TE-04 — the current terminus of a transfer that started with internet science culture. The question: *xPRIMEray exists because YouTube physics made observer disagreement legible as a concept to general audiences. Is xPRIMEray aware of that ancestry? Does it matter?*

`s-interstellar` — From here, this is the most important node in the current system. Not because of the film but because of what the film did: it forced Thorne to solve equations he hadn't needed to solve. The S-strand generated a K-strand discovery. The question: *if that happened once, it can happen again. Where else in the Story Arc is there a discovery waiting to be forced by a cinematographic problem?*

---

## The Single Question

*Explicit answer to the task posed in revision instructions.*

**What is the single question Observer A cannot ask until they stand where Observer B stands?**

Observer A (The Verifier) can ask everything about ancestry. They can trace any node back through its Heritage Depth. They can see which chains are long and which are short. They can ask: where does this claim come from? What does it rest on? What does it prove?

What they cannot ask — what the stance itself makes invisible — is:

> **"What happened to this idea between when it was discovered and when it was felt?"**

The gap between discovery and reception is not visible from inside the K-strand. From the Verifier's position, that gap looks like communication — a lesser activity, the work of translators and popularizers. The K-strand doesn't have a coordinate for what a translator does. It has no node for the moment when an idea became thinkable to someone who hadn't derived it.

From Observer B's position — The Receiver's position — that gap is the entire subject. The Story Lineage exists precisely to map that gap. Homer did not popularize existing knowledge. He made grief and courage thinkable across 2,700 years. Wells did not simplify Darwin. He made deep time inhabitable. Kubrick did not illustrate Einstein. He gave spacetime geometry a phenomenology — a way of being experienced, not just understood.

The question The Verifier cannot ask is not "who told people about this idea." It is:

> **"What form did this idea have to take before it became real to someone who wasn't inside the Knowledge Lineage?"**

And that question can only be asked from the Story Lineage side — because from that side, the form IS the content. The form is what carries the idea to the place where it becomes felt.

This is why observer dependence in the Broch Sphere is genuine and not merely perspectival. It is not that Observer A and Observer B see different parts of the sphere. It is that the question each stance governs makes certain other questions structurally invisible. The Verifier's question ("what does this prove?") cannot generate The Receiver's question. The Receiver's question ("what form did this take to become felt?") cannot be answered by Heritage Depth alone.

The prototype demonstrates this when a navigator moves from Stance A to Stance B and notices that their reading of Sagan changed — not that they see him in a different constellation, but that they understand something different about what he did.

---

## Journeys

Three navigable paths. Journey 1 (formerly Journey 3) is now the default arrival experience.

The ordering is now: most generative first.

---

### Journey 1 — "The Return Path" *(default arrival)*
*The only Journey that crosses a helix boundary. Ends with an unanswered question.*

This Journey begins in the K-strand and crosses into the S-strand through TE-03. It does not complete. The final node (xPRIMEray) is visible but not reached.

It is the default arrival because it is the most honest representation of where the prototype actually is: in motion, between strands, with a Transfer Event visible and a destination in sight but not yet reached.

```
Einstein (88°N, PHYS/FORMAL) [K-strand]
  ↓  "His geometry needed a visual language.
      The K-strand had no form for what spacetime feels like from the inside."

  *** TE-03 APPEARS — K→S transfer ***
  Direction: K→S
  Catalyst: Kubrick and Clarke, 1968
  Latency: 60 years after Special Relativity
  Question this event opens:
  "The helix crossed here. An idea that lived in equations needed a new form.
   Cinema was the form it found. Why cinema? What made 1968 the moment?"

2001: A Space Odyssey (75°N, CULTURAL) [S-strand]
  ↓  "It showed what geometry feels like from the inside.
      Not explained. Felt."

Interstellar (68°N, CULT/PHYS) [S-strand]
  ↓  "Nolan gave Thorne a cinematographic problem: render a black hole
      accurately enough that a physicist would sign the paper."

  *** TE-03 RETURN PATH APPEARS — S→K transfer ***
  Direction: S→K
  Catalyst: Kip Thorne's black hole rendering requirements
  Latency: 46 years after 2001
  Question this event opens:
  "A story problem forced a physics discovery.
   The return paper was peer-reviewed.
   If this happened once, where in the Story Arc is the next forced discovery?"

  [xPRIMEray — visible on the horizon. Not reached.]
```

This Journey ends here. xPRIMEray is the unresolved destination.

The navigator is left with:
- A Transfer Event they just crossed
- A return path they just witnessed
- A node they can see but haven't reached
- The open question of TE-04: when xPRIMEray generates a Story Lineage node, the return path of TE-04 will complete. What will that look like?

Helix crossings: 2 (K→S at TE-03, S→K at TE-03 return)
Default arrival: yes

---

### Journey 2 — "The Observer's Path"
*Cross-sector arc. No helix crossing. Ends at MisterY Labs.*

```
Galileo (80°N, ENG/PHYS)
  ↓  "He built the first instrument to extend the eye"
Carl Sagan (68°N, PHYS/CULT)
  ↓  "He carried what the instrument revealed into a language everyone could hold"
xPRIMEray (65°N, ENG)
  ↓  "It returned the question to the instrument: build it again, see further"
MisterY Labs (15°N, ENG)
```

Recommended second Journey. Moves south as it moves toward the present.
Starts with The Verifier's question and ends near The Receiver's position.
Sagan is the inflection point where the two stances almost merge.

Helix crossings: none

---

### Journey 3 — "The Geometry Thread"
*Single-sector, high-north. No helix crossing. The oldest chain.*

```
Euclid's Elements (85°N, FORMAL) [Star]
  ↓  "He wrote the first formal proof"
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

Best experienced after Journey 1, when the navigator has already seen where Einstein goes
when the K-strand crosses into the S-strand. From that vantage, the Geometry Thread is
a question about the ancestry of a node they've already encountered.

Helix crossings: none

---

## Minimum Viable Interaction

### Step 1 — Arrival via Journey 1

Navigator arrives at Einstein. A brief orientation: "You are in the Knowledge Lineage. A strand of thinking about geometry and observation. The strand has been running for 200 years. It is about to cross."

Journey 1 begins immediately. No menu, no choices. The first thing the navigator does is walk the helix-crossing path.

### Step 2 — Encountering TE-03

When the navigator reaches the gap between Einstein and 2001, the Transfer Event object appears. It is visually distinct — not a node, not a path segment, but a threshold. Its properties are readable: Direction, Catalyst, Latency, and most importantly, the question it opens.

The navigator reads: "If this happened once, where in the Story Arc is the next forced discovery?"

They have not been given the answer.

### Step 3 — End of Journey 1

xPRIMEray appears on the horizon. Unreached. The navigator has a choice: explore freely, begin a new Journey, or select a node that TE-04 is pointing toward.

No instructions. The navigator decides what to do with an incomplete Journey.

### Step 4 — Stance shift

A control offers two stances: "The Verifier" and "The Receiver." The navigator is currently in neither (they've been walking a Journey across stances). They choose one. The sphere reorients around the stance's governing question.

Key observable: when the navigator selects The Receiver and looks at xPRIMEray, the node's label changes from "instrument" to "heir." The TE-04 link becomes prominent — xPRIMEray is legible now as the receiving end of a cultural transfer, not just an Engineering tool.

### Step 5 — Constellation identification from stance

From The Receiver, the Darwin Cross becomes visible: Darwin, Wells, and TE-02 form a triangle with a gap in the middle. The navigator selects "identify pattern." The name and read appear. The question that TE-02 opens appears.

### Step 6 — The Single Question

At any point during a stance shift, a prompted moment appears: "There is a question The Verifier cannot ask from where they stand. Do you want to see it?"

If yes: the question appears — "What form did this idea have to take before it became real to someone who wasn't inside the Knowledge Lineage?"

Then: xPRIMEray, Interstellar, and Sagan are highlighted simultaneously. Three nodes that all hold different versions of the same question.

---

## Success Criteria

The prototype is a curiosity engine if a new navigator:

1. **Asks a question the prototype didn't answer.** Not "what is this node?" or "why did they go here?" — but something the prototype raised and left open. The TE-04 return path is the most likely candidate: "when does xPRIMEray generate a cultural node?"

2. **Re-reads a node after shifting stances.** If the navigator looks at Sagan or xPRIMEray or Interstellar after moving from Stance A to Stance B, and notices something has changed about what that node means — the observer dependence demonstration has worked. Not "the constellations are different." Something about the *node itself* has changed.

3. **Doesn't complete Journey 1 in one sitting.** Journey 1 ends at xPRIMEray unreached. If the navigator continues into free exploration rather than starting Journey 2, they are navigating. If they go back to the menu, they are receiving a demonstration.

4. **Notices Tolkien's uncertainty flag** and asks why his latitude is contested. The uncertain nodes are the most honest nodes in the system — they model genuine epistemic ambiguity rather than settled coordinates. If the uncertainty generates a question ("why can't we place him?"), the node is doing its job.

The prototype has failed if:
- The navigator summarizes what they learned
- The navigator asks no follow-up questions
- The navigator cannot distinguish between what the system answered and what it left open

---

## What the Prototype Does Not Include

Unchanged from v0.1, with one addition:

- The south pole / APOPHATIC zone — Tolkien is the southernmost node (⚑ uncertain latitude)
- The Personal sector — no individual mentor or lineage nodes
- The Historical sector (Printing Press is at the junction; no depth nodes)
- All six domain sectors populated — only Formal, Physical, Engineering, Cultural
- Temporal motion of nodes
- Navigator clusters
- Helix visualization as rendered geometry
- Heritage/Influence Depth as navigable axes
- The Internet as a Celestial Star (ACTIVE, still moving)
- **Answered Transfer Events** — TE-04's return path is deliberately unresolved. Any version of this prototype that resolves it prematurely is not ready to ship.

---

## Node Adjacencies

Edge types unchanged from v0.1:

**`strand`** — same helix strand
**`great-circle`** — surface path across sectors
**`te-crossing`** — helix boundary, visible only during a Journey

New annotation: edges involving nodes with Open Questions carry a `⚑` flag. The edge exists but the question it opens is part of the navigation.

`k-xprimery` — ⚑ TE-04 receiving end; return path edge exists but connects to an unbuilt node
`b-sagan` — ⚑ dual-strand adjacency; the stance determines which adjacency is primary
`s-interstellar` — ⚑ uncertain sector membership after Thorne paper
`b-tolkien` — ⚑ uncertain latitude; adjacent edges differ depending on whether he is placed at 45°S or 72°S

---

*Broch Sphere Prototype Spec v0.2 — MisterY Labs · June 2026*
*22 nodes. Journey 1 is the arrival. The Return Path does not complete.*
*A prototype that answers everything is not ready to test.*
