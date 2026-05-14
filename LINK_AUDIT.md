# LINK_AUDIT.md
_Generated 2026-05-12 — run `npm run audit:links` to regenerate_

---

## Summary

| Category | Count |
|---|---|
| Internal route links | 12 |
| Hash anchor links | 14 |
| External URLs | 26 |
| Asset paths | 1 |
| Dynamic refs (API/user data) | 8 |
| Placeholders found | 0 |
| Seed/test data URLs | 14 |

---

## Fixed in this audit

- **SubsystemsRail `/dashboard` link** — was a plain `<a href="/dashboard">` causing a full page reload in the SPA. Fixed to use React Router `<Link to="/dashboard">` for client-side navigation. (`src/pages/Index.tsx`)

---

## Broken internal routes

_(none — all internal routes resolve)_

## Broken hash anchors

_(none — all hash anchors match known section IDs)_

## Intentionally placeholder / disabled links

_(none — no `href="#"`, `javascript:void(0)`, or empty hrefs found)_

---

## Internal routes (all verified)

| Route | File | Notes |
|---|---|---|
| `/` | AppHeader, NotFound, ProjectDetail | Index page — public |
| `/auth` | AppHeader, EvidenceVault | Auth page — Google OAuth |
| `/dashboard` | AppHeader, Index, SeeingIsNotOpeningYourEyes | Protected by RequireAuth |
| `/projects/:id` | Dashboard → ProjectDetail | Protected by RequireAuth |

All routes are registered in `src/App.tsx`. The `*` catch-all renders `NotFound.tsx`.

---

## Hash anchors (all verified)

| Anchor | Points to `id=` | Exists? | File |
|---|---|---|---|
| `#atlas` | `FractalInspirationAtlas.tsx:412` | Yes | AppHeader, SubsystemsRail |
| `#evidence-vault` | `Index.tsx:728` | Yes | AppHeader, SubsystemsRail, Index hero, SeeingIsNotOpeningYourEyes |
| `#research-notes` | `Index.tsx:745` | Yes | AppHeader, SubsystemsRail |
| `#media-lab` | `Index.tsx:809` | Yes | AppHeader, SubsystemsRail |
| `#xprimeray` | `Index.tsx:582` | Yes | SubsystemsRail |
| `#signals` | `Index.tsx:1236` | Yes | No nav link — section exists, not linked from nav |
| `#portals` | `Index.tsx:702` | Yes | No nav link — section exists, not linked from nav |
| `id="inspiration"` | `Index.tsx:547` | Orphaned | No link points here; nav links to `#atlas` inside this wrapper |

---

## External links (could not be verified programmatically)

### xPRIMEray / GitHub Pages

| URL | Status | Note |
|---|---|---|
| `https://aethertopologist.github.io/GD_xPRIMEray/` | Verified live | xPRIMEray main docs — used in hero, nav, xPRIMEray section, portals |
| `https://aethertopologist.github.io/GD_xPRIMEray/Research/transport_island_microscopy/` | Verified live | Transport Island Microscopy portal |
| `https://aethertopologist.github.io/GD_xPRIMEray/Research/cathedral_probe_architecture/` | **Unverified** | Cathedral Probe Architecture — page may not exist yet |
| `https://aethertopologist.github.io/GD_xPRIMEray/#current-milestone-curved-field-validation-ladder` | **Unverified** | Hash anchor on live site — depends on section presence |
| `https://github.com/AetherTopologist/GD_xPRIMEray` | Likely live | GitHub repository — used in hero, nav, xPRIMEray section, media lab |

### Inspiration nodes (Wikipedia + personal sites)

