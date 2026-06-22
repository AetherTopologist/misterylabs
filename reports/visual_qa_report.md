# MisterY Labs Visual QA Report

Generated: 2026-06-22T05:14:54.757Z

This report is produced by `npm run visual:qa`. It audits every configured route across 2 themes and 7 viewports, captures screenshots, and emits DOM-measured findings for the MisterY Labs visual hierarchy doctrine.

## Coverage

- Routes: 12
- Themes: dark, light
- Viewports: mobile-390 (390x844), tablet-768 (768x1024), laptop-sm-1024 (1024x768), laptop-1366 (1366x768), desktop-1440 (1440x900), wide-1920 (1920x1080), ultra-2560 (2560x1440)
- Screenshots: 168
- Screenshot root: `reports/visual-qa/2026-06-22`

## Summary

| Severity | Count |
|---|---:|
| CRITICAL | 12 |
| HIGH | 42 |
| MEDIUM | 13 |
| LOW | 0 |
| Total | 67 |

## Finding Index

| ID | Severity | Category | Route | Theme | Viewport | Occurrences | Title |
|---|---|---|---|---|---|---:|---|
| VQA-001 | CRITICAL | viewport-scaling | atlas | both | tablet-768 | 2 | Clipped or horizontally overflowing content detected |
| VQA-002 | CRITICAL | viewport-scaling | broch-sphere | both | tablet-768 | 2 | Clipped or horizontally overflowing content detected |
| VQA-003 | CRITICAL | viewport-scaling | home | both | tablet-768 | 2 | Clipped or horizontally overflowing content detected |
| VQA-004 | CRITICAL | viewport-scaling | media | both | multiple | 6 | Clipped or horizontally overflowing content detected |
| VQA-005 | CRITICAL | viewport-scaling | observatory-force-graph | both | multiple | 14 | Clipped or horizontally overflowing content detected |
| VQA-006 | CRITICAL | viewport-scaling | observatory-fractal-inspiration | both | tablet-768 | 2 | Clipped or horizontally overflowing content detected |
| VQA-007 | CRITICAL | viewport-scaling | observatory-higher-dimensional | both | tablet-768 | 2 | Clipped or horizontally overflowing content detected |
| VQA-008 | CRITICAL | viewport-scaling | observatory-poisson-dot | both | tablet-768 | 2 | Clipped or horizontally overflowing content detected |
| VQA-009 | CRITICAL | viewport-scaling | observatory-quaternion | both | tablet-768 | 2 | Clipped or horizontally overflowing content detected |
| VQA-010 | CRITICAL | viewport-scaling | observatory-resonance-spheres | both | multiple | 4 | Clipped or horizontally overflowing content detected |
| VQA-011 | CRITICAL | viewport-scaling | observatory-transport-sphere | both | tablet-768 | 2 | Clipped or horizontally overflowing content detected |
| VQA-012 | CRITICAL | viewport-scaling | observatory | both | multiple | 4 | Clipped or horizontally overflowing content detected |
| VQA-013 | HIGH | light-dark-consistency | atlas | both | multiple | 7 | Hierarchy degrades in light mode compared with dark mode |
| VQA-014 | HIGH | mobile-tablet-adaptation | atlas | both | multiple | 4 | Mobile/tablet interactive targets below comfortable size |
| VQA-015 | HIGH | panel-hierarchy | atlas | both | multiple | 14 | Weak panel separation detected |
| VQA-016 | HIGH | text-contrast | atlas | both | multiple | 14 | Text contrast failures detected against rendered surfaces |
| VQA-017 | HIGH | graph-prominence | broch-sphere | both | multiple | 14 | Unreadable graph labels detected |
| VQA-018 | HIGH | mobile-tablet-adaptation | broch-sphere | both | multiple | 4 | Mobile/tablet interactive targets below comfortable size |
| VQA-019 | HIGH | panel-hierarchy | broch-sphere | both | multiple | 4 | Weak panel separation detected |
| VQA-020 | HIGH | text-contrast | broch-sphere | both | multiple | 14 | Text contrast failures detected against rendered surfaces |
| VQA-021 | HIGH | light-dark-consistency | home | both | multiple | 7 | Hierarchy degrades in light mode compared with dark mode |
| VQA-022 | HIGH | mobile-tablet-adaptation | home | both | multiple | 4 | Mobile/tablet interactive targets below comfortable size |
| VQA-023 | HIGH | panel-hierarchy | home | both | multiple | 14 | Weak panel separation detected |
| VQA-024 | HIGH | text-contrast | home | both | multiple | 14 | Text contrast failures detected against rendered surfaces |
| VQA-025 | HIGH | mobile-tablet-adaptation | media | both | multiple | 4 | Mobile/tablet interactive targets below comfortable size |
| VQA-026 | HIGH | panel-hierarchy | media | both | multiple | 14 | Weak panel separation detected |
| VQA-027 | HIGH | text-contrast | media | dark | multiple | 7 | Text contrast failures detected against rendered surfaces |
| VQA-028 | HIGH | mobile-tablet-adaptation | observatory-force-graph | both | multiple | 4 | Mobile/tablet interactive targets below comfortable size |
| VQA-029 | HIGH | panel-hierarchy | observatory-force-graph | both | multiple | 14 | Weak panel separation detected |
| VQA-030 | HIGH | text-contrast | observatory-force-graph | dark | multiple | 6 | Text contrast failures detected against rendered surfaces |
| VQA-031 | HIGH | mobile-tablet-adaptation | observatory-fractal-inspiration | both | multiple | 4 | Mobile/tablet interactive targets below comfortable size |
| VQA-032 | HIGH | panel-hierarchy | observatory-fractal-inspiration | both | multiple | 14 | Weak panel separation detected |
| VQA-033 | HIGH | text-contrast | observatory-fractal-inspiration | dark | multiple | 6 | Text contrast failures detected against rendered surfaces |
| VQA-034 | HIGH | light-dark-consistency | observatory-higher-dimensional | both | multiple | 7 | Hierarchy degrades in light mode compared with dark mode |
| VQA-035 | HIGH | mobile-tablet-adaptation | observatory-higher-dimensional | both | multiple | 4 | Mobile/tablet interactive targets below comfortable size |
| VQA-036 | HIGH | panel-hierarchy | observatory-higher-dimensional | both | multiple | 14 | Weak panel separation detected |
| VQA-037 | HIGH | text-contrast | observatory-higher-dimensional | both | multiple | 14 | Text contrast failures detected against rendered surfaces |
| VQA-038 | HIGH | mobile-tablet-adaptation | observatory-poisson-dot | both | multiple | 4 | Mobile/tablet interactive targets below comfortable size |
| VQA-039 | HIGH | panel-hierarchy | observatory-poisson-dot | both | multiple | 10 | Weak panel separation detected |
| VQA-040 | HIGH | text-contrast | observatory-poisson-dot | both | multiple | 13 | Text contrast failures detected against rendered surfaces |
| VQA-041 | HIGH | mobile-tablet-adaptation | observatory-quaternion | both | multiple | 4 | Mobile/tablet interactive targets below comfortable size |
| VQA-042 | HIGH | panel-hierarchy | observatory-quaternion | both | multiple | 14 | Weak panel separation detected |
| VQA-043 | HIGH | text-contrast | observatory-quaternion | both | multiple | 13 | Text contrast failures detected against rendered surfaces |
| VQA-044 | HIGH | mobile-tablet-adaptation | observatory-resonance-spheres | both | multiple | 4 | Mobile/tablet interactive targets below comfortable size |
| VQA-045 | HIGH | panel-hierarchy | observatory-resonance-spheres | both | multiple | 10 | Weak panel separation detected |
| VQA-046 | HIGH | text-contrast | observatory-resonance-spheres | both | multiple | 13 | Text contrast failures detected against rendered surfaces |
| VQA-047 | HIGH | graph-prominence | observatory-transport-sphere | both | multiple | 14 | Unreadable graph labels detected |
| VQA-048 | HIGH | mobile-tablet-adaptation | observatory-transport-sphere | both | multiple | 4 | Mobile/tablet interactive targets below comfortable size |
| VQA-049 | HIGH | panel-hierarchy | observatory-transport-sphere | both | multiple | 10 | Weak panel separation detected |
| VQA-050 | HIGH | text-contrast | observatory-transport-sphere | dark | multiple | 7 | Text contrast failures detected against rendered surfaces |
| VQA-051 | HIGH | light-dark-consistency | observatory | both | multiple | 7 | Hierarchy degrades in light mode compared with dark mode |
| VQA-052 | HIGH | mobile-tablet-adaptation | observatory | both | multiple | 4 | Mobile/tablet interactive targets below comfortable size |
| VQA-053 | HIGH | panel-hierarchy | observatory | both | mobile-390 | 2 | Weak panel separation detected |
| VQA-054 | HIGH | text-contrast | observatory | both | multiple | 14 | Text contrast failures detected against rendered surfaces |
| VQA-055 | MEDIUM | graph-prominence | broch-sphere | both | ultra-2560 | 2 | Primary graph or canvas is visually under-prominent |
| VQA-056 | MEDIUM | graph-prominence | home | both | multiple | 14 | Unreadable graph labels detected |
| VQA-057 | MEDIUM | graph-prominence | observatory-fractal-inspiration | both | multiple | 14 | Primary graph or canvas is visually under-prominent |
| VQA-058 | MEDIUM | graph-prominence | observatory-higher-dimensional | both | mobile-390 | 2 | Primary graph or canvas is visually under-prominent |
| VQA-059 | MEDIUM | graph-prominence | observatory-higher-dimensional | both | multiple | 14 | Unreadable graph labels detected |
| VQA-060 | MEDIUM | annotation-plate-coverage | observatory-poisson-dot | both | multiple | 14 | Floating annotation text lacks dedicated surfaces |
| VQA-061 | MEDIUM | light-dark-consistency | observatory-poisson-dot | both | multiple | 7 | Hierarchy degrades in light mode compared with dark mode |
| VQA-062 | MEDIUM | graph-prominence | observatory-quaternion | both | multiple | 4 | Primary graph or canvas is visually under-prominent |
| VQA-063 | MEDIUM | annotation-plate-coverage | observatory-resonance-spheres | both | multiple | 14 | Floating annotation text lacks dedicated surfaces |
| VQA-064 | MEDIUM | graph-prominence | observatory-resonance-spheres | both | multiple | 14 | Unreadable graph labels detected |
| VQA-065 | MEDIUM | graph-prominence | observatory-resonance-spheres | both | multiple | 4 | Primary graph or canvas is visually under-prominent |
| VQA-066 | MEDIUM | annotation-plate-coverage | observatory | both | multiple | 14 | Floating annotation text lacks dedicated surfaces |
| VQA-067 | MEDIUM | graph-prominence | observatory | both | multiple | 14 | Unreadable graph labels detected |

