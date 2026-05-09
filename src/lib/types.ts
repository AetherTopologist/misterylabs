export const CATEGORIES = [
  "Engineering",
  "Physics Experiment",
  "Content",
  "Internal Tool",
  "Product Concept",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = [
  "Backlog",
  "Researching",
  "Validating",
  "Building",
  "Blocked",
  "Ready to Launch",
  "Launched",
] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const CONFIDENCE = ["Low", "Medium", "High"] as const;
export type Confidence = (typeof CONFIDENCE)[number];

export interface EvidenceLink {
  id: string;
  label: string;
  url: string;
}

/** A single GitHub repo snapshot attached to a Research Object. */
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

/** A GitHub-imported image attached to a Research Object (metadata only). */
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

/**
 * Unified "Research Object" — powers both Mission Control (active work)
 * and the Evidence Vault (validated archive). A project starts as active
 * work and is later flagged as `is_validated` to surface in the vault.
 */
export interface Project {
  id: string;
  title: string;
  short_summary: string;
  full_description: string;
  category: Category;
  status: Status;
  priority: Priority;
  progress_percent: number;
  confidence_level: Confidence;
  next_action: string;

  // Linked repository (single primary repo + optional rich snapshot).
  github_repo_url: string;
  github_snapshot?: GithubRepoSnapshot | null;

  // Imported visual evidence (metadata + URLs only — never binaries).
  attached_images?: AttachedImage[];

  // External evidence and artifact links.
  evidence_links: EvidenceLink[];
  artifact_links?: EvidenceLink[];

  tags: string[];
  milestone_date: string; // ISO date (YYYY-MM-DD) or ""
  notes: string;

  // ---- Validation / archive metadata (Evidence Vault view) ----
  /** When true, the object appears in the Evidence Vault. */
  is_validated?: boolean;
  /** ISO timestamp of validation. */
  validated_at?: string;
  /** Short, public-facing claim of what was validated. */
  validation_claim?: string;
  /** Long-form narrative for the validated story. */
  narrative?: string;
  /** Hardware/setup note for reproduction. */
  hardware_note?: string;
  /** Why this validated artifact still matters going forward. */
  next_relevance?: string;
  /** Public technical category label (e.g. "Rendering Engine / GRIN Optics"). */
  technical_category?: string;

  created_at: string; // ISO
  updated_at: string; // ISO
}

export type NewProjectInput = Pick<Project, "title" | "category" | "status" | "priority"> &
  Partial<Project>;
