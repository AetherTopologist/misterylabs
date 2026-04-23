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
  github_repo_url: string;
  evidence_links: EvidenceLink[];
  tags: string[];
  milestone_date: string; // ISO date (YYYY-MM-DD) or ""
  notes: string;
  created_at: string; // ISO
  updated_at: string; // ISO
}

export type NewProjectInput = Pick<Project, "title" | "category" | "status" | "priority"> &
  Partial<Project>;
