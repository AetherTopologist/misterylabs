# Higher-Dimensional Observatory — scientific limitations

These rides are instruments for looking. They do not measure a visitor's perception, and they do not establish a physical claim.

## Ride 01 — Hollow Genius

- The Einstein and Tesla assets are decimated, untextured reliefs (`einstein-vase-face`, `tesla_vase_face`). They are not scans of a physical hollow mask, and they have no material or UV map. Shading is a synthetic skin response to a directional light.
- Both meshes bulge toward +Z (center farther along +Z than the periphery). Stored normals agree with the triangle winding. Vertices are not welded; that does not change the relief.
- Concave mode reflects vertex positions through the depth midplane and sets normals to `normalize(-nx, -ny, nz)` so the interior still faces a camera on +Z. Winding is left in agreement with those normals. An earlier index swap pointed the front face away from the camera, and front-face culling hid the shell. It is not a normal reversal on the unmoved convex mesh.
- The ground-truth label is that geometric depth sign. It is not an estimate of what the visitor sees.
- The appearance pane asks for a self-report. Reports stay in `localStorage` on this browser. Nothing is inferred from gaze, stereo acuity, or reaction time.
- "Binocular" is a red-cyan anaglyph from two parallel cameras on the appearance pane only. It takes over that pane's render loop and draws both eyes. Ground truth and monocular viewing use the automatic render. It is not the visitor's eyes, not a clinical stereopsis test, and not meaningful without red-cyan glasses. Orthographic projection removes perspective even when the anaglyph is on.
- Both panes are real WebGL canvases. A phone keeps two contexts while the comparison is on screen. If a context cannot be created or is lost, that pane says so instead of staying black; the depth sign is still computed from the file.
- A face-convexity prior is a known tendency in human vision, strongest for familiar upright faces, and it can be helped or hurt by shading, perspective, and motion parallax. This page illustrates those controls. It does not demonstrate that any particular visitor is subject to the prior.

## Ride 02 — Ambiguous Dancer

- The body is a stick figure with a fixed arabesque pose, not a captured performer.
- Physical yaw is `offset + direction * speed * ω * elapsed`, with `ω` equal to the legacy 0.014 rad/frame step at 60 fps. The same inputs give the same angle.
- A silhouette without perspective is consistent with two opposite 3D rotations. The model still has one physical direction. The report buttons record what the visitor thinks they see. They are not a second solver.
- Shading, perspective, a floor shadow, and the floor marker add depth information. They can break the ambiguity. They are cues, not a measurement.
- Dragging the figure adds an offset. That is still the physical angle.

## Ride 03 — Inside-Out Universe

- Tesseract vertices, edges, the XW → YZ → XY rotation order, and the 4D-to-3D perspective divide are the same functions as the original tesseract instrument. Extra planes (XZ, YW, ZW) are applied after that order and stay at zero unless the visitor moves them.
- Nested cubes in the drawing are a perspective effect. A far cell can appear inside a near cell. That is not a topological eversion, not a sphere turned inside out, and not evidence that space has inverted.
- The cube fold uses the existing 11 nets and the existing chirality spanning tree. Progress `0` is the flat net. Progress `1` hinges each tree edge by a right angle. Nine of the nets are trees and close into a cube of side 2. Nets “Row Adjacent 1-2” and “Row Adjacent 0-1” already contain six grid joins instead of five, so a right-angle hinge fold is not claimed to close. The laboratory says so. Highlighted edges on the flat net are the five spanning-tree hinges, not every shared side. This is a rigid paper fold, not a claim about higher-dimensional matter.
- The worm tube is a separate mode of the 4D laboratory. Its radius and centerline are a hand-authored function of arc length and time. It does not read the 4D angles or the fold, and it is not a continuation of the cube fold. The on-screen warning is the string `WORM_TUBE_WARNING`.
- The cube laboratory shares one net, one chirality, one fold progress, and one selected face between the flat net and the hinge fold. The step number is the existing spanning-tree order. The tesseract is a separate laboratory. Compare can show both; a phone scrolls them at a readable height instead of shrinking them into one row. There is no new 4D unfolding parameter and no eight-cell hypercross. Fold progress only hinges the selected cube net. The six plane controls are offsets on the existing tesseract integral.
- A laboratory that is not selected stays mounted and is not redrawn until it is shown again. The angle integral and the worm-tube clock keep running either way. Switching laboratories does not reset the cube state or the integral. The standalone net explorer and the standalone tesseract instrument remain on the collection route.

## What this page does not do

- It does not compute perception.
- It does not show that projection equals topology.
- It does not replace the original `/observatory/higher-dimensional` instruments. That route remains the collection index and still mounts the four original modules.
