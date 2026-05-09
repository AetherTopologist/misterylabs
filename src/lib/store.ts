import { useEffect, useMemo, useSyncExternalStore } from "react";
import type {
  AttachedImage,
  GithubRepoSnapshot,
  NewProjectInput,
  Project,
} from "./types";
import { SEED_PROJECTS } from "./seed";

const STORAGE_KEY = "misterylabs.projects.v1";
// Legacy keys to migrate from on first load.
const LEGACY_PROJECTS_KEY = "xprime-lab.projects.v3";
const LEGACY_EVIDENCE_KEY = "xprime-lab.evidence.v1";

/**
 * Best-effort migration: pull existing projects + evidence items from the
 * pre-refactor storage keys and merge them into the unified Research Object
 * shape. Evidence items become projects flagged `is_validated`.
 */
function migrateLegacy(): Project[] | null {
  if (typeof window === "undefined") return null;
  const legacyProjectsRaw = localStorage.getItem(LEGACY_PROJECTS_KEY);
  const legacyEvidenceRaw = localStorage.getItem(LEGACY_EVIDENCE_KEY);
  if (!legacyProjectsRaw && !legacyEvidenceRaw) return null;

  const out: Project[] = [];

  try {
    if (legacyProjectsRaw) {
      const arr = JSON.parse(legacyProjectsRaw) as Project[];
      if (Array.isArray(arr)) out.push(...arr);
    }
  } catch {
    /* ignore */
  }

  try {
    if (legacyEvidenceRaw) {
      const arr = JSON.parse(legacyEvidenceRaw) as any[];
      if (Array.isArray(arr)) {
        for (const e of arr) {
          if (out.some((p) => p.id === e.id)) continue;
          const now = new Date().toISOString();
          out.push({
            id: e.id ?? `prj_${Math.random().toString(36).slice(2, 10)}`,
            title: e.title ?? "Untitled evidence",
            short_summary: e.summary ?? "",
            full_description: e.narrative ?? "",
            category: "Engineering",
            status: "Launched",
            priority: "Medium",
            progress_percent: 100,
            confidence_level: "High",
            next_action: "",
            github_repo_url: e.github_repo_url ?? "",
            github_snapshot: e.github_snapshot ?? null,
            attached_images: e.attached_images ?? [],
            evidence_links: e.evidence_links ?? [],
            artifact_links: e.artifact_links ?? [],
            tags: e.tags ?? [],
            milestone_date: "",
            notes: "",
            is_validated: true,
            validated_at: e.validated_at ?? now,
            validation_claim: e.validation_claim ?? "",
            narrative: e.narrative ?? "",
            hardware_note: e.hardware_note ?? "",
            next_relevance: e.next_relevance ?? "",
            technical_category: e.technical_category ?? "",
            created_at: e.created_at ?? now,
            updated_at: e.updated_at ?? now,
          });
        }
      }
    }
  } catch {
    /* ignore */
  }

  return out.length ? out : null;
}

function load(): Project[] {
  if (typeof window === "undefined") return SEED_PROJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Project[];
      if (Array.isArray(parsed)) return parsed;
    }
    const migrated = migrateLegacy();
    const initial = migrated ?? SEED_PROJECTS;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return SEED_PROJECTS;
  }
}

let state: Project[] = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function setState(next: Project[]) {
  state = next;
  persist();
  emit();
}

function touch<T extends Project>(p: T): T {
  return { ...p, updated_at: new Date().toISOString() };
}