## CRITICAL

### VQA-001 — Clipped or horizontally overflowing content detected

- Category: viewport-scaling
- Route: `atlas`
- Theme / viewport: `both` / `tablet-768`
- Occurrences: 2
- Affected viewports: `tablet-768`
- Screenshot: `visual-qa/2026-06-22/tablet-768/atlas-dark.png`
- Details: 0 clipped text/content elements; body horizontal overflow 115px. Observed in 2 screenshots.

### VQA-002 — Clipped or horizontally overflowing content detected

- Category: viewport-scaling
- Route: `broch-sphere`
- Theme / viewport: `both` / `tablet-768`
- Occurrences: 2
- Affected viewports: `tablet-768`
- Screenshot: `visual-qa/2026-06-22/tablet-768/broch-sphere-dark.png`
- Details: 0 clipped text/content elements; body horizontal overflow 115px. Observed in 2 screenshots.

### VQA-003 — Clipped or horizontally overflowing content detected

- Category: viewport-scaling
- Route: `home`
- Theme / viewport: `both` / `tablet-768`
- Occurrences: 2
- Affected viewports: `tablet-768`
- Screenshot: `visual-qa/2026-06-22/tablet-768/home-dark.png`
- Details: 0 clipped text/content elements; body horizontal overflow 115px. Observed in 2 screenshots.

