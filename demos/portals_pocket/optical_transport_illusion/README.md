# Optical Transport Illusion — Holographic Portals v0.1

**Public-facing, walkable Godot 4 demo** for xPRIMEray / MisterY Labs curved optical transport research.

Reference: [optozorax Portal Explorer](https://optozorax.github.io/portal/) + [video](https://youtu.be/IhEaw3Kuhf0)

## What It Shows (Intuition First)
- **Nested portals** create pocket universes.
- Light rays that stay "inside" the shrinking central region across recursion levels become **trapped** → pure darkness (event-horizon / bulk analog).
- Crossing the boundary **reveals emergent structure** (the "bulk" blooms into view). Classic AdS/CFT toy-model feeling without claiming GR.
- **GRIN curvature** is faked with sinusoidal warp in the shader (easy to replace with real RK4 geodesic samples from your transport modules).
- Mythos dressing: bee B/q sigil (procedural in shader), peacock queen iridescent accents, J&B pillars as structural witnesses, "Fractured Storm Jester" traversal via free noclip flight.

The darkness is not empty. It is the view of the bulk until the observer crosses.

## Quick Start
1. Open the folder `demos/portals_pocket/optical_transport_illusion/` directly in Godot 4 (or run `godot .` from inside it).
2. The included `project.godot` + local `shaders/` copy makes it self-contained.
3. Press Play. Mouse look + WASD. Space = ascend, Ctrl = descend, Shift = sprint.
4. **N** toggles noclip (starts enabled — perfect for flying straight into the portal frame and "entering the bulk").
5. Walk or fly through the glowing rectangular portal. The inner pocket geometry activates + pulses.

Alternative (if you prefer the repo root as Godot project root):
- Copy or symlink the top-level `shaders/` folder so `res://shaders/optical_transport_portal.gdshader` resolves.
- Open `scene.tscn`.

## Files
- `scene.tscn` — Main scene (high-level structure as described in the original prompt).
- `player.gd` — Walkable/flyable CharacterBody3D controller with noclip.
- `optical_transport_illusion.gd` — Root script. Applies the shader material at runtime + simple bulk-reveal on portal cross.
- `portal_trigger.gd` — Area3D helper (logic centralized in root for v0.1).
- `shaders/optical_transport_portal.gdshader` — The star. Real SubViewport recursion (via screen_texture) + fractal golden nesting + event-horizon trapping + procedural bee B/q sigil + peacock iridescence + GRIN field hook.
- `grin_field_sampler.gd` — Runtime GRIN-like field texture generator + math sampling stub. Clear comments on how to wire your real RK4 / FieldSystem / MetricHeuristicIntegrator.
- `rk4_witness_orb.gd` — Proper 4th-order Runge-Kutta curved geodesic integrator. 6 instances live inside the inner pocket (varied initial velocities). They follow the GRIN field, brighten near the throat, and dim when trapped.
- `inner_pocket_viewport.tscn` — Self-contained pocket world (PocketCamera + geometry + lights + **live RK4 witness orbs**). Rendered by the SubViewport.
- `project.godot` — Minimal Godot 4 project so the demo folder is independently openable.
- `reference/wormhole_structure_contact_sheet.png` — Pulled from the main xPRIMEray asset library for visual reference / future texture use.
- `inner_pocket_viewport.tscn` is instanced inside the SubViewport in the main scene (edit it to add more orbs or another recursion level).

## Shader Highlights (optical_transport_portal.gdshader)
- `recursion_depth`, `pocket_scale`, `trap_radius_base` — control how deep the nesting goes and how aggressively rays get trapped into darkness.
- `grin_index` — strength of the sinusoidal curvature (direct hook to your GRIN field math).
- Procedural `bee_sigil()` distance-field overlay (hex + center "q" + wing flutter).
- Peacock queen color mixing on outer layers.
- `screen_texture` uniform ready for when you wire a real SubViewport / viewport texture for true recursive rendering.
- `unshaded + blend_mix` for ethereal portal feel. Easy to switch to lit modes later.

## How to Iterate (Godot Editor Tips)
- The SubViewport lives under `PortalFrame/SubViewport`. Its child `InnerPocketViewportRoot` (instanced from `inner_pocket_viewport.tscn`) contains the `PocketCamera` that the root script drives every frame.
- Select `PortalFrame` → inspect the material the root script creates, or temporarily disable `optical_transport_illusion.gd` and assign the shader manually for live editing.
- Edit `inner_pocket_viewport.tscn` independently to add more geometry, another mini-portal, or different lighting inside the recursive view.
- The `grin_field` sampler is a child of the root. Open `grin_field_sampler.gd` — the TODO section shows exactly where to connect your real curved-ray / RK4 / FieldSystem code.
- In the shader, the `grin_field` uniform receives the texture; the `apply_grin_warp` function + texture sampling path are the two places to extend with live geodesic data.
- For even deeper recursion you can put another SubViewport + camera inside `inner_pocket_viewport.tscn` and chain the textures (performance cost rises quickly).
- The 6 RK4 orbs in the inner pocket demonstrate live curved transport. Their brightness reacts to "trapping" vs bulk depth. The main controller modulates their trap_intensity based on distance to the portal.
- **Camera Dolly + Export**: Call `create_optical_dolly_animation()` on the root (from the script editor or console). It generates a 20-second "approach → cross → deep bulk orbit" animation on the AnimationPlayer. Save the animation resource and use it to drive a camera (or the Player) for clean export sequences.

### Exporting for DaVinci + Suno (Quick Guide)
1. Enable Movie Maker in Editor Settings → Movie Writer (choose PNG sequence or Theora).
2. Play the scene with the dolly animation active (or use a Path3D + AnimationPlayer in the editor for more control).
3. Godot will write frames while the animation runs.
4. Headless export example:
   ```
   godot --headless --path demos/portals_pocket/optical_transport_illusion --script export_dolly.gd
   ```
5. 15–30s loops work great synced to the hyperpop "enter the bulk" Suno prompt from the earlier README section. Use the trapped-to-bloom color shift as a natural drop moment.

## Export & Sync Notes (DaVinci + Suno)
- Camera path suggestions: slow approach from "our" side → acceleration through the frame → spiraling "deeper" once bulk is revealed.
- Color grade: crush blacks on the trapped side, then bloom + teal/orange split when peacock accents and pocket orbs ignite.
- Suggested Suno prompt (hyperpop / K-pop energy with "enter the bulk" drops):
  ```
  Cinematic hyperpop, shimmering risers into massive drop, "step into the blue", bee-buzz synths, peacock feather arpeggios, event-horizon bass that swallows then explodes into infinite structure, female vocal chops in bee B/q blue, 150-162 bpm, bright yet dark, MisteryLabs xPRIMEray aesthetic
  ```
- DaVinci timeline markers: "Approach", "Trap Horizon", "Cross", "Bulk Bloom", "Nested Recursion", "Fade to Witness Orbs".

## Public Caption (Atlas / YouTube / X)
"Step through the Optical Transport Illusion: Nested portals create pocket universes where light traps into darkness (like cosmic event horizons), but traversing the 'bulk' reveals infinite structure. AdS/CFT toy model meets real ray-tracing intuition. Ties to UAP curved propulsion? Walk in and see. 🐝🌌

#xPRIMEray #MisteryLabs #OpticalTransport"

## Next Moves (v0.1 → v0.2)
- [ ] Wire a SubViewport + secondary camera for true recursive portal rendering.
- [ ] Swap sin warp for live RK4/GRIN samples (pull from existing curved ray modules).
- [ ] Multiple nested portal frames with different recursion depths + peacock feather patterns.
- [ ] Bee B/q sigil as a real emissive or flow texture (use one of the xPRIMEray glyphs or generate SVG → import).
- [ ] Animated camera dolly + exported frame sequence ready for music video.
- [ ] GitHub milestone "holographic-portals-v0.1" + issue tracker tags.
- [ ] Embed optozorax iframe + this demo side-by-side on the MisteryLabs site / Atlas page.

## Ties to the Larger Body of Work
This is the **public intuition layer** on top of the serious xPRIMEray transport observatory (GRIN fields, Gordon metric, curved ray integration, observer disagreement, wormhole seam diagnostics). The same questions — what does it look like when transport is curved, when boundaries are crossed, when light is trapped vs. revealed — appear here in playful, shareable form and in the high-precision diagnostic renders.

See:
- `assets/Research/OPTICAL_TRANSPORT_FEATURE_MAP.md`
- `src/pages/Atlas.tsx` (GRIN optics and effective metric sections)
- Wormhole and GRIN output collections in `assets/xprimeray_outputs/`

## License / Attribution
MisterY Labs / xPRIMEray research artifact. Visual toy model for education and inspiration. Not a physics claim.

---

Built as part of the holographic-portals-v0.1 initiative. Persistent context lives in `tools/grok-agent/prompt-library/holographic-portals.md`.
