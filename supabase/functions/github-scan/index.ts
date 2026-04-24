// Read-only GitHub scanner for the Evidence Vault.
// Strictly read-only: only GET requests to api.github.com. Token never leaves the server.
import { corsHeaders } from "@supabase/supabase-js/cors";

const GITHUB_API = "https://api.github.com";
const SEARCH_KEYWORDS = [
  "luxcore",
  "grin",
  "blendluxcore",
  "xprimeray",
  "curved ray",
  "curved-ray",
];

interface RepoSummary {
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

interface RepoDetail extends RepoSummary {
  default_branch: string;
  readme_summary: string | null;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ghHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "xprime-lab-evidence-vault",
  };
}

async function ghFetch(path: string, token: string): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    method: "GET",
    headers: ghHeaders(token),
  });
}

function matchKeywords(repo: { name?: string; description?: string | null; topics?: string[] }) {
  const haystack = [
    repo.name ?? "",
    repo.description ?? "",
    ...(repo.topics ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return SEARCH_KEYWORDS.filter((k) => haystack.includes(k));
}

function toSummary(r: any): RepoSummary {
  return {
    full_name: r.full_name,
    name: r.name,
    owner: r.owner?.login ?? r.full_name?.split("/")[0] ?? "",
    description: r.description ?? null,
    html_url: r.html_url,
    stargazers_count: r.stargazers_count ?? 0,
    pushed_at: r.pushed_at,
    updated_at: r.updated_at,
    language: r.language ?? null,
    topics: Array.isArray(r.topics) ? r.topics : [],
    private: !!r.private,
    archived: !!r.archived,
    fork: !!r.fork,
    matched_keywords: matchKeywords(r),
  };
}

// Score = stars + recency boost. Recent pushes within last year add up to 50.
function scoreRepo(r: RepoSummary) {
  const stars = r.stargazers_count;
  const pushedMs = Date.parse(r.pushed_at || r.updated_at || "");
  if (!pushedMs) return stars;
  const days = (Date.now() - pushedMs) / 86_400_000;
  const recency = Math.max(0, 50 - days / 7); // ~7d per point, max 50
  const keywordBoost = r.matched_keywords.length * 25;
  return stars + recency + keywordBoost;
}

async function listRepos(
  token: string,
  opts: { query?: string; limit?: number; matchedOnly?: boolean },
) {
  const limit = Math.min(Math.max(opts.limit ?? 12, 1), 50);
  // Pull up to 3 pages (300 repos) of accessible repos sorted by recent push.
  const all: RepoSummary[] = [];
  for (let page = 1; page <= 3; page++) {
    const res = await ghFetch(
      `/user/repos?per_page=100&sort=pushed&direction=desc&affiliation=owner,collaborator,organization_member&page=${page}`,
      token,
    );
    if (res.status === 401 || res.status === 403) {
      const body = await res.text();
      return { error: "auth", status: res.status, message: body };
    }
    if (!res.ok) {
      const body = await res.text();
      return { error: "github", status: res.status, message: body };
    }
    const arr = (await res.json()) as any[];
    if (!Array.isArray(arr) || arr.length === 0) break;
    all.push(...arr.map(toSummary));
    if (arr.length < 100) break;
  }

  let filtered = all;
  const q = (opts.query ?? "").trim().toLowerCase();
  if (q) {
    filtered = filtered.filter((r) =>
      [r.name, r.description ?? "", r.full_name, ...(r.topics ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  if (opts.matchedOnly) {
    filtered = filtered.filter((r) => r.matched_keywords.length > 0);
  }

  filtered.sort((a, b) => scoreRepo(b) - scoreRepo(a));
  return { repos: filtered.slice(0, limit), total_scanned: all.length };
}

async function fetchReadmeSummary(
  owner: string,
  repo: string,
  token: string,
): Promise<string | null> {
  const res = await ghFetch(`/repos/${owner}/${repo}/readme`, token);
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content) return null;
  try {
    const decoded = atob(data.content.replace(/\n/g, ""));
    // Strip code fences, html tags, headings markers, links to plain text
    const plain = decoded
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/^#+\s*/gm, "")
      .replace(/[*_>`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return plain.slice(0, 800);
  } catch {
    return null;
  }
}

async function getRepoMeta(owner: string, repo: string, token: string) {
  const res = await ghFetch(`/repos/${owner}/${repo}`, token);
  if (res.status === 404) return { error: "not_found", status: 404 };
  if (res.status === 401 || res.status === 403) {
    return { error: "auth", status: res.status, message: await res.text() };
  }
  if (!res.ok) {
    return { error: "github", status: res.status, message: await res.text() };
  }
  const data = await res.json();
  const summary = toSummary(data);
  const detail: RepoDetail = {
    ...summary,
    default_branch: data.default_branch ?? "main",
    readme_summary: await fetchReadmeSummary(owner, repo, token),
  };
  return { repo: detail };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Strict read-only: only POST with explicit action.
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) {
    return jsonResponse(
      {
        error: "missing_token",
        message: "GitHub token is not configured on the server.",
      },
      500,
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const action = body?.action;

  try {
    if (action === "list") {
      const result = await listRepos(token, {
        query: typeof body.query === "string" ? body.query : "",
        limit: typeof body.limit === "number" ? body.limit : 12,
        matchedOnly: !!body.matchedOnly,
      });
      if ("error" in result) {
        return jsonResponse(result, result.status ?? 500);
      }
      return jsonResponse(result);
    }

    if (action === "meta") {
      const owner = String(body.owner ?? "").trim();
      const repo = String(body.repo ?? "").trim();
      if (!owner || !repo) {
        return jsonResponse({ error: "missing_owner_or_repo" }, 400);
      }
      const result = await getRepoMeta(owner, repo, token);
      if ("error" in result) {
        return jsonResponse(result, result.status ?? 500);
      }
      return jsonResponse(result);
    }

    return jsonResponse({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error("github-scan error", e);
    return jsonResponse(
      { error: "internal", message: e instanceof Error ? e.message : "unknown" },
      500,
    );
  }
});
