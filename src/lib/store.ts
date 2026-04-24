import { useEffect, useSyncExternalStore } from "react";
import type { NewProjectInput, Project } from "./types";
import { SEED_PROJECTS } from "./seed";

const STORAGE_KEY = "xprime-lab.projects.v3";

function load(): Project[] {
  if (typeof window === "undefined") return SEED_PROJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PROJECTS));
      return SEED_PROJECTS;
    }
    const parsed = JSON.parse(raw) as Project[];
    if (!Array.isArray(parsed)) return SEED_PROJECTS;
    return parsed;
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
      evidence_links: input.evidence_links ?? [],
      tags: input.tags ?? [],
      milestone_date: input.milestone_date ?? "",
      notes: input.notes ?? "",
      created_at: now,
      updated_at: now,
    };
    setState([project, ...state]);
    return project;
  },
  update: (id: string, patch: Partial<Project>) => {
    setState(
      state.map((p) =>
        p.id === id ? { ...p, ...patch, updated_at: new Date().toISOString() } : p,
      ),
    );
  },
  remove: (id: string) => {
    setState(state.filter((p) => p.id !== id));
  },
  resetSeed: () => setState(SEED_PROJECTS),
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

// Helpful no-op so React import isn't shaken out in some tooling
export const _noop = () => useEffect;
