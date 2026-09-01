# Agent Instructions

Read Docs/public/MISTERY_LABS_PUBLIC_CHARTER.md before public-facing work.

## Authority

xPRIMEray engine semantics are upstream and read-only unless the task
explicitly authorizes engine changes.

## Working behavior

Prefer small, reviewable changes.

For new interactive demonstrations:
1. preserve provenance;
2. design mobile-first;
3. create one obvious manipulation;
4. provide immediate visual feedback;
5. keep explanatory text secondary;
6. test narrow mobile viewport;
7. report files changed and assumptions made.

Do not merge speculative experiments into authoritative engine documentation.

Do not silently rewrite site information architecture.

When uncertain about provenance, scientific interpretation, or engine
semantics, record the uncertainty rather than inventing an answer.

## Public UI verification

After any public-facing UI change, store commit-addressable evidence at:

    reports/visual-qa/public/<shortsha>-<task-slug>/
      before/mobile-390.png
      before/desktop-1440.png
      after/mobile-390.png
      after/desktop-1440.png
      report.md

Minimum viewports: 390×844 and 1440×900.
Use the production basename `/misterylabs/`.
Do not re-run the app to inspect a past change; read that folder.

Historical captures in `docs/visual-audit/` and
`reports/visual-qa/2026-06-22/` are frozen provenance.
Do not add new files there.
Do not treat a 7-viewport × 12-route sweep as a public-UI commit archive.
