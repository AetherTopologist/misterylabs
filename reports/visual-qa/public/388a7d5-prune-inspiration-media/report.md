# Public UI verification — prune placeholder and broken inspiration media

Commit: `388a7d51f64ed9c18fcd39894abe6f5abca0a0ea`
Message: `fix(public): remove placeholder and broken media from inspiration exhibits`

## Scope

RA-1 only.

- `src/components/FractalInspirationAtlas.tsx`
- `src/data/resonance_spheres_data.ts`

Removed only the placeholder/broken media identified by the Public Reality Audit. Did not replace any media. Affected nodes render text-only. Existing `media.length > 0` guards already hide empty carousel/media shells; no extra UI guard was required.

## Media removed

### Fractal Inspiration Atlas

| Node | Removed |
|---|---|
| `interstellar` | Unsplash placeholder `images.unsplash.com/photo-1462331940025-496dfbfc7564` |
| `digital-circus` | picsum placeholder `picsum.photos/id/1015/800/600` |
| `digital-circus` | Rick Astley YouTube embed `youtube.com/embed/dQw4w9wgccc` |

### Resonance Spheres data

| Node | Removed |
|---|---|
| `glitch-digital-circus-trophy-room` | `/assets/observatory_atlas/observer-disagreement-hero.png` |
| `glitch-digital-circus-trophy-room` | YouTube `PLACEHOLDER_DIGITAL_CIRCUS_TROPHY` + thumbnail `/assets/observatory_atlas/hermetic-closure-hero.png` |
| `nobel-kip-thorne` | `/assets/observatory_atlas/wormhole-dual-reality-curvature-map.png` |
| `nobel-kip-thorne` | YouTube `PLACEHOLDER_KIP_THORNE` |
| `nobel-roger-penrose` | `/assets/observatory_atlas/hermetic-closure-hero.png` |
| `interstellar-gargantua` | `/assets/observatory_atlas/wormhole-dual-reality-full-stack.png` |
| `quake-portal-tech` | `/assets/observatory_atlas/hermetic-hit-closure-storyboard.png` |

Preserved:

- `glitch-digital-circus-trophy-room` hero `${BASE}assets/overview/wormhole_structure_contact_sheet.png`
- node text, tags, graph position, tier, category, resonance notes, layout
- sphere `textureUrl`
- xPRIMEray semantics

## Routes / viewports

Local `vite preview`, production basename `/misterylabs/`.

| File | Size | Surface |
|---|---|---|
| `before/mobile-390.png` | 390×844 | `/observatory/fractal-inspiration` landing |
| `after/mobile-390.png` | 390×844 | same |
| `before/desktop-1440.png` | 1440×900 | `/observatory/fractal-inspiration` landing |
| `after/desktop-1440.png` | 1440×900 | same |
| `before/resonance-landing-mobile-390.png` | 390×844 | `/observatory/resonance-spheres` landing |
| `after/resonance-landing-mobile-390.png` | 390×844 | same |
| `before/resonance-landing-desktop-1440.png` | 1440×900 | `/observatory/resonance-spheres` landing |
| `after/resonance-landing-desktop-1440.png` | 1440×900 | same |
| `before/fractal-circus-card-desktop-1440.png` | element | Digital Circus node card (picsum + YT) |
| `after/fractal-circus-card-desktop-1440.png` | element | same node, text-only |
| `before/fractal-interstellar-card-desktop-1440.png` | element | Gargantua node card (Unsplash) |
| `after/fractal-interstellar-card-desktop-1440.png` | element | same node, text-only |
| `before/resonance-thorne-dialog-desktop-1440.png` | dialog | Kip Thorne modal (broken image + YT) |
| `after/resonance-thorne-dialog-desktop-1440.png` | dialog | same node, text-only |
| `before/resonance-thorne-dialog-mobile-390.png` | dialog | Kip Thorne modal |
| `after/resonance-thorne-dialog-mobile-390.png` | dialog | same node, text-only |

Landings are visually unchanged: broken media only appeared in opened nodes.

## Verification

- `/observatory/fractal-inspiration` HTTP 200 at 390×844 and 1440×900
- `/observatory/resonance-spheres` HTTP 200 at 390×844 and 1440×900
- no `unsplash`, `picsum`, `dQw4w9`, `PLACEHOLDER_*`, or `/assets/observatory_atlas/` in `src/` scoped files or built bundle
- no broken image icons in affected modals
- no unavailable YouTube embeds in affected modals
- no empty carousel/media shell
- no new console / page errors
- no new document `overflowX` on fractal inspiration

## Adjacent findings (not fixed)

- `/observatory/resonance-spheres` already has `overflowX ≈ 95` at 390×844 (580px SVG overlay vs 390 viewport). Present before and after RA-1.
- Resonance Spheres page copy still promises a “media gallery” and “YT embeds”.
- `npm run audit:links` remains unsafe (stale known-route set; overwrites `LINK_AUDIT.md`).