### VQA-004 — Clipped or horizontally overflowing content detected

- Category: viewport-scaling
- Route: `media`
- Theme / viewport: `both` / `multiple`
- Occurrences: 6
- Affected viewports: `laptop-sm-1024`, `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/laptop-sm-1024/media-dark.png`
- Details: 10 clipped text/content elements; body horizontal overflow 0px. Observed in 6 screenshots.

### VQA-005 — Clipped or horizontally overflowing content detected

- Category: viewport-scaling
- Route: `observatory-force-graph`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-force-graph-dark.png`
- Details: 1 clipped text/content elements; body horizontal overflow 0px. Observed in 14 screenshots.

### VQA-006 — Clipped or horizontally overflowing content detected

- Category: viewport-scaling
- Route: `observatory-fractal-inspiration`
- Theme / viewport: `both` / `tablet-768`
- Occurrences: 2
- Affected viewports: `tablet-768`
- Screenshot: `visual-qa/2026-06-22/tablet-768/observatory-fractal-inspiration-dark.png`
- Details: 0 clipped text/content elements; body horizontal overflow 115px. Observed in 2 screenshots.

### VQA-007 — Clipped or horizontally overflowing content detected

- Category: viewport-scaling
- Route: `observatory-higher-dimensional`
- Theme / viewport: `both` / `tablet-768`
- Occurrences: 2
- Affected viewports: `tablet-768`
- Screenshot: `visual-qa/2026-06-22/tablet-768/observatory-higher-dimensional-dark.png`
- Details: 0 clipped text/content elements; body horizontal overflow 115px. Observed in 2 screenshots.

### VQA-008 — Clipped or horizontally overflowing content detected

- Category: viewport-scaling
- Route: `observatory-poisson-dot`
- Theme / viewport: `both` / `tablet-768`
- Occurrences: 2
- Affected viewports: `tablet-768`
- Screenshot: `visual-qa/2026-06-22/tablet-768/observatory-poisson-dot-dark.png`
- Details: 0 clipped text/content elements; body horizontal overflow 115px. Observed in 2 screenshots.

### VQA-009 — Clipped or horizontally overflowing content detected

- Category: viewport-scaling
- Route: `observatory-quaternion`
- Theme / viewport: `both` / `tablet-768`
- Occurrences: 2
- Affected viewports: `tablet-768`
- Screenshot: `visual-qa/2026-06-22/tablet-768/observatory-quaternion-dark.png`
- Details: 0 clipped text/content elements; body horizontal overflow 115px. Observed in 2 screenshots.

### VQA-010 — Clipped or horizontally overflowing content detected

- Category: viewport-scaling
- Route: `observatory-resonance-spheres`
- Theme / viewport: `both` / `multiple`
- Occurrences: 4
- Affected viewports: `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/mobile-390/observatory-resonance-spheres-dark.png`
- Details: 0 clipped text/content elements; body horizontal overflow 95px. Observed in 4 screenshots.

### VQA-011 — Clipped or horizontally overflowing content detected

- Category: viewport-scaling
- Route: `observatory-transport-sphere`
- Theme / viewport: `both` / `tablet-768`
- Occurrences: 2
- Affected viewports: `tablet-768`
- Screenshot: `visual-qa/2026-06-22/tablet-768/observatory-transport-sphere-dark.png`
- Details: 0 clipped text/content elements; body horizontal overflow 115px. Observed in 2 screenshots.

### VQA-012 — Clipped or horizontally overflowing content detected

- Category: viewport-scaling
- Route: `observatory`
- Theme / viewport: `both` / `multiple`
- Occurrences: 4
- Affected viewports: `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/mobile-390/observatory-dark.png`
- Details: 0 clipped text/content elements; body horizontal overflow 95px. Observed in 4 screenshots.

## HIGH

### VQA-013 — Hierarchy degrades in light mode compared with dark mode

- Category: light-dark-consistency
- Route: `atlas`
- Theme / viewport: `both` / `multiple`
- Occurrences: 7
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/atlas-light.png`
- Details: Light mode adds 44 contrast failures, 0 weak panels, and 0 floating annotations versus dark mode. Observed in 7 screenshots.

