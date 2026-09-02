# Public UI verification — retire legacy Supabase auth

Commit: `refactor(public): retire legacy Supabase auth`

## Routes

Captured:

- `/misterylabs/` (Home hero + header)

Also verified locally against Vite `base: '/misterylabs/'` with **no `.env` file**:

- `/misterylabs/`
- `/misterylabs/atlas`
- `/misterylabs/observatory`
- `/misterylabs/observatory/transport-sphere`
- `/misterylabs/broch-sphere`
- `/misterylabs/archive`
- `/misterylabs/research`
- `/misterylabs/media`
- `/misterylabs/mission`
- `/misterylabs/dashboard`
- `/misterylabs/auth` (now NotFound)

## Viewports

| File | Size | Source |
|---|---|---|
| `before/mobile-390.png` | 390×844 | live GitHub Pages before this commit |
| `before/desktop-1440.png` | 1440×900 | live GitHub Pages before this commit |
| `after/mobile-390.png` | 390×844 | local `vite preview` `/misterylabs/`, no `.env` |
| `after/desktop-1440.png` | 1440×900 | local `vite preview` `/misterylabs/`, no `.env` |

Production basename: `/misterylabs/`.

## What changed

Removed GitHub OAuth, AuthProvider, `/auth`, and the Supabase-backed `github-scan` UI. Mission Control routes remain, ungated. Header no longer shows Sign in / session chrome.

## What was verified

- `npm install` and `npm run build` with no `VITE_SUPABASE_*` and no `.env`
- Preview loads at `/misterylabs/`
- Sign in count = 0 on Home and Archive
- `/auth` is NotFound, not a login wall
- `/mission` and `/dashboard` render Mission Control without login
- `misterylabs.projects.v1` still persists after reload
- Dist JS contains no `supabase` strings; zero requests to `*.supabase.co`
- No AuthProvider / session TypeErrors

## What was not verified

- Live GitHub Pages after deploy
- Undeploying the hosted Edge Function (deleting source does not undeploy)
- Light theme
- Decommissioning the external Supabase project (intentionally out of scope)

## Pre-existing errors (not introduced here)

- Observatory / Transport Sphere: `addColorStop` CSS color parse
- Broch Sphere: `Cannot read properties of undefined (reading 'longitude')`