export const projectStore = {
  getAll: () => state,
  get: (id: string) => state.find((p) => p.id === id),
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  create: (input: NewProjectInput): Project => {
    const now = new Date().toISOString();
    const project: Project = {
      id: `prj_${Math.random().toString(36).slice(2, 10)}`,
      title: input.title,
      short_summary: input.short_summary ?? "",
      full_description: input.full_description ?? "",
      category: input.category,
      status: input.status,
      priority: input.priority,
      progress_percent: input.progress_percent ?? 0,
      confidence_level: input.confidence_level ?? "Medium",
      next_action: input.next_action ?? "",
      github_repo_url: input.github_repo_url ?? "",
      github_snapshot: input.github_snapshot ?? null,
      attached_images: input.attached_images ?? [],
      evidence_links: input.evidence_links ?? [],
      artifact_links: input.artifact_links ?? [],
      tags: input.tags ?? [],
      milestone_date: input.milestone_date ?? "",
      notes: input.notes ?? "",
      is_validated: input.is_validated ?? false,
      validated_at: input.validated_at,
      validation_claim: input.validation_claim ?? "",
      narrative: input.narrative ?? "",
      hardware_note: input.hardware_note ?? "",
      next_relevance: input.next_relevance ?? "",
      technical_category: input.technical_category ?? "",
      created_at: now,
      updated_at: now,
    };
    setState([project, ...state]);
    return project;
  },
  update: (id: string, patch: Partial<Project>) => {
    setState(state.map((p) => (p.id === id ? touch({ ...p, ...patch }) : p)));
  },
  remove: (id: string) => {
    setState(state.filter((p) => p.id !== id));
  },
  resetSeed: () => setState(SEED_PROJECTS),

  // ---- Repository attachment (shared by Mission Control & Evidence Vault) ----
  upsertGithubUrl: (id: string, url: string) => {
    setState(state.map((p) => (p.id === id ? touch({ ...p, github_repo_url: url }) : p)));
  },
  attachGithubSnapshot: (id: string, snapshot: GithubRepoSnapshot) => {
    setState(
      state.map((p) =>
        p.id === id
          ? touch({ ...p, github_repo_url: snapshot.html_url, github_snapshot: snapshot })
          : p,
      ),
    );
  },
  clearGithubSnapshot: (id: string) => {
    setState(state.map((p) => (p.id === id ? touch({ ...p, github_snapshot: null }) : p)));
  },

  // ---- Image attachment ----
  attachImages: (id: string, images: AttachedImage[]) => {
    setState(
      state.map((p) => {
        if (p.id !== id) return p;
        const existing = (p.attached_images ?? []).filter((i) => i.source !== "placeholder");
        const seen = new Set(existing.map((i) => i.raw_url));
        const merged = [...existing];
        for (const img of images) {
          if (seen.has(img.raw_url)) continue;
          seen.add(img.raw_url);
          merged.push(img);
        }
        return touch({ ...p, attached_images: merged });
      }),
    );
  },
  removeImage: (id: string, imageId: string) => {
    setState(
      state.map((p) =>
        p.id === id
          ? touch({
              ...p,
              attached_images: (p.attached_images ?? []).filter((i) => i.id !== imageId),
            })
          : p,
      ),
    );
  },
  updateImageCaption: (id: string, imageId: string, caption: string) => {
    setState(
      state.map((p) =>
        p.id === id
          ? touch({
              ...p,
              attached_images: (p.attached_images ?? []).map((i) =>
                i.id === imageId ? { ...i, caption } : i,
              ),
            })
          : p,
      ),
    );
  },

  // ---- Validation / Evidence Vault flag ----
  setValidated: (id: string, validated: boolean) => {
    setState(
      state.map((p) =>
        p.id === id
          ? touch({
              ...p,
              is_validated: validated,
              validated_at: validated ? p.validated_at ?? new Date().toISOString() : undefined,
            })
          : p,
      ),
    );
  },
};

export function useProjects(): Project[] {
  return useSyncExternalStore(
    (l) => {
      const unsub = projectStore.subscribe(l);
      return () => unsub();
    },
    () => state,
    () => state,
  );
}

export function useProject(id: string | undefined): Project | undefined {
  const all = useProjects();
  return id ? all.find((p) => p.id === id) : undefined;
}

/** Projects flagged for the Evidence Vault (validated archive view). */
export function useValidatedProjects(): Project[] {
  const all = useProjects();
  return useMemo(
    () =>
      all
        .filter((p) => p.is_validated)
        .sort((a, b) => {
          const av = a.validated_at ?? a.updated_at;
          const bv = b.validated_at ?? b.updated_at;
          return +new Date(bv) - +new Date(av);
        }),
    [all],
  );
}

export const _noop = () => useEffect;
