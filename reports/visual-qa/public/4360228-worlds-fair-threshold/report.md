# World's Fair threshold — homepage

UI commit: `4360228`
Branch: `homepage/worlds-fair-threshold`
Viewports: 390×844 and 1440×900, dark.

## Before

Captured from the deployed `main` homepage at `https://aethertopologist.github.io/misterylabs/` (commit `a7d7631`), not from a rebuilt copy of that commit.

The previous front door was a transport-sphere hero (“Change one thing. Look again.”), then a long catalog: Cavendish, Apple, Saturn, dome, an eight-panel off-axis grid, the xPRIMEray lineage, fractal academia, and a join-the-observatory close. The Cenotaph was not present. “Open the Atlas” went to the instrument index, not the walkable world.

## After

Production build of this branch, served with basename `/misterylabs/`.

The homepage is a threshold. Newton’s Cenotaph is a drawn elevation (no WebGL). The primary action is Enter the Atlas, linking to `/atlas/interactive`. Secondary doors:

- 01 Hydrogen → `/observatory/hydrogen`
- 02 Apple of the Eye → `/observatory/polar-grin`
- 03 Triad → `/observatory/triad`
- 04 Dimensional Pavilion → `/observatory/higher-dimensional`

Quaternion rotation stays inside that collection and links to `/observatory/quaternion`. Poisson’s Dot is a satellite link. Bell and xPRIMEray are named as not yet open. They have no public route.

Checked on the production build: no horizontal overflow at either viewport, Enter the Atlas visible without scrolling, no page errors on the homepage. Route clicks reached the interactive atlas and each flagship above.

## Not changed

Hydrogen, Apple of the Eye, Triad, cube / tesseract / hollow mask / spinning dancer, quaternion, the Cenotaph GLB, Atlas camera, fly/walk, minimap, and instrument navigation.

## Limitations

- The Cenotaph on the homepage is an elevation, not the atlas model.
- “Dimensional Pavilion” is a homepage name. `COLLECTIONS` in the atlas is still empty, so the world does not yet contain a pavilion to descend into.
- The old homepage essays (transport diagnostics, xPRIMEray lineage, fractal academia, join) are no longer on `/`. Header routes still reach Atlas, Observatory, Media, Archive, and Broch Sphere.
- Newsreader is now requested with the global font stylesheet. The face was already the display token and already loaded by Hydrogen.
