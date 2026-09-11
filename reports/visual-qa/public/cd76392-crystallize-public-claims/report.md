# Public UI verification — crystallize public capability claims

Commit: `cd76392a99aca7176487fa967b10894ccd15859f`
Message: `fix(public): crystallize public capability claims`

## Files

- `src/pages/Index.tsx`
- `src/components/SiteFooter.tsx`
- `src/pages/Observatory.tsx`

## Copy changes

Home flagship cards (hrefs unchanged):

- Transport Engine / CORE → Atlas Instruments / ATLAS — “Observatory instruments, Arcade, and inspiration atlas.” → `/atlas`
- LuxCoreGRIN — unchanged
- Validation Cockpit / DIAGNOSTICS → Media Diagnostics / MEDIA — “Contact sheets, heatmaps, and diagnostic image gallery.” → `/media`
- Island Classifier / ANALYSIS → Transport Islands / RESEARCH — “Island fixtures and observer-disagreement diagnostics — still researching.” → `/observatory`

Home Featured Artifact kicker:

- `23.8% classification redistribution · 27,619 px · 480×270`
- → `23.8% classification redistribution · 30,839 px · 480×270`

Latest measurement dominant-transition `geom_hit → escaped_no_hit · 27,619 px` unchanged.

Home status: removed pulse + “Active”; left `SYS // 02` and `Observatory`.

Home Release Status 16/4/13 block removed. `ObsMetric` helper removed as unused.

Footer: removed Nominal and pulsing dot. Preserved `MisterY Labs · MYL-OBS-001` and `Open research · Reproducible · Community-driven`.

Observatory `#optical-portal`: `LIVE GODOT` → `GODOT SOURCE`. Removed `20s cinematic dolly export ready.` Suno line, Godot folder link, optozorax reference, and ACTIVATING left untouched.

## Viewports / themes

Local `vite preview`, basename `/misterylabs/`.

| File | Surface |
|---|---|
| `before/mobile-390.png` / `after/mobile-390.png` | Home light 390×844 |
| `before/desktop-1440.png` / `after/desktop-1440.png` | Home light 1440×900 |
| `after/home-dark-*.png` | Home dark both viewports |
| `after/observatory-light-*.png` / `after/observatory-dark-*.png` | Observatory both themes |
| `after/optical-portal-desktop-1440.png` | GODOT SOURCE card |
| `after/footer-desktop-1440.png` | shared footer |
| `after/featured-kicker-desktop-1440.png` | 30,839 px kicker |

## Verification

- Home and Observatory 390×844 and 1440×900, light and dark: HTTP 200, no new console errors
- Home overflowX 0; Observatory mobile overflowX 95 (pre-existing)
- Atlas + Research footers: no Nominal, no pulse
- Featured Artifact 30,839; dominant-transition 27,619 remains
- Release Status gone; LuxCoreGRIN unchanged; card hrefs original
- optical portal GODOT SOURCE; no dolly-ready; ACTIVATING preserved

## Adjacent findings (not fixed)

- Observatory mobile 390×844 `overflowX` = 95 (pre-existing)
- Research still describes the May 2026 16/4/13 audit as a documentation portal
- `/mission` OpsStatusBar still says Nominal (internal)