### VQA-014 — Mobile/tablet interactive targets below comfortable size

- Category: mobile-tablet-adaptation
- Route: `atlas`
- Theme / viewport: `both` / `multiple`
- Occurrences: 4
- Affected viewports: `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/mobile-390/atlas-dark.png`
- Details: 10 interactive targets with text are smaller than the audit floor. Observed in 4 screenshots.

### VQA-015 — Weak panel separation detected

- Category: panel-hierarchy
- Route: `atlas`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/atlas-dark.png`
- Details: 40/58 panel-like surfaces have weak background, border, or shadow separation. Observed in 14 screenshots.

### VQA-016 — Text contrast failures detected against rendered surfaces

- Category: text-contrast
- Route: `atlas`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/atlas-dark.png`
- Details: 47/270 text samples failed WCAG-style contrast thresholds. Worst sampled ratio: 1.21:1. Observed in 14 screenshots.

### VQA-017 — Unreadable graph labels detected

- Category: graph-prominence
- Route: `broch-sphere`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/broch-sphere-dark.png`
- Details: 0 SVG labels below 10px; 13 label overlaps detected. Observed in 14 screenshots.

### VQA-018 — Mobile/tablet interactive targets below comfortable size

- Category: mobile-tablet-adaptation
- Route: `broch-sphere`
- Theme / viewport: `both` / `multiple`
- Occurrences: 4
- Affected viewports: `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/mobile-390/broch-sphere-dark.png`
- Details: 22 interactive targets with text are smaller than the audit floor. Observed in 4 screenshots.

### VQA-019 — Weak panel separation detected

- Category: panel-hierarchy
- Route: `broch-sphere`
- Theme / viewport: `both` / `multiple`
- Occurrences: 4
- Affected viewports: `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/mobile-390/broch-sphere-dark.png`
- Details: 14/31 panel-like surfaces have weak background, border, or shadow separation. Observed in 4 screenshots.

### VQA-020 — Text contrast failures detected against rendered surfaces

- Category: text-contrast
- Route: `broch-sphere`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/broch-sphere-dark.png`
- Details: 6/94 text samples failed WCAG-style contrast thresholds. Worst sampled ratio: 1.25:1. Observed in 14 screenshots.

