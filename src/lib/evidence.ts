import type { AttachedImage, GithubRepoSnapshot } from "./types";

// Re-export for convenience so consumers can keep importing from one place.
export type { AttachedImage, GithubRepoSnapshot } from "./types";

/* ---------------- GitHub metadata ---------------- */

export interface GithubRepoMeta {
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  pushed_at: string;
  default_branch: string;
}

export function parseGithubRepo(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (!/github\.com$/i.test(u.hostname)) return null;
    const [owner, repo] = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (!owner || !repo) return null;
    return { owner, repo: repo.replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

export async function fetchGithubRepoMeta(url: string): Promise<GithubRepoMeta | null> {
  const parsed = parseGithubRepo(url);
  if (!parsed) return null;
  const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    full_name: data.full_name,
    description: data.description,
    html_url: data.html_url,
    stargazers_count: data.stargazers_count ?? 0,
    language: data.language ?? null,
    pushed_at: data.pushed_at,
    default_branch: data.default_branch ?? "main",
  };
}

/* Placeholder gallery used when no real images are attached yet */
export const PLACEHOLDER_GALLERY: AttachedImage[] = [
  {
    id: "ph_1",
    filename: "curved_ray_demo.png",
    path: "output/wormhole_test/curved_ray_demo.png",
    folder: "output/wormhole_test",
    raw_url: "",
    blob_url: "",
    repo_full_name: "(example)",
    source: "placeholder",
    caption: "Example: import a repo to replace these placeholders",
    imported_at: new Date().toISOString(),
  },
  {
    id: "ph_2",
    filename: "grin_lens_field.png",
    path: "output/fixture_runs/grin_lens_field.png",
    folder: "output/fixture_runs",
    raw_url: "",
    blob_url: "",
    repo_full_name: "(example)",
    source: "placeholder",
    imported_at: new Date().toISOString(),
  },
  {
    id: "ph_3",
    filename: "characterization_ledger.png",
    path: "output/characterization_ledger/sample.png",
    folder: "output/characterization_ledger",
    raw_url: "",
    blob_url: "",
    repo_full_name: "(example)",
    source: "placeholder",
    imported_at: new Date().toISOString(),
  },
];
