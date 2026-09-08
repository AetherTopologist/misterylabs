# Public UI verification — remove misleading Mission Control CTA

Message: `fix(public): remove misleading Mission Control CTA`

Authorized M1 scope correction: owning file is `src/components/SeeingIsNotOpeningYourEyes.tsx`, not `src/pages/Index.tsx`.

## Routes

Captured against local `vite preview` with production basename `/misterylabs/`:

- `/misterylabs/` (Home, scrolled to Seeing Is Not Opening Your Eyes CTA)
- `/misterylabs/mission` (direct-route verification; not a visual-QA witness)

## Viewports

| File | Size | Source |
|---|---|---|
| `before/mobile-390.png` | 390×844 | local `vite preview` of unpatched parent `a17d807` |
| `before/desktop-1440.png` | 1440×900 | local `vite preview` of unpatched parent `a17d807` |
| `after/mobile-390.png` | 390×844 | local `vite preview` of this commit |
| `after/desktop-1440.png` | 1440×900 | local `vite preview` of this commit |

Production basename: `/misterylabs/`.

## What changed

Removed the outline Home CTA labeled **Enter MisterY Labs** linking to `/mission` from `SeeingIsNotOpeningYourEyes`. Dropped the unused `Telescope` import. **Explore the Vault** (`/archive`) and all other section copy/layout remain unchanged.

## What was verified

- Home locator count for `Enter MisterY Labs` → `/mission`: before 1, after 0 (mobile and desktop)
- Home locator count for `Explore the Vault` → `/archive`: 1 both before and after
- `/mission` direct URL: HTTP 200, renders Mission Control, no login wall
- No new console / page errors on Home or `/mission`
- Mobile 390×844 and desktop 1440×900 CTA layouts remain coherent after removal

## What was not verified

- Live GitHub Pages after deploy
- Light theme
- M2 Transport Sphere chip clipping (deferred)

## Deferred findings (not fixed)

- `src/pages/NotFound.tsx` still lists `{ to: "/mission", label: "Mission" }` in 404 recovery links
- Pre-existing Mission Control header overlap between the sticky site header and the dashboard title band (not introduced here)