### VQA-021 — Hierarchy degrades in light mode compared with dark mode

- Category: light-dark-consistency
- Route: `home`
- Theme / viewport: `both` / `multiple`
- Occurrences: 7
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/home-light.png`
- Details: Light mode adds 14 contrast failures, 0 weak panels, and 0 floating annotations versus dark mode. Observed in 7 screenshots.

### VQA-022 — Mobile/tablet interactive targets below comfortable size

- Category: mobile-tablet-adaptation
- Route: `home`
- Theme / viewport: `both` / `multiple`
- Occurrences: 4
- Affected viewports: `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/mobile-390/home-dark.png`
- Details: 6 interactive targets with text are smaller than the audit floor. Observed in 4 screenshots.

### VQA-023 — Weak panel separation detected

- Category: panel-hierarchy
- Route: `home`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/home-dark.png`
- Details: 41/65 panel-like surfaces have weak background, border, or shadow separation. Observed in 14 screenshots.

### VQA-024 — Text contrast failures detected against rendered surfaces

- Category: text-contrast
- Route: `home`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/home-dark.png`
- Details: 8/211 text samples failed WCAG-style contrast thresholds. Worst sampled ratio: 1.1:1. Observed in 14 screenshots.

### VQA-025 — Mobile/tablet interactive targets below comfortable size

- Category: mobile-tablet-adaptation
- Route: `media`
- Theme / viewport: `both` / `multiple`
- Occurrences: 4
- Affected viewports: `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/mobile-390/media-dark.png`
- Details: 6 interactive targets with text are smaller than the audit floor. Observed in 4 screenshots.

### VQA-026 — Weak panel separation detected

- Category: panel-hierarchy
- Route: `media`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/media-dark.png`
- Details: 30/31 panel-like surfaces have weak background, border, or shadow separation. Observed in 14 screenshots.

### VQA-027 — Text contrast failures detected against rendered surfaces

- Category: text-contrast
- Route: `media`
- Theme / viewport: `dark` / `multiple`
- Occurrences: 7
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/media-dark.png`
- Details: 3/97 text samples failed WCAG-style contrast thresholds. Worst sampled ratio: 1.1:1. Observed in 7 screenshots.

### VQA-028 — Mobile/tablet interactive targets below comfortable size

- Category: mobile-tablet-adaptation
- Route: `observatory-force-graph`
- Theme / viewport: `both` / `multiple`
- Occurrences: 4
- Affected viewports: `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/mobile-390/observatory-force-graph-dark.png`
- Details: 9 interactive targets with text are smaller than the audit floor. Observed in 4 screenshots.

### VQA-029 — Weak panel separation detected

- Category: panel-hierarchy
- Route: `observatory-force-graph`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-force-graph-dark.png`
- Details: 3/6 panel-like surfaces have weak background, border, or shadow separation. Observed in 14 screenshots.

### VQA-030 — Text contrast failures detected against rendered surfaces

- Category: text-contrast
- Route: `observatory-force-graph`
- Theme / viewport: `dark` / `multiple`
- Occurrences: 6
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-force-graph-dark.png`
- Details: 1/20 text samples failed WCAG-style contrast thresholds. Worst sampled ratio: 1.1:1. Observed in 6 screenshots.

### VQA-031 — Mobile/tablet interactive targets below comfortable size

- Category: mobile-tablet-adaptation
- Route: `observatory-fractal-inspiration`
- Theme / viewport: `both` / `multiple`
- Occurrences: 4
- Affected viewports: `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/mobile-390/observatory-fractal-inspiration-dark.png`
- Details: 9 interactive targets with text are smaller than the audit floor. Observed in 4 screenshots.

### VQA-032 — Weak panel separation detected

- Category: panel-hierarchy
- Route: `observatory-fractal-inspiration`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-fractal-inspiration-dark.png`
- Details: 3/4 panel-like surfaces have weak background, border, or shadow separation. Observed in 14 screenshots.

