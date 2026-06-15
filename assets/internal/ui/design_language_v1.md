# MisterY Labs — Design Language v1

## Purpose

This document describes **why** the UI works the way it does.
It is written for future contributors, AI coding assistants, and maintainers
who need to understand the reasoning behind design decisions — not just
the classes and tokens that implement them.

Read this before making visual changes. Read the doctrine file before
making hierarchy changes. Run the audit tools before shipping.

---

## 1. The Core Problem This System Solves

MisterY Labs operates in two themes: dark (observatory default) and light.

Dark mode is **luminosity-based**: elements establish hierarchy through
brightness. Glowing spheres, luminous ray traces, and emissive diagrams
dominate naturally because they are the brightest things on screen.

Light mode is **weight-based**: on a white field, brightness signals nothing.
Hierarchy must come from type weight, spatial containment, and surface
structure — not from glow.

Without a deliberate system, light mode collapses. Decorative annotations
(sphere labels, instrument tags, axis markers) gain the same visual weight
as headlines and body text. The eye cannot distinguish content from metadata.

The design language described here solves this by establishing a clear
**layer stack** that applies in both modes, using **calibrated contrast tokens**
to ensure ink is always readable on its surface, and **annotation surfaces**
to give metadata its own visual tier.

---

## 2. The Layer Model

Every visible element belongs to one of five layers.
The eye should be able to read this stack even when squinting.

```
5. Action Layer      — CTAs, navigation links, filter controls
4. Content Layer     — Headlines, body copy, descriptions
3. Annotation Layer  — Labels, axis markers, instrument tags, metadata
2. Diagram Layer     — Visualizations, simulations, live graphs
1. Background Layer  — Page field, grid texture, decorative gradients
```

### Rules

- **Background** never contains critical information.
- **Diagram** shows phenomena. It may contain data but must not contain
  essential reading text. (Text floating over a diagram is on the wrong layer.)
- **Annotation** explains diagrams. It always sits on a dedicated surface —
  a chip, strip, or plate — never directly on a diagram or the page field.
- **Content** always dominates annotation text. If a label competes with
  a headline, something is on the wrong layer.
- **Action** is always visually distinct from content so navigation
  affordances don't blend into body text.

### Why "solve with layers, not color"

The temptation in light mode is to darken text that isn't reading well.
This works once, locally, but doesn't scale — and it doesn't address the
structural problem. If annotation text competes with a headline, making the
annotation darker makes it compete more. The fix is to move the annotation
onto an annotation-layer surface, which communicates tier without increasing
color contrast alone.

Color contrast is measurable and necessary. But layer membership is what
tells the eye what something *is*, not just whether it's readable.

---

## 3. Contrast Token Model

Contrast tokens are CSS custom properties that name specific luminance
positions. They are not color swaps — they are calibrated points on the
light/dark luminance scale that satisfy WCAG requirements for their
intended use.

### Layer tokens (surface backgrounds)

| Token | Dark | Light | Purpose |
|---|---|---|---|
| `--layer-page` | 7% L | 99% L | Outermost page field |
| `--layer-diagram` | 10% L | 96% L | Canvas / diagram area |
| `--layer-panel` | 11% L | 100% L | Panel body / card surface |
| `--layer-panel-strong` | 13% L | 94% L | Panel header / elevated row |

In dark mode these are near-identical dark values — depth is communicated
by luminosity difference. In light mode they are clearly stepped grays —
depth is communicated by tonal separation.

### Ink tokens (text)

| Token | Dark | Light | Required contrast |
|---|---|---|---|
| `--ink-primary` | 95% L | 8% L | AA prose (≥ 4.5:1) |
| `--ink-secondary` | 75% L | 22% L | AA prose (≥ 4.5:1) |
| `--ink-muted` | 62% L | 32% L | AA prose (≥ 4.5:1) |
| `--ink-ambient` | 44% L | 50% L | AA-large (≥ 3.0:1) |

`ink-ambient` is intentionally at the AA-large floor. It is used only for
decorative or atmospheric labels that carry no essential information. In dark
mode, many of these labels are rendered at fractional opacity — which is fine,
because luminosity carries them. In light mode, they must pass AA-large on
their surface token; opacity alone is not sufficient.

### Annotation spot colors

| Token | Dark | Light | Required contrast |
|---|---|---|---|
| `--annotation-cyan` | 58% L (192° sat) | 35% L (188° sat) | AA-large (≥ 3.0:1) |
| `--annotation-amber` | 60% L (28° sat) | 40% L (28° sat) | AA-large (≥ 3.0:1) |

Annotation colors shift significantly between modes. In dark mode they are
luminous — high lightness, high saturation, emissive register. In light mode
they are darker and less saturated — they annotate rather than glow.
The color identity (cyan = GRIN field, amber = thermal/energy) is preserved
across both modes. Only the application changes.

### Checking contrast

```
npm run contrast:check
```

This runs the WCAG luminance calculator against all token pairs and reports
pass/fail. Run it before any PR that changes CSS variables or layer/ink
token values. All 16 required pairs must pass.

---

## 4. Annotation Surface Model

The annotation surface model answers one question: **what does an annotation
sit on?**

In dark mode, the observatory aesthetic is atmospheric. Labels float at low
opacity over dark backgrounds, reading as ambient environmental text. This
works because the dark background itself is low-luminance — a dim label on a
dark field is clearly subordinate to bright content.

