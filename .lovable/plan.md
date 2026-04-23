

## xPRIME Lab — Density & Operations Refinement

Goal: tighten the dashboard into a high-density engineering console with multiple work views (grid/compact/kanban) and a milestone timeline, while preserving the indigo/dark design system.

### 1. Compress the hero into an "Ops Status Bar"

Replace the current 14–20 vh hero with a single compact band (~`py-6`) styled like a console header:

- Left: small pulse + `MISSION CONTROL // STATUS NOMINAL` label, then a single-line tagline (no large H1).
- Right: inline KPIs as a horizontal strip — `TOTAL · BUILDING · BLOCKED · READY · LAUNCHED · AVG PROGRESS` with mono tabular numerals, dividers between metrics, and tiny sparkline-style accent bars under each value.
- Keep the subtle grid background and indigo glow, but at ~40% of current vertical space.
- Drop the oversized 4-card stat grid; the strip replaces it.

### 2. Sticky toolbar with view switcher

Upgrade the filter bar (still sticky under the header) into one dense row:

```text
[ search ........... ]  [Status: chips]  [Category: chips]  [Priority: chips]  | [Grid][Compact][Kanban][Timeline] [↕ Sort] [Clear]
```

- Add a **Priority** filter group (currently missing).
- Add a **Sort** dropdown: Updated, Milestone, Priority, Progress.
- Add a **View switcher** (segmented control, persisted to localStorage): `Grid · Compact · Kanban`.
- Add a `Density` toggle (Comfortable/Compact) that affects card padding when in Grid view.
- Filter chips become smaller (`text-[11px]`, `py-0.5`), single horizontal row that scrolls on overflow.

### 3. Card refinements (Grid view)

Tighten `ProjectCard.tsx`:
- Reduce padding `p-5 → p-4`, radius `rounded-2xl → rounded-xl`.
- Move category + status into a single mono header row with a left status color bar (4px vertical accent in the status hue) for instant scannability.
- Inline progress: replace separate "Progress" label with a thin 2px bar at the very bottom of the card (full-bleed) + percentage in header row.
- Collapse "Next action" box into a single bordered line with a `→` glyph, no inner card.
- Footer condensed to one row: priority dot · confidence dot · tags (max 2 + `+N`) · `updated 2h ago`.

### 4. New: Compact view (table-like rows)

A dense list mode rendering each project as a single row:

```text
█  TITLE                         CATEGORY    STATUS      PRI   CONF   ▓▓▓▓░ 62%   NEXT: ship v2 prototype       2h
```

- Built as a CSS grid with `grid-template-columns` for perfect column alignment.
- Hover reveals chevron; click opens detail.
- ~3× more projects visible per viewport than Grid.

### 5. New: Kanban view grouped by status

- Horizontal scrolling board with one column per `Status` (7 columns).
- Each column header: status name, count badge, status hue accent strip on top.
- Cards inside columns are mini versions (title, priority dot, progress bar, next action one-liner).
- Columns get a subtle bg tint matching status hue at ~5% opacity.
- No drag-and-drop in this iteration (keeps scope tight); clicking opens detail page where status can be changed. Note added in plan that DnD can be a follow-up.

### 6. New: Milestone Timeline section

A horizontal scroll strip rendered above the project views (collapsible, default open):

- Header: `UPCOMING MILESTONES // NEXT 60 DAYS`, with a count and a "show all" toggle.
- Body: horizontal track with date ticks (Today, +7d, +14d, +30d, +60d) and project chips positioned by `milestone_date`.
- Each chip: status hue dot, title (truncate), days-until pill (`T-3d`, `OVERDUE`, `T+12d` in red/amber/green semantics).
- Overdue items pinned at the left in a separate "OVERDUE" lane with destructive accent.
- Empty state: muted "No milestones in window" line.
- Hidden when current view is Kanban (to keep board full-height) — toggle remains accessible.

### 7. Console aesthetic touches (no token changes)

- Add a subtle 1px top accent line on the page (`bg-gradient-to-r from-transparent via-primary/40 to-transparent`) directly under the header to read as a "system bar".
- Replace footer text with a status line: `xPRIME LAB v0.1 · LOCAL LOG · {n} entries · last sync {timeAgo}`.
- Use mono labels (`text-[10px] uppercase tracking-[0.25em]`) consistently for section headers; reduce decorative gradient text to the wordmark only.

### Technical details

- **New file** `src/components/ProjectCardCompact.tsx` — single-row layout for Compact view.
- **New file** `src/components/KanbanBoard.tsx` — renders columns from `STATUSES`, groups filtered projects by status.
- **New file** `src/components/MilestoneTimeline.tsx` — pure render from filtered projects with `milestone_date`; computes day offsets via `date-fns` (already in project) or native `Date`.
- **New file** `src/components/OpsStatusBar.tsx` — compressed hero strip with KPI metrics.
- **Edit** `src/pages/Index.tsx`:
  - Add `view: "grid" | "compact" | "kanban"`, `density`, `sort`, `priorityFilter` state.
  - Persist `view` and `density` to `localStorage` under keys `xprime:view` / `xprime:density`.
  - Replace hero with `<OpsStatusBar stats={...} />`.
  - Render `<MilestoneTimeline projects={filtered} />` above the view area (hidden in Kanban).
  - Conditionally render `Grid | Compact | Kanban`.
- **Edit** `src/components/ProjectCard.tsx` — tighten spacing, add status accent bar, compact footer; accept optional `density` prop.
- **Edit** `src/components/Badges.tsx` only if needed for new `PriorityDot` / `ConfidenceDot` mini variants (additive, no breaking changes).
- **No design token changes** — reuse existing `--status-*`, `--primary`, gradients, and shadow utilities.
- **No data model changes** — works with existing `Project` schema and seed data.
- Keep all interactions accessible: view switcher uses `role="tablist"`, segmented buttons get `aria-pressed`.

### Out of scope (call-outs)

- Drag-and-drop on Kanban (follow-up).
- Cloud persistence / multi-user (architecture already supports later upgrade).
- Editing milestone date directly from timeline (detail page remains the editor).

