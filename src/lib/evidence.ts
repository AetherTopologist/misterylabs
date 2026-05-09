import { supabase } from "@/integrations/supabase/client";
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

/* ---------------- Read-only GitHub scanner (server-side token) ---------------- */

export interface ScannedRepo {
  full_name: string;
  name: string;
  owner: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  pushed_at: string;
  updated_at: string;
  language: string | null;
  topics: string[];
  private: boolean;
  archived: boolean;
  fork: boolean;
  matched_keywords: string[];
}

export interface ScannedRepoDetail extends ScannedRepo {
  default_branch: string;
  readme_summary: string | null;
}

export type ScanError =
  | { kind: "auth"; message: string }
  | { kind: "missing_token"; message: string }
  | { kind: "network"; message: string }
  | { kind: "github"; message: string };

export async function scanGithubRepos(opts: {
  query?: string;
  limit?: number;
  matchedOnly?: boolean;
}): Promise<{ repos: ScannedRepo[]; total_scanned: number } | { error: ScanError }> {
  try {
    const { data, error } = await supabase.functions.invoke("github-scan", {
      body: { action: "list", ...opts },
    });
    if (error) return { error: { kind: "network", message: error.message } };
    if (data?.error === "missing_token")
      return { error: { kind: "missing_token", message: data.message ?? "Token missing" } };
    if (data?.error === "auth")
      return { error: { kind: "auth", message: "GitHub token rejected (401/403)" } };
    if (data?.error) return { error: { kind: "github", message: data.message ?? data.error } };
    return { repos: data.repos ?? [], total_scanned: data.total_scanned ?? 0 };
  } catch (e) {
    return { error: { kind: "network", message: e instanceof Error ? e.message : "unknown" } };
  }
}

export async function fetchScannedRepoDetail(
  owner: string,
  repo: string,
): Promise<{ repo: ScannedRepoDetail } | { error: ScanError }> {
  try {
    const { data, error } = await supabase.functions.invoke("github-scan", {
      body: { action: "meta", owner, repo },
    });
    if (error) return { error: { kind: "network", message: error.message } };
    if (data?.error === "auth")
      return { error: { kind: "auth", message: "GitHub token rejected" } };
    if (data?.error === "missing_token")
      return { error: { kind: "missing_token", message: "Token missing" } };
    if (data?.error) return { error: { kind: "github", message: data.message ?? data.error } };
    return { repo: data.repo as ScannedRepoDetail };
  } catch (e) {
    return { error: { kind: "network", message: e instanceof Error ? e.message : "unknown" } };
  }
}

export function snapshotFromDetail(detail: ScannedRepoDetail): GithubRepoSnapshot {
  return {
    full_name: detail.full_name,
    description: detail.description,
    html_url: detail.html_url,
    pushed_at: detail.pushed_at,
    topics: detail.topics ?? [],
    language: detail.language,
    stargazers_count: detail.stargazers_count,
    readme_summary: detail.readme_summary,
    imported_at: new Date().toISOString(),
  };
}

/* ---------------- Image scanner ---------------- */

export interface ScannedImage {
  filename: string;
  path: string;
  folder: string;
  raw_url: string;
  blob_url: string;
  source: "readme" | "folder";
}

export interface ImageScanResult {
  images: ScannedImage[];
  capped: boolean;
  cap: number;
  branch: string;
  full_name: string;
}

export async function scanRepoImages(
  owner: string,
  repo: string,
): Promise<ImageScanResult | { error: ScanError }> {
  try {
    const { data, error } = await supabase.functions.invoke("github-scan", {
      body: { action: "scan_images", owner, repo },
    });
    if (error) return { error: { kind: "network", message: error.message } };
    if (data?.error === "auth")
      return { error: { kind: "auth", message: "GitHub token rejected" } };
    if (data?.error === "missing_token")
      return { error: { kind: "missing_token", message: "Token missing" } };
    if (data?.error) return { error: { kind: "github", message: data.message ?? data.error } };
    return data as ImageScanResult;
  } catch (e) {
    return { error: { kind: "network", message: e instanceof Error ? e.message : "unknown" } };
  }
}

export function makeAttachedImage(
  scanned: ScannedImage,
  repoFullName: string,
): AttachedImage {
  return {
    id: `img_${Math.random().toString(36).slice(2, 10)}`,
    filename: scanned.filename,
    path: scanned.path,
    folder: scanned.folder,
    raw_url: scanned.raw_url,
    blob_url: scanned.blob_url,
    repo_full_name: repoFullName,
    source: scanned.source,
    imported_at: new Date().toISOString(),
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