In light mode, the same label on a white field reads at full contrast and
competes with body text. The solution is a dedicated surface: a small panel
(chip, strip, or plate) that creates a visual tier between the annotation
and the page field.

### Three surface patterns

**`annotation-plate`** — An inline chip for a single label, tag, or
instrument identifier. Applied to `<span>` elements that float over diagrams
or sit in divider rows. Creates a bounded reading surface in light mode.
In dark mode: barely visible — preserves atmospheric feel. In light mode:
`layer-panel-strong` solid with `border-border/68` edge.

**`annotation-plate-strong`** — A heavier version of the plate, for labels
that carry more weight (measurement values, axis IDs, critical instrument
tags). Same behavior, slightly stronger surfaces.

**`instrument-strip`** — A full-width horizontal band. Used above or below
a diagram to bracket the annotation zone from the content zone. The strip
establishes a clear boundary: "below this line is the diagram; the labels
in this strip explain the diagram." In light mode: `layer-panel-strong`
solid background with `border-bottom`. In dark mode: semi-transparent dark
panel, nearly invisible.

### When to apply annotation surfaces

Apply them when any of these conditions are true:

- Text sits directly over a diagram element (SVG, canvas, 3D viewport)
- A label is adjacent to a diagram on the page field without any visual
  container between them
- A label's role is metadata (instrument ID, axis variable, formula reference)
  and it competes visually with headlines or body copy
- Light mode screenshots show the label reading at rank #1-3 when its
  intended rank is #4 or #5

Do not apply annotation surfaces to:

- Body copy or subheadlines (those are Content layer, not Annotation layer)
- Navigation links (Action layer)
- Card titles or section headers (Content layer)
- Any text that belongs to the page structure, not to a diagram

---

## 5. Screenshot Audit Workflow

The audit workflow exists to make hierarchy decisions *observable* rather
than intuitive. Without screenshots, "the sphere annotation is too prominent"
is an opinion. With screenshots, it's a measurable fact.

### Capturing

```
npm run capture:screens
```

Captures 11 routes × 2 themes = 22 screenshots at 1440×1100 using Firefox
headless. Output goes to `docs/visual-audit/YYYY-MM-DD/`. Takes about 2 minutes.

Run after any change that touches CSS variables, layout, color, or component
structure.

### Reading the screenshots

Look at light mode first. Light mode is where the layer stack must carry all
the visual weight — there is no luminosity to fall back on. Ask:

1. What are the first five things the eye sees?
2. Is that the intended hierarchy?
3. Are any annotation elements above rank #3?
4. Are any content elements invisible or below rank #4?

Dark mode usually requires less scrutiny — luminosity naturally surfaces the
intended hierarchy. Check dark mode screenshots for the observatory feel:
the page should read like a live instrument panel, not a document.

### What the audit cannot catch

Screenshots capture a static frame at page load with a 2-second settle delay.
They do not capture:

- Hover states
- Interactive diagram states (selected nodes, active controls)
- Scroll position below the viewport
- Animation timing

For these, manual review is required.

---

## 6. Hierarchy Principles

These are the governing rules. They are intentionally short.

### The squint test

Squint until the page is a blur. What shapes remain?
If the strongest shapes are not the most important content, the hierarchy
is inverted.

### Background → Surface → Content

This is the only sequence that is always correct.
Text that sits directly on a diagram (skipping the surface layer) will fail
in at least one theme. Text that sits directly on the background (skipping
surface and diagram) may work but cannot be subordinated without a surface
to push it down.

### Annotations explain diagrams; they do not compete with them

An annotation that competes visually with the diagram it labels has failed.
Annotations should be readable on close inspection, not demanding of immediate
attention. The diagram communicates the phenomenon; the annotation provides
the caption.

### Color encodes type; weight encodes rank

In this system, color identity (cyan, amber, navy, violet) identifies
*what kind of element* something is. Color does not establish hierarchy.
Hierarchy comes from type weight, spatial containment, surface tier, and
opacity level — not from which color is used. This means the same cyan
can appear as a dominant annotation in dark mode and a subordinate chip in
light mode without changing its identity.

### Solve readability with layers first

When text is hard to read, the first question is always: is it on the right
layer? If a label is directly on a diagram background, it needs a surface —
that is a structural problem. Increasing contrast is the second step, taken
only after the structural layer is correct.

### Dark mode and light mode are different vocabularies, not different palettes

Dark mode speaks in luminosity: brighter = more important, dimmer = less
important. Light mode speaks in weight: heavier type = more important,
contained surface = less important. The color palette is the same in both
modes. The grammar of hierarchy is different. A change made for light mode
must be verified not to damage dark mode grammar, and vice versa.

---

## Reference

**Doctrine:** `assets/internal/MisterY Labs Visual Hierarchy Doctrine v1.md`
— Authoritative statement of the layer model.

**Token values:** `src/index.css` — `:root` (dark) and `html.light` (light)
blocks contain all `--layer-*`, `--ink-*`, and `--annotation-*` token values.

**Contrast verification:** `scripts/contrast-check.ts` — WCAG luminance
calculation for all required token pairs. Outputs pass/fail to stdout.

**Screenshot archive:** `docs/visual-audit/YYYY-MM-DD/` — 22 screenshots per
audit run. Index in `README.md` within each date folder.

**Audit npm scripts:**

```
npm run contrast:check   # WCAG contrast audit (fast, ~200ms)
npm run capture:screens  # Full screenshot capture (slow, ~2min)
```

---

*Design Language v1 — MisterY Labs · Established Phase 3C · June 2026*