### VQA-033 — Text contrast failures detected against rendered surfaces

- Category: text-contrast
- Route: `observatory-fractal-inspiration`
- Theme / viewport: `dark` / `multiple`
- Occurrences: 6
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-fractal-inspiration-dark.png`
- Details: 1/17 text samples failed WCAG-style contrast thresholds. Worst sampled ratio: 1.1:1. Observed in 6 screenshots.

### VQA-034 — Hierarchy degrades in light mode compared with dark mode

- Category: light-dark-consistency
- Route: `observatory-higher-dimensional`
- Theme / viewport: `both` / `multiple`
- Occurrences: 7
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-higher-dimensional-light.png`
- Details: Light mode adds 10 contrast failures, 0 weak panels, and 0 floating annotations versus dark mode. Observed in 7 screenshots.

### VQA-035 — Mobile/tablet interactive targets below comfortable size

- Category: mobile-tablet-adaptation
- Route: `observatory-higher-dimensional`
- Theme / viewport: `both` / `multiple`
- Occurrences: 4
- Affected viewports: `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/mobile-390/observatory-higher-dimensional-dark.png`
- Details: 30 interactive targets with text are smaller than the audit floor. Observed in 4 screenshots.

### VQA-036 — Weak panel separation detected

- Category: panel-hierarchy
- Route: `observatory-higher-dimensional`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-higher-dimensional-dark.png`
- Details: 18/22 panel-like surfaces have weak background, border, or shadow separation. Observed in 14 screenshots.

### VQA-037 — Text contrast failures detected against rendered surfaces

- Category: text-contrast
- Route: `observatory-higher-dimensional`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-higher-dimensional-dark.png`
- Details: 15/110 text samples failed WCAG-style contrast thresholds. Worst sampled ratio: 1.12:1. Observed in 14 screenshots.

### VQA-038 — Mobile/tablet interactive targets below comfortable size

- Category: mobile-tablet-adaptation
- Route: `observatory-poisson-dot`
- Theme / viewport: `both` / `multiple`
- Occurrences: 4
- Affected viewports: `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/mobile-390/observatory-poisson-dot-dark.png`
- Details: 11 interactive targets with text are smaller than the audit floor. Observed in 4 screenshots.

### VQA-039 — Weak panel separation detected

- Category: panel-hierarchy
- Route: `observatory-poisson-dot`
- Theme / viewport: `both` / `multiple`
- Occurrences: 10
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `tablet-768`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-poisson-dot-dark.png`
- Details: 4/11 panel-like surfaces have weak background, border, or shadow separation. Observed in 10 screenshots.

### VQA-040 — Text contrast failures detected against rendered surfaces

- Category: text-contrast
- Route: `observatory-poisson-dot`
- Theme / viewport: `both` / `multiple`
- Occurrences: 13
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-poisson-dot-dark.png`
- Details: 9/41 text samples failed WCAG-style contrast thresholds. Worst sampled ratio: 1.45:1. Observed in 13 screenshots.

### VQA-041 — Mobile/tablet interactive targets below comfortable size

- Category: mobile-tablet-adaptation
- Route: `observatory-quaternion`
- Theme / viewport: `both` / `multiple`
- Occurrences: 4
- Affected viewports: `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/mobile-390/observatory-quaternion-dark.png`
- Details: 11 interactive targets with text are smaller than the audit floor. Observed in 4 screenshots.

### VQA-042 — Weak panel separation detected

- Category: panel-hierarchy
- Route: `observatory-quaternion`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-quaternion-dark.png`
- Details: 8/10 panel-like surfaces have weak background, border, or shadow separation. Observed in 14 screenshots.

### VQA-043 — Text contrast failures detected against rendered surfaces

- Category: text-contrast
- Route: `observatory-quaternion`
- Theme / viewport: `both` / `multiple`
- Occurrences: 13
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-quaternion-dark.png`
- Details: 2/32 text samples failed WCAG-style contrast thresholds. Worst sampled ratio: 1.63:1. Observed in 13 screenshots.

