# MisterY Labs Visual Audit — 2026-06-22

**Coverage:** 12 routes × 2 themes × 7 viewports = 168 screenshots  
**Viewports:** 390×844, 768×1024, 1024×768, 1366×768, 1440×900, 1920×1080, 2560×1440  
**Themes:** dark (default), light

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3     |
| High     | 4     |
| Medium   | 4     |
| Low      | 2     |
| **Total**| **13**|

3 issues require immediate attention before the site is demoed at mobile. All others are quality improvements that preserve the cosmic aesthetic while raising readability.

---

## Criterion Results

| # | Criterion | Status | Finding IDs |
|---|-----------|--------|-------------|
| C1 | Text contrast against rendered background | ⚠ Partial | F-05, F-08, F-12 |
| C2 | Text too small below practical reading size | ⚠ Partial | F-02, F-04, F-08 |
| C3 | Floating text without annotation plate | ⚠ Partial | F-04, F-06, F-07 |
| C4 | Panels with insufficient opacity | ⚠ Partial | F-06, F-07 |
| C5 | Text overflow / clipping | ✕ Fail | F-01, F-03 |
| C6 | Awkward aspect-ratio compression | ✕ Fail | F-01, F-02, F-11 |
| C7 | Interactive targets too small | ⚠ Partial | F-04 |
| C8 | Excessive visual density | ⚠ Partial | F-10 |
| C9 | Light/dark mode mismatch | ⚠ Partial | F-09, F-12 |
| C10 | CLS-like layout jumps | ✓ Pass | — |

---

## Critical Findings

### F-01 — Broch Sphere SVG clipped at 390px
**Criteria:** C5, C6  
**File:** `src/components/brochSphere/BrochSpherePrototype.tsx:221`  
**Screenshot:** `mobile-390/broch-sphere-dark.png`

The SVG wrapper uses `overflow-hidden` with a child SVG that has `min-w-[720px]`. At 390px the right half of the graph is invisible — Homer's Iliad, 2001, Interstellar, Tolkien, the Story Lineage strand, and the CULTURAL/PERSONAL sector labels are all clipped. The graph is non-navigable at mobile.

**Fix:** Change the wrapper `overflow-hidden` → `overflow-x-auto`. At mobile widths, the graph becomes horizontally scrollable. Also lower the two-column grid from `xl:` → `lg:` (see F-11) so this only triggers at ≤768px.

---

### F-02 — Observatory heading 60px at mobile
**Criteria:** C6, C8  
**File:** `src/pages/Observatory.tsx:166`  
**Screenshot:** `mobile-390/observatory-dark.png`

`text-6xl md:text-7xl` = 3.75rem at 390px. The three-word heading "xPRIMEray Observatory Gallery" wraps to three lines consuming ~250px (~30% of 844px viewport height) before any content is visible. No `sm:` breakpoint defined.

**Fix:**
```html
<!-- before -->
<h1 className="text-6xl md:text-7xl font-bold tracking-tighter leading-[0.95] mb-4">

<!-- after -->
<h1 className="[font-size:clamp(2rem,8vw,4.5rem)] font-bold tracking-tighter leading-[0.95] mb-4">
```

---

### F-03 — Fractal Inspiration Atlas crashes at mobile
**Criteria:** C5, C6  
**File:** `src/components/FractalInspirationAtlas.tsx`  
**Screenshot:** `mobile-390/observatory-fractal-inspiration-dark.png`

Component renders "Fractal Inspiration Atlas unavailable — see browser console for details." at 390px. The page is otherwise blank. No mobile fallback or graceful degraded state exists.

**Fix:** Add a mobile-width guard that renders a static description and a "Best experienced at desktop (1024px+)" note instead of attempting the WebGL canvas.

---

## High Findings

### F-04 — Atlas sub-nav: 9px text, no plate, sub-44px touch targets
**Criteria:** C3, C7, C2  
**File:** `src/pages/Atlas.tsx:921`  
**Screenshot:** `laptop-1366/atlas-light.png`

The horizontal secondary nav ("ATLAS | OBSERVATORY | QUATERNION | ...") uses `font-mono text-[9px] uppercase tracking-[0.2em]` floating on the page background with no annotation plate. In light mode the labels are near-invisible. The `h-9` (36px) container fails the 44px touch-target minimum.

