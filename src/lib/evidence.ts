import { useSyncExternalStore } from "react";

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