### VQA-044 — Mobile/tablet interactive targets below comfortable size

- Category: mobile-tablet-adaptation
- Route: `observatory-resonance-spheres`
- Theme / viewport: `both` / `multiple`
- Occurrences: 4
- Affected viewports: `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/mobile-390/observatory-resonance-spheres-dark.png`
- Details: 10 interactive targets with text are smaller than the audit floor. Observed in 4 screenshots.

### VQA-045 — Weak panel separation detected

- Category: panel-hierarchy
- Route: `observatory-resonance-spheres`
- Theme / viewport: `both` / `multiple`
- Occurrences: 10
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-resonance-spheres-dark.png`
- Details: 3/8 panel-like surfaces have weak background, border, or shadow separation. Observed in 10 screenshots.

### VQA-046 — Text contrast failures detected against rendered surfaces

- Category: text-contrast
- Route: `observatory-resonance-spheres`
- Theme / viewport: `both` / `multiple`
- Occurrences: 13
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-resonance-spheres-dark.png`
- Details: 4/27 text samples failed WCAG-style contrast thresholds. Worst sampled ratio: 1.63:1. Observed in 13 screenshots.

### VQA-047 — Unreadable graph labels detected

- Category: graph-prominence
- Route: `observatory-transport-sphere`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-transport-sphere-dark.png`
- Details: 8 SVG labels below 10px; 2 label overlaps detected. Observed in 14 screenshots.

### VQA-048 — Mobile/tablet interactive targets below comfortable size

- Category: mobile-tablet-adaptation
- Route: `observatory-transport-sphere`
- Theme / viewport: `both` / `multiple`
- Occurrences: 4
- Affected viewports: `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/mobile-390/observatory-transport-sphere-dark.png`
- Details: 9 interactive targets with text are smaller than the audit floor. Observed in 4 screenshots.

### VQA-049 — Weak panel separation detected

- Category: panel-hierarchy
- Route: `observatory-transport-sphere`
- Theme / viewport: `both` / `multiple`
- Occurrences: 10
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-transport-sphere-dark.png`
- Details: 2/5 panel-like surfaces have weak background, border, or shadow separation. Observed in 10 screenshots.

### VQA-050 — Text contrast failures detected against rendered surfaces

- Category: text-contrast
- Route: `observatory-transport-sphere`
- Theme / viewport: `dark` / `multiple`
- Occurrences: 7
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-transport-sphere-dark.png`
- Details: 2/30 text samples failed WCAG-style contrast thresholds. Worst sampled ratio: 1.1:1. Observed in 7 screenshots.

### VQA-051 — Hierarchy degrades in light mode compared with dark mode

- Category: light-dark-consistency
- Route: `observatory`
- Theme / viewport: `both` / `multiple`
- Occurrences: 7
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-light.png`
- Details: Light mode adds 24 contrast failures, 0 weak panels, and 0 floating annotations versus dark mode. Observed in 7 screenshots.

### VQA-052 — Mobile/tablet interactive targets below comfortable size

- Category: mobile-tablet-adaptation
- Route: `observatory`
- Theme / viewport: `both` / `multiple`
- Occurrences: 4
- Affected viewports: `mobile-390`, `tablet-768`
- Screenshot: `visual-qa/2026-06-22/mobile-390/observatory-dark.png`
- Details: 11 interactive targets with text are smaller than the audit floor. Observed in 4 screenshots.

### VQA-053 — Weak panel separation detected

- Category: panel-hierarchy
- Route: `observatory`
- Theme / viewport: `both` / `mobile-390`
- Occurrences: 2
- Affected viewports: `mobile-390`
- Screenshot: `visual-qa/2026-06-22/mobile-390/observatory-dark.png`
- Details: 10/30 panel-like surfaces have weak background, border, or shadow separation. Observed in 2 screenshots.

### VQA-054 — Text contrast failures detected against rendered surfaces

- Category: text-contrast
- Route: `observatory`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-dark.png`
- Details: 26/130 text samples failed WCAG-style contrast thresholds. Worst sampled ratio: 1.63:1. Observed in 14 screenshots.

## MEDIUM

### VQA-055 — Primary graph or canvas is visually under-prominent

- Category: graph-prominence
- Route: `broch-sphere`
- Theme / viewport: `both` / `ultra-2560`
- Occurrences: 2
- Affected viewports: `ultra-2560`
- Screenshot: `visual-qa/2026-06-22/ultra-2560/broch-sphere-dark.png`
- Details: Largest SVG/canvas occupies 12.9% of the viewport. Observed in 2 screenshots.

### VQA-056 — Unreadable graph labels detected

- Category: graph-prominence
- Route: `home`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/home-dark.png`
- Details: 12 SVG labels below 10px; 0 label overlaps detected. Observed in 14 screenshots.

