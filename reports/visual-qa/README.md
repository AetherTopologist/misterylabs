# Visual QA archive

Canonical location for commit-addressable public UI verification.

This directory is evidence, not site content. GitHub Pages deploys `dist/` only.

## Layout

```
reports/visual-qa/
  README.md
  2026-06-22/                 # FROZEN full-site sweep — do not add files
  public/
    <shortsha>-<task-slug>/
      before/
        mobile-390.png
        desktop-1440.png
      after/
        mobile-390.png
        desktop-1440.png
      report.md
```

## Public-facing UI commits

Store evidence under `reports/visual-qa/public/<shortsha>-<task-slug>/`.

Minimum viewports:

- `mobile-390.png` — 390×844
- `desktop-1440.png` — 1440×900

Capture against the production basename `/misterylabs/`.
Write `report.md` in the same folder: commit, routes, what changed, what was verified, what was not.

Agents inspect that folder instead of re-running the app.

Do not treat a 7-viewport × 12-route × 2-theme sweep as a public-UI commit archive.

## Frozen historical paths

Do not move, rename, modify, deduplicate, or delete:

- `docs/visual-audit/**`
- `reports/visual-qa/2026-06-22/**`
- `reports/visual_qa_report.md`
- `reports/visual_qa_report.json`
- `reports/visual_observatory_audit.md`
- `reports/visual_observatory_audit.json`

`docs/visual-audit/` is the older `capture:screens` archive and the current `release:artifacts` baseline. New public UI evidence does not belong there.

## Full-site sweeps

`npm run visual:qa` and `npm run capture:screens` still write to their historical output paths. Do not point them here until a later, approved generator change. If a new sweep is ever archived under this tree, put the markdown/json report inside the run folder — do not overwrite `reports/visual_qa_report.*`.
