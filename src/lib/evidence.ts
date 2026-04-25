import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GithubRepoSnapshot {
  full_name: string;
  description: string | null;
  html_url: string;
  pushed_at: string;
  topics: string[];
  language: string | null;
  stargazers_count: number;
  readme_summary: string | null;
  imported_at: string;
}

export interface AttachedImage {
  id: string;
  filename: string;
  path: string;
  folder: string;
  raw_url: string;
  blob_url: string;
  repo_full_name: string;
  source: "readme" | "folder" | "placeholder";
  caption?: string;
  imported_at: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  summary: string;
  narrative: string;
  status: string; // e.g. "Validated Prototype"
  technical_category: string; // e.g. "Rendering Engine / GRIN Optics"
  hardware_note: string;
  validation_claim: string;
  next_relevance: string;
  github_repo_url: string;
  github_snapshot?: GithubRepoSnapshot | null;
  attached_images?: AttachedImage[];
  evidence_links: { id: string; label: string; url: string }[];
  artifact_links: { id: string; label: string; url: string }[];
  tags: string[];
  validated_at: string; // ISO
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "xprime-lab.evidence.v1";

const SEED: EvidenceItem[] = [
  {
    id: "ev_luxcoregrin",
    title: "LuxCoreGRIN Curved Ray Tracing Prototype",
    summary:
      "Validated prototype evidence that curved-ray / GRIN-style light transport can be implemented in a production-grade renderer lineage using LuxCoreRender acceleration concepts.",
    narrative:
      "This prototype demonstrated that a basic curved-ray tracing implementation can render at standard image resolution on a local 12-core / 24-thread workstation. It establishes that curved-ray / GRIN rendering is not merely theoretical or visual mockup work, but can be implemented in a real rendering pipeline with acceleration-aware architecture. The result is treated as validated prototype evidence — not a finished production renderer — and directly informs the design direction of the xPRIMEray engine.",
    status: "Validated Prototype",
    technical_category: "Rendering Engine / GRIN Optics",
    hardware_note: "12-core / 24-thread workstation",
    validation_claim:
      "Standard-resolution curved-ray rendering demonstrated end-to-end in a LuxCoreRender-derived pipeline.",
    next_relevance:
      "Informs xPRIMEray engine architecture and downstream Godot / Blender / LuxCore integration research.",
    github_repo_url: "",
    evidence_links: [],
    artifact_links: [],
    tags: ["luxcore", "grin", "curved-ray", "prototype", "rendering"],
    validated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function load(): EvidenceItem[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      return SEED;
    }
    const parsed = JSON.parse(raw) as EvidenceItem[];
    return Array.isArray(parsed) ? parsed : SEED;
  } catch {
    return SEED;
  }
}

let state: EvidenceItem[] = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
function emit() {
  listeners.forEach((l) => l());
}
function setState(next: EvidenceItem[]) {
  state = next;
  persist();
  emit();
}

export const evidenceStore = {
  getAll: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  upsertGithub: (id: string, url: string) => {
    setState(
      state.map((e) =>
        e.id === id
          ? { ...e, github_repo_url: url, updated_at: new Date().toISOString() }
          : e,
      ),
    );
  },
  attachGithubSnapshot: (id: string, snapshot: GithubRepoSnapshot) => {
    setState(
      state.map((e) =>
        e.id === id
          ? {
              ...e,
              github_repo_url: snapshot.html_url,
              github_snapshot: snapshot,
              updated_at: new Date().toISOString(),
            }
          : e,
      ),
    );
  },
  clearGithubSnapshot: (id: string) => {
    setState(
      state.map((e) =>
        e.id === id
          ? { ...e, github_snapshot: null, updated_at: new Date().toISOString() }
          : e,
      ),
    );
  },
  attachImages: (id: string, images: AttachedImage[]) => {
    setState(
      state.map((e) => {
        if (e.id !== id) return e;
        // Drop placeholders + de-dupe by raw_url
        const existing = (e.attached_images ?? []).filter((i) => i.source !== "placeholder");
        const seen = new Set(existing.map((i) => i.raw_url));
        const merged = [...existing];
        for (const img of images) {
          if (seen.has(img.raw_url)) continue;
          seen.add(img.raw_url);
          merged.push(img);
        }
        return { ...e, attached_images: merged, updated_at: new Date().toISOString() };
      }),
    );
  },
  removeImage: (id: string, imageId: string) => {
    setState(
      state.map((e) =>
        e.id === id
          ? {
              ...e,
              attached_images: (e.attached_images ?? []).filter((i) => i.id !== imageId),
              updated_at: new Date().toISOString(),
            }
          : e,
      ),
    );
  },
  updateImageCaption: (id: string, imageId: string, caption: string) => {
    setState(
      state.map((e) =>
        e.id === id
          ? {
              ...e,
              attached_images: (e.attached_images ?? []).map((i) =>
                i.id === imageId ? { ...i, caption } : i,
              ),
              updated_at: new Date().toISOString(),
            }
          : e,
      ),
    );
  },
  update: (id: string, patch: Partial<EvidenceItem>) => {
    setState(
      state.map((e) =>
        e.id === id ? { ...e, ...patch, updated_at: new Date().toISOString() } : e,
      ),
    );
  },
  create: (input: Partial<EvidenceItem> & { title: string }): EvidenceItem => {
    const now = new Date().toISOString();
    const item: EvidenceItem = {
      id: `ev_${Math.random().toString(36).slice(2, 10)}`,
      title: input.title,
      summary: input.summary ?? "",
      narrative: input.narrative ?? "",
      status: input.status ?? "Validated Prototype",
      technical_category: input.technical_category ?? "",
      hardware_note: input.hardware_note ?? "",
      validation_claim: input.validation_claim ?? "",
      next_relevance: input.next_relevance ?? "",
      github_repo_url: input.github_repo_url ?? "",
      evidence_links: input.evidence_links ?? [],
      artifact_links: input.artifact_links ?? [],
      tags: input.tags ?? [],
      validated_at: input.validated_at ?? now,
      created_at: now,
      updated_at: now,
    };
    setState([item, ...state]);
    return item;
  },
  remove: (id: string) => setState(state.filter((e) => e.id !== id)),
};

export function useEvidence(): EvidenceItem[] {
  return useSyncExternalStore(
    (l) => {
      const unsub = evidenceStore.subscribe(l);
      return () => unsub();
    },
    () => state,
    () => state,
  );
}

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
    if (error) {
      return { error: { kind: "network", message: error.message } };
    }
    if (data?.error === "missing_token") {
      return { error: { kind: "missing_token", message: data.message ?? "Token missing" } };
    }
    if (data?.error === "auth") {
      return { error: { kind: "auth", message: "GitHub token rejected (401/403)" } };
    }
    if (data?.error) {
      return { error: { kind: "github", message: data.message ?? data.error } };
    }
    return { repos: data.repos ?? [], total_scanned: data.total_scanned ?? 0 };
  } catch (e) {
    return {
      error: { kind: "network", message: e instanceof Error ? e.message : "unknown" },
    };
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
    if (data?.error)
      return { error: { kind: "github", message: data.message ?? data.error } };
    return { repo: data.repo as ScannedRepoDetail };
  } catch (e) {
    return {
      error: { kind: "network", message: e instanceof Error ? e.message : "unknown" },
    };
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
