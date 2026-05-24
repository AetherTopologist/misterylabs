# MisterY Labs

Public observatory site for MisterY Labs — home of curved optical transport research and the xPRIMEray instrumentation project.

Live: https://aethertopologist.github.io/misterylabs/

## Stack

- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (auth + Edge Functions)
- Deployed to GitHub Pages via GitHub Actions

## Local dev

```bash
npm install
npm run dev        # http://localhost:8080
```

Requires a `.env` file (not committed — see `.env` locally or ask the project owner):

```
VITE_SUPABASE_URL=https://gddwvfgraqmefrrreto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key from Supabase dashboard>
```

## Deploy

Pushes to `main` trigger the GitHub Actions workflow (`.github/workflows/deploy.yml`).
The workflow reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from
GitHub Repository Secrets — add both under Settings → Secrets and variables → Actions.