**Fix:** Apply the existing `.instrument-strip` class to the nav container and raise minimum label font to `text-[10px]`. Set `min-h-[44px]` on the tab strip.

---

### F-05 — Home/Atlas hero mono subtitle near-invisible in light mode
**Criteria:** C1, C2  
**File:** `src/pages/Atlas.tsx` (hero area)  
**Screenshot:** `mobile-390/home-light.png`

The mono subtitle ("MEASURED OBSERVABILITY CUTSHEETS FOR NATIVE GEODESIC RAY TRACING.") uses raw amber Tailwind color at low opacity. In light mode, computed contrast is approximately 1.8:1 against white — far below AA-large minimum (3:1). In dark mode it reads as atmospheric, which is acceptable.

**Fix:** Use `text-[hsl(var(--annotation-amber))]` (already calibrated for ≥4.1:1 on white in light mode). Floor opacity to 0.80 in light mode.

---

### F-06 — Atlas floating labels without annotation plates (light mode)
**Criteria:** C3, C4  
**File:** `src/pages/Atlas.tsx:1190–1220`  
**Screenshot:** `laptop-1366/atlas-light.png`

"OBSERVER DISAGREEMENT", "OFFAXIS_OBSERVE_DELTA", and "DOMINANT TRANSITION: GEOM_HIT → ESCAPED_NO_HIT" float directly on the grid background. In light mode the grid is distinctly visible and these labels wash into it. In dark mode they read adequately due to the near-black field.

**Fix:** Wrap each label `<span>` in `.annotation-plate` (already defined in `src/index.css`). Zero new CSS needed.

---

### F-07 — Broch Sphere node label plates invisible in light mode
**Criteria:** C4, C3  
**File:** `src/components/brochSphere/BrochSpherePrototype.tsx:577–587`  
**Screenshot:** `desktop-1440/broch-sphere-light.png`

The SVG backing rects use `fill="hsl(var(--layer-panel)/0.88)"`. In light mode `--layer-panel` = `0 0% 100%` (pure white) on a `--layer-diagram` field of `220 12% 96%` (near-white). White-on-near-white provides no visual plate. The `stroke="hsl(var(--border)/0.22)"` is also invisible — border at 22% on 78% L background.

**Fix:** Add a CSS class to the backing rect and override in light mode:
```css
/* in src/index.css @layer components */
.broch-node-label-bg {
  fill: hsl(var(--layer-panel) / 0.88);
  stroke: hsl(var(--border) / 0.22);
  stroke-width: 0.5;
}
html.light .broch-node-label-bg {
  fill: hsl(var(--layer-panel-strong));
  stroke: hsl(var(--border) / 0.60);
}
```

---

## Medium Findings

### F-08 — OpsStatusBar sub-9px text at low opacity
**Criteria:** C2, C1  
**File:** `src/components/OpsStatusBar.tsx:135–145`

`text-[8px]` and `text-[8.5px]` at `muted-foreground/40` – `muted-foreground/45`. Below practical reading threshold. The atmospheric intent is valid; the execution undershoots legibility.

**Fix:** Floor to `text-[9px]` universally. Floor opacity to 0.55 dark, 0.65 light.

---

### F-09 — FractalInspirationAtlas hardcoded dark canvas in light mode
**Criteria:** C9  
**File:** `src/components/FractalInspirationAtlas.tsx:507`

`bg-gradient-to-br from-[#05070f] via-[#070912] to-[#04050b]` — hardcoded near-black hex values. In light mode this creates a dark rectangle in an otherwise white page.

**Fix:**
```html
<!-- before -->
className="... bg-gradient-to-br from-[#05070f] via-[#070912] to-[#04050b] ..."

<!-- after -->
className="... bg-[hsl(var(--layer-diagram))] html-light:bg-[hsl(220_12%_92%)] ..."
```
Or add to `index.css`: `.fractal-canvas { background: hsl(230 25% 8%); }` with `html.light .fractal-canvas { background: hsl(220 12% 92%); }`.

---

### F-10 — Broch Sphere: 'Homer's Iliad' and '2001: A Space Odyssey' label chips overlap
**Criteria:** C8, C3  
**File:** `src/data/brochSphere/nodes.ts`

