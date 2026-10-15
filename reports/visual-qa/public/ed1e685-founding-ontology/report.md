# Founding ontology — homepage

UI commit: `ed1e685`
Branch: `homepage/founding-ontology`
Base: `main` at `dc9d767`
Viewports: 390×844 and 1440×900. Dark is the required pair. Light is included.

## Before

The approved V1 threshold on latest `main`: Cenotaph portrait, “There is always another why.”, “Change one thing. Look again.”, Enter the Atlas, five open instruments, the dimensional rides, Poisson’s Dot, and “Atmosphere is not evidence.”

## After

Same hero. The founding statement, a short invitation, and the four epistemic layers sit in the register, above the instruments. The closing question is under the horizon line. No second WebGL scene.

The instrument row uses five columns from 1200px so Photon Journey is not left alone under a four-column grid. Below that width it still wraps.

## Checks

Production build passed.
`npm test`: 113 passed. Two failures in `mask-geometry.test.ts` look for Einstein and Tesla GLBs under `/workspace/attachments/`, which are not in this checkout. Those tests do not touch the homepage.
Homepage: no horizontal overflow, Enter the Atlas on screen (bottom 702 of 844, 829 of 900), no canvas, no page errors.
Heading order remains h1 question, then h2 Open instruments.
Routes unchanged: hydrogen, polar-grin, triad, higher-dimensional, hollow-genius, ambiguous-dancer, inside-out, quaternion, photon-journey, poisson-dot, atlas/interactive.

## Not changed

Interactive Atlas, Cenotaph GLB, camera, fly/walk, minimap, and instrument mathematics.

## Reference

`Docs/public/FOUNDING_ONTOLOGY.md` (v1.0), subordinate to the Public Charter.
