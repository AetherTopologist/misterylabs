# Cenotaph fidelity — homepage

UI commit: `f154720`
Branch: `homepage/worlds-fair-threshold`
Viewports: 390×844 and 1440×900, dark and light.
Production basename: `/misterylabs/`.

Required names `desktop-1440.png` and `mobile-390.png` are the dark theme. Light is the `-light` pair.

## Before

The World's Fair threshold already on this branch (`562baaf`). Same copy, same instrument register, same layout. The monument was an invented SVG: a translucent sphere, orbital rings, a flat colonnade, an oculus, and a shaft. That drawing is not in the Atlas model.

## After

Production build of `f154720`. The SVG is gone. The homepage shows a still of `src/interactive-atlas/cenotaph.glb`, shaded with the same builder the Atlas uses (`buildCenotaph`, variant `m`, the night stone shader). Dark and light are the same geometry. Only exposure and the ground change. There is no second Three.js scene on the page. The two stills are `public/assets/cenotaph/portrait-dark.webp` (38 KB) and `portrait-light.webp` (42 KB).

Checked on the production preview:

- No horizontal overflow at 390×844 or 1440×900.
- Enter the Atlas stays inside the first viewport (bottom 702 of 844 on mobile, 829 of 900 on desktop).
- No homepage console or page errors.
- Enter the Atlas still points at `/atlas/interactive`.
- Hydrogen, Apple of the Eye, Triad, the Dimensional Pavilion, quaternion, and Poisson’s Dot still resolve. No Signal Lost page.

## How the still relates to the GLB

The file is a SketchUp glTF: 190 nodes, 175 meshes, 221 triangle primitives, no line primitives. Seven placeholder PBR materials. The Atlas throws those materials away at load and assigns the stone shader. The portrait does the same. Node name `Unir` covers 186 nodes, including the sphere and the repeated terrace pieces. A fit of that node is a sphere of radius about 52, centered near y = 61, after the loader recenters the model. The whole loaded bounds are about x/z ±122 and y −1 to 115: a wide plaza under the monument.

What is actually in the model, and therefore in the portrait:

- The monumental sphere.
- Stepped cylindrical drums and an equatorial terrace.
- A stair crossing that terrace.
- A parapet of small posts.
- An arched opening in the lower drum.
- A curved ramp or retaining wall in the lower drum.
- The broad plaza.

What is not in the model, and was removed from the homepage:

- A ring of free-standing columns.
- Orbital rings.
- An oculus and a light shaft.
- Floating interior geometry.

Variant `m` is charcoal (albedo near 0.13) with porcelain veins gated by `uDetail`. In the Atlas that value rises only as the camera comes inside about 340 units; at the home camera it is nearly off. The portrait uses `uDetail` 0.22, so the mineral read stays restrained. The horizontal seams on the sphere are separate mesh rings in the SketchUp export, not courses drawn for the homepage. Normals were smoothed only in the offline still so the rings read as one shell. The GLB file was not edited.

The night still uses the Atlas hemisphere, a cool fill, and a warm graze in the spirit of the ivory spot rig inside `buildCenotaph`. It is darker and flatter than a photograph of finished masonry, because the stone shader is rough (0.92) and the albedo is night charcoal. The light still is the same stone in daylight, not a second monument.

## Missing from the model — a separate Atlas pass

These are model gaps. They were not invented on the homepage.

- No Boullée colonnade. If the cenotaph is meant to carry a ring of columns, that geometry has to be built into the GLB.
- The sphere is many unwelded meshes. Seams stay visible up close.
- The curved ramp reads as an open cut through the lower drum. Worth confirming that is the intended opening and not an export gap.
- Placeholder GLB materials are unused. The look lives entirely in the runtime shader.
- Porcelain mineral detail is distance-gated, so a distant view will not show blue-white veins. That is the current Atlas behavior.

## Not changed

Homepage copy, the instrument register, routes, navigation, the Cenotaph GLB, Atlas camera, fly/walk, minimap, and instrument navigation.