Two nodes with long labels and adjacent projected coordinates produce overlapping backing-plate chips at all viewport sizes above 768px.

**Fix:** Separate nodes by ≥15° in either latitude or longitude. `star-homer` → lon 235°, `s-2001` → lon 255° would add ~100px of separation at current projection.

---

### F-11 — Broch Sphere two-column layout only activates at xl (1280px)
**Criteria:** C6  
**File:** `src/components/brochSphere/BrochSpherePrototype.tsx:136`

At 1024px the right column (Journey + Node card — the primary interactive surface) is below the SVG, requiring scroll to reach. The SVG alone fills 520px of the 768px laptop-sm viewport.

**Fix:** Change `xl:grid-cols-[minmax(0,1fr)_380px]` → `lg:grid-cols-[minmax(0,1fr)_360px]`. Also reduce SVG height at `lg` from `h-[520px]` to `lg:h-[440px]`.

---

## Low Findings

### F-12 — Observatory amber badge uses raw Tailwind token, not semantic token
**Criteria:** C1, C9  
**File:** `src/pages/Observatory.tsx:162`

`text-amber-500 dark:text-amber-400` — in light mode amber-500 on white is ~2.1:1 (fails AA). The semantic `--annotation-amber` token is calibrated for ≥4.1:1 in light mode.

**Fix:** `text-[hsl(var(--annotation-amber))]` — one attribute, both themes resolved.

---

### F-13 — Wide viewport (1920px+) shows large empty gutters
**Criteria:** C6  
**Informational — no code change required.**

All routes use `container` (max-w-1400px) centered at 1920px+ creating ~260px gutters. The cosmic background ambience holds these gutters adequately. No actionable fix unless a max-width layout refresh is specifically desired.

---

## Implementation Order

Apply in this order — each fix is self-contained, no interdependencies except F-01+F-11 which should be applied together.

| # | ID    | File                                          | Change         | Effort  |
|---|-------|-----------------------------------------------|----------------|---------|
| 1 | F-07  | `BrochSpherePrototype.tsx` + `index.css`      | CSS class override for light mode plates | 15 min |
| 2 | F-02  | `Observatory.tsx:166`                         | clamp() heading | 2 min |
| 3 | F-09  | `FractalInspirationAtlas.tsx:507`             | CSS var for canvas bg | 5 min |
| 4 | F-12  | `Observatory.tsx:162`                         | Token swap | 2 min |
| 5 | F-11  | `BrochSpherePrototype.tsx:136,226`            | lg: breakpoint + h-[440px] | 5 min |
| 6 | F-01  | `BrochSpherePrototype.tsx:221`                | overflow-x-auto | 2 min |
| 7 | F-06  | `Atlas.tsx:1190–1220`                         | .annotation-plate wraps | 10 min |
| 8 | F-04  | `Atlas.tsx:921`                               | .instrument-strip + min-h-[44px] | 10 min |
| 9 | F-10  | `nodes.ts`                                    | Adjust 2 longitudes | 3 min |
|10 | F-08  | `OpsStatusBar.tsx`                            | Floor text-[9px], opacity | 5 min |
|11 | F-05  | `Atlas.tsx`                                   | Token + opacity on subtitle | 5 min |
|12 | F-03  | `FractalInspirationAtlas.tsx`                 | Mobile fallback render | 20 min |

---

## What Passes

- **C10 (layout jump):** No CLS-like shifts detected across any route/viewport/theme combination.
- **Navigation:** Mobile hamburger menu is functional and covers all routes.
- **Transport Sphere, Resonance Spheres, Force Graph, Quaternion, Poisson Dot, Higher Dimensional:** All render correctly at all tested viewports with acceptable annotation surfaces.
- **Broch Sphere at ≥768px:** Node label backing plates and sector label plates (added in previous session) work correctly in dark mode. Light mode plate visibility is F-07.
- **Contrast token system (16 pairs):** All pass WCAG AA per `npm run contrast:check`. Issues in this audit are route-specific rendered contexts not covered by the token-level check.
- **MisterY Labs weird-cosmic aesthetic:** Intact. No route has been redesigned. All fixes are surgical surface corrections.