| URL | Status |
|---|---|
| `https://en.wikipedia.org/wiki/Isaac_Asimov` | Live |
| `https://en.wikipedia.org/wiki/Roger_Penrose` | Live |
| `https://en.wikipedia.org/wiki/Euclid` | Live |
| `https://en.wikipedia.org/wiki/Emmy_Noether` | Live |
| `https://en.wikipedia.org/wiki/Henri_Poincar%C3%A9` | Live |
| `https://en.wikipedia.org/wiki/David_Hilbert` | Live |
| `https://en.wikipedia.org/wiki/Richard_Feynman` | Live |
| `https://ewintang.com/` | Assumed live |
| `https://en.wikipedia.org/wiki/Claude_Shannon` | Live |
| `https://en.wikipedia.org/wiki/John_Carmack` | Live |
| `https://iquilezles.org/` | Assumed live |
| `https://en.wikipedia.org/wiki/Ken_Perlin` | Live |
| `https://www.blender.org/` | Live |
| `https://en.wikipedia.org/wiki/Karl_Friston` | Live |
| `https://en.wikipedia.org/wiki/Douglas_Hofstadter` | Live |
| `https://en.wikipedia.org/wiki/Anirban_Bandyopadhyay` | Live |
| `https://en.wikipedia.org/wiki/Buckminster_Fuller` | Live |
| `https://en.wikipedia.org/wiki/Arthur_C._Clarke` | Live |
| `https://en.wikipedia.org/wiki/Stanis%C5%82aw_Lem` | Live |

### FractalInspirationAtlas

| URL | Status |
|---|---|
| `https://www.youtube.com/@3blue1brown` | Assumed live |

### Metadata / OG

| URL | Status | Note |
|---|---|---|
| `https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/915e99b5-...` | **Unverified** | Lovable CDN OG image — may not be permanent |

---

## Asset paths (all verified)

| Import | File | Exists? |
|---|---|---|
| `@/assets/hero-curved-transport.jpg` | `src/pages/Index.tsx:27` | Yes — `src/assets/hero-curved-transport.jpg` (286 KB) |

---

## Dynamic references (API-derived or user-provided)

These cannot be statically verified — they come from Supabase records or GitHub API responses at runtime.

| Ref | Source | File |
|---|---|---|
| `href={link.url}` | User-provided evidence URL | ProjectDetail.tsx, EvidenceVault.tsx |
| `href={snapshot.html_url}` | GitHub API | EvidenceVault.tsx |
| `href={meta.html_url}` | GitHub API | EvidenceVault.tsx |
| `href={item.github_repo_url}` | Supabase record | EvidenceVault.tsx |
| `href={draft.github_repo_url}` | Supabase record | ProjectDetail.tsx |
| `src={preview.raw_url}` | GitHub API | EvidenceGallery.tsx, GithubImageScanDialog.tsx |
| `href={preview.blob_url}` | GitHub API | EvidenceGallery.tsx, GithubImageScanDialog.tsx |
| `href={project.github_snapshot.html_url}` | Supabase + GitHub API | ProjectDetail.tsx |

---

## Seed / test data URLs (intentional — `src/lib/seed.ts`)

These are placeholder URLs used for development seeding. Not real destinations.

- `https://github.com/xprime/xprimeray`
- `https://github.com/xprime/portal`
- `https://example.com/spec`, `/render`, `/run14`, `/outline`, `/lh`, `/scenes`, `/run21`, `/lookdev`, `/bench-v2`, `/grin-sweep`, `/throat-notes`, `/wh-addon`
- `https://staging.example.com`

---

## Recommended next fixes

1. **Cathedral Probe portal card** — The URL `https://aethertopologist.github.io/GD_xPRIMEray/Research/cathedral_probe_architecture/` is unverified. Consider changing the portal status to `"coming-soon"` until the page is confirmed live, or remove the `href` until then.

2. **OG image CDN** — Replace the Lovable CDN OG image with a self-hosted file in `public/og-image.jpg` when one is available. Update `index.html` meta tags to point to the self-hosted path.

3. **Orphaned `id="inspiration"`** — The `<div id="inspiration">` wrapper around `<FractalInspirationAtlas />` in `Index.tsx:547` is unused for navigation (all links use `#atlas` which lives inside the component). It can be removed without functional impact to reduce confusion.

4. **Signals section nav link** — The `#signals` section has no entry in the AppHeader nav. Consider adding it between "Atlas" and "Archive" if discovery of the Inspirations section is a priority.
