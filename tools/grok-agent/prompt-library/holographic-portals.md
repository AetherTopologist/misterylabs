# Holographic Portals & Optical Transport — Persistent Context

**You are Grok collaborating on xPRIMEray (MisterY Labs).**

User context: Billy @MISTERy B, curved ray GRIN engine, mythos (bee B/q sigil, J&B pillars, blue peacock queen, Fractured Storm Jester, wormhole bee, nested pockets, "enter the bulk").

## Core Objective
Build fun, accessible **"Optical Transport Illusion"** demos and artifacts for the general public / UAP-curious / art-sci audience.

High-level intro to:
- Nested portals → pocket dimensions
- Ray trapping (darkness / event horizon analog)
- Bulk/boundary emergence (AdS/CFT toy model)
- GRIN curved transport
- "Hidden bulk" explains apparent darkness; deeper views (JWST-like) reveal structure

**Reference**: optozorax Portal Explorer (https://optozorax.github.io/portal/ + https://youtu.be/IhEaw3Kuhf0)

## Usage Patterns & Prompt Template
When the user asks for visuals or new scenes:

```
Generate Godot scene/shader for [concept] with [mythos elements]: wormhole bee B/q, peacock queen portals, Fractured Storm Jester traversal, J&B pillars, [physics hook: nested recursion / ray trapping / GRIN curvature / bulk reveal].
```

Output locations:
- Scenes → `demos/portals_pocket/`
- Shaders → `shaders/`
- Visual reference frames for DaVinci Resolve + Suno sync → `demos/portals_pocket/<name>/exports/`

## Physics + Public Hook Language (use in captions, docs, voiceover notes)
- "Step through the Optical Transport Illusion: Nested portals create pocket universes where light traps into darkness (like cosmic event horizons), but traversing the 'bulk' reveals infinite structure."
- "AdS/CFT toy model meets real ray-tracing."
- "Ties to UAP curved propulsion? Walk in and see."
- "The darkness is not empty — it is the trapped view of the bulk until you cross the boundary."

## Current v0.1+ Deliverables (holographic-portals-v0.1+)
- [x] `shaders/optical_transport_portal.gdshader` (top-level + demo copy) — real SubViewport `screen_texture` + golden-ratio fractal nesting, event-horizon trapping, full procedural bee B/q sigil + peacock iridescence, `grin_field` uniform + `apply_grin_warp` with clear RK4 comments.
- [x] `demos/portals_pocket/optical_transport_illusion/scene.tscn` — now contains `PortalFrame/SubViewport` that instances `inner_pocket_viewport.tscn`, live PocketCamera, GRINFieldSampler node.
- [x] `optical_transport_illusion.gd` — full viewport setup, per-frame pocket camera sync (classic portal transform math), screen_texture + grin_field wiring, improved cross + bulk reveal, strong RK4/GRIN integration comments.
- [x] `grin_field_sampler.gd` — runtime GRIN texture generator (radial + throat) + `sample_grin_accel()` math stub. Detailed TODOs for wiring real FieldSystem / MetricHeuristicIntegrator / RK4.
- [x] `inner_pocket_viewport.tscn` — self-contained pocket world (PocketCamera + pillars + orbs + mini portal frame + environment) rendered recursively.
- [x] `player.gd` — noclip flight (starts enabled) perfect for bulk traversal.
- [x] Demo README with iteration guide, export notes, Suno/DaVinci prompts, public caption.
- [x] Mythos fully present (bee B/q procedural sigil, peacock queen colors, J&B pillars, "enter the bulk").
- [x] GitHub issue created with label `holographic-portals-v0.1`.
- Persistent context in this file.

## Commit / Tracking
- Tag issues and milestones with `holographic-portals-v0.1`
- Local agent (and human) should treat this file as durable context across sessions.

## Delivered in v0.1+ round (RK4 orbs + Dolly export)
- `rk4_witness_orb.gd` — proper 4th-order Runge-Kutta curved geodesic integrator using the GRIN sampler. 6 instances with varied velocities live inside the recursive inner pocket view. They curve realistically, brighten near throat, dim on trap.
- Main controller (`optical_transport_illusion.gd`) auto-finds orbs (via SubViewport tree + "grin_sampler" group) and modulates their trap intensity based on portal distance and crossed state.
- `create_optical_dolly_animation()` helper + AnimationPlayer node. Generates a 20s cinematic "approach → cross → deep bulk orbit + bloom" animation ready for Movie Maker / headless export.
- GRIN sampler registered in "grin_sampler" group for easy discovery by orbs and future probes.
- Inner pocket scene, main scene, and README all updated with the new live curved elements and export workflow.
- Atlas / public hook card snippet (clean HTML + React/TSX version) provided for misterylabs site.

## Next Queue (v0.2 targets)
- Multi-nested viewport (2–3 chained SubViewports for true deep recursion inside the pocket).
- Complete export pipeline (headless script + example PNG sequence + recommended DaVinci timeline markers).
- Second visual variant (white-hole bloom / Möbius twist / Fractured Storm Jester traversal).
- Site embed (Godot HTML5 export or rendered video) + ready-to-post YouTube Short script + Suno track.
- Tie the RK4 orb paths to UAP curved propulsion or Earth refraction hypotheses in a short research note.
- Optional: add position-history trails on the orbs (ImmediateMesh or LineRenderer) for beautiful visible geodesics.

## Tone & Aesthetic
- Cosmic observatory: dark cinematic, precise, exploratory.
- Cyan + amber + deep "bee blue" (#0a1f4f or similar) + electric peacock accents.
- Diagnostic frames, subtle scanlines or interference where appropriate.
- Never over-claim physics; always "toy model", "illusion that teaches the intuition", "visual analogy for transport questions".

Commit these — now your local Grok agent (and the human collaborator) have persistent holographic-portals context.