### VQA-057 — Primary graph or canvas is visually under-prominent

- Category: graph-prominence
- Route: `observatory-fractal-inspiration`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-fractal-inspiration-dark.png`
- Details: Largest SVG/canvas occupies 0.1% of the viewport. Observed in 14 screenshots.

### VQA-058 — Primary graph or canvas is visually under-prominent

- Category: graph-prominence
- Route: `observatory-higher-dimensional`
- Theme / viewport: `both` / `mobile-390`
- Occurrences: 2
- Affected viewports: `mobile-390`
- Screenshot: `visual-qa/2026-06-22/mobile-390/observatory-higher-dimensional-dark.png`
- Details: Largest SVG/canvas occupies 15.9% of the viewport. Observed in 2 screenshots.

### VQA-059 — Unreadable graph labels detected

- Category: graph-prominence
- Route: `observatory-higher-dimensional`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-higher-dimensional-dark.png`
- Details: 12 SVG labels below 10px; 0 label overlaps detected. Observed in 14 screenshots.

### VQA-060 — Floating annotation text lacks dedicated surfaces

- Category: annotation-plate-coverage
- Route: `observatory-poisson-dot`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-poisson-dot-dark.png`
- Details: 11 annotation-like labels appear without a nearby plate. Coverage: 72%. Observed in 14 screenshots.

### VQA-061 — Hierarchy degrades in light mode compared with dark mode

- Category: light-dark-consistency
- Route: `observatory-poisson-dot`
- Theme / viewport: `both` / `multiple`
- Occurrences: 7
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-poisson-dot-light.png`
- Details: Light mode adds 9 contrast failures, 0 weak panels, and 0 floating annotations versus dark mode. Observed in 7 screenshots.

### VQA-062 — Primary graph or canvas is visually under-prominent

- Category: graph-prominence
- Route: `observatory-quaternion`
- Theme / viewport: `both` / `multiple`
- Occurrences: 4
- Affected viewports: `mobile-390`, `ultra-2560`
- Screenshot: `visual-qa/2026-06-22/mobile-390/observatory-quaternion-dark.png`
- Details: Largest SVG/canvas occupies 15.9% of the viewport. Observed in 4 screenshots.

### VQA-063 — Floating annotation text lacks dedicated surfaces

- Category: annotation-plate-coverage
- Route: `observatory-resonance-spheres`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-resonance-spheres-dark.png`
- Details: 5 annotation-like labels appear without a nearby plate. Coverage: 71%. Observed in 14 screenshots.

### VQA-064 — Unreadable graph labels detected

- Category: graph-prominence
- Route: `observatory-resonance-spheres`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-resonance-spheres-dark.png`
- Details: 4 SVG labels below 10px; 0 label overlaps detected. Observed in 14 screenshots.

### VQA-065 — Primary graph or canvas is visually under-prominent

- Category: graph-prominence
- Route: `observatory-resonance-spheres`
- Theme / viewport: `both` / `multiple`
- Occurrences: 4
- Affected viewports: `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/ultra-2560/observatory-resonance-spheres-dark.png`
- Details: Largest SVG/canvas occupies 16.2% of the viewport. Observed in 4 screenshots.

### VQA-066 — Floating annotation text lacks dedicated surfaces

- Category: annotation-plate-coverage
- Route: `observatory`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-dark.png`
- Details: 5 annotation-like labels appear without a nearby plate. Coverage: 88%. Observed in 14 screenshots.

### VQA-067 — Unreadable graph labels detected

- Category: graph-prominence
- Route: `observatory`
- Theme / viewport: `both` / `multiple`
- Occurrences: 14
- Affected viewports: `desktop-1440`, `laptop-1366`, `laptop-sm-1024`, `mobile-390`, `tablet-768`, `ultra-2560`, `wide-1920`
- Screenshot: `visual-qa/2026-06-22/desktop-1440/observatory-dark.png`
- Details: 4 SVG labels below 10px; 0 label overlaps detected. Observed in 14 screenshots.

## LOW

No findings.
