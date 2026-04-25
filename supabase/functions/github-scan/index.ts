// Read-only GitHub scanner for the Evidence Vault.
// Strictly read-only: only GET requests to api.github.com. Token never leaves the server.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const IMAGE_FOLDERS = [
  "docs",
  "Docs",
  "images",
  "assets",
  "screenshots",
  "output",
  "output/fixture_runs",
  "output/wormhole_test",
  "output/wormhole_dual_reality_analysis",
  "output/characterization_ledger",
];
const MAX_IMAGES = 24;
const MAX_PER_FOLDER = 12;

interface ScannedImage {
  filename: string;
  path: string;
  folder: string;
  raw_url: string;
  blob_url: string;
  source: "readme" | "folder";
}

function isImagePath(p: string) {
  const lower = p.toLowerCase();
  return IMAGE_EXTS.some((ext) => lower.endsWith(ext));
}

function rawUrl(owner: string, repo: string, branch: string, path: string) {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path.replace(/^\//, "")}`;
}

function blobUrl(owner: string, repo: string, branch: string, path: string) {
  return `https://github.com/${owner}/${repo}/blob/${branch}/${path.replace(/^\//, "")}`;
}

async function fetchReadmeRaw(owner: string, repo: string, token: string): Promise<{ text: string; path: string } | null> {
  const res = await ghFetch(`/repos/${owner}/${repo}/readme`, token);
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: string; path?: string };
  if (!data.content) return null;
  try {
    const decoded = atob(data.content.replace(/\n/g, ""));
    return { text: decoded, path: data.path ?? "README.md" };
  } catch {
    return null;
  }
}

function extractReadmeImages(
  readme: string,
  readmePath: string,
  owner: string,
  repo: string,
  branch: string,
): ScannedImage[] {
  const images: ScannedImage[] = [];
  const seen = new Set<string>();
  const readmeDir = readmePath.includes("/") ? readmePath.replace(/\/[^/]+$/, "") : "";

  // Markdown ![alt](url) and HTML <img src="">
  const patterns = [
    /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    /<img[^>]+src=["']([^"']+)["']/gi,
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(readme)) !== null) {
      let url = m[1].trim();
      if (!url || url.startsWith("data:")) continue;
      if (!isImagePath(url.split("?")[0].split("#")[0])) continue;

      let absoluteRaw: string;
      let absoluteBlob: string;
      let path: string;

      if (/^https?:\/\//i.test(url)) {
        // Normalize github blob URLs to raw
        const ghBlob = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i);
        const ghRaw = url.match(/^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/i);
        if (ghBlob) {
          path = ghBlob[4];
          absoluteRaw = rawUrl(ghBlob[1], ghBlob[2], ghBlob[3], path);
          absoluteBlob = url;
        } else if (ghRaw) {
          path = ghRaw[4];
          absoluteRaw = url;
          absoluteBlob = blobUrl(ghRaw[1], ghRaw[2], ghRaw[3], path);
        } else {
          // External — keep as raw, no blob link
          path = url;
          absoluteRaw = url;
          absoluteBlob = url;
        }
      } else {
        // Relative to readme
        const cleaned = url.replace(/^\.\//, "");
        path = readmeDir ? `${readmeDir}/${cleaned}` : cleaned;
        // Collapse ../
        const parts: string[] = [];
        for (const seg of path.split("/")) {
          if (seg === "..") parts.pop();
          else if (seg && seg !== ".") parts.push(seg);
        }
        path = parts.join("/");
        absoluteRaw = rawUrl(owner, repo, branch, path);
        absoluteBlob = blobUrl(owner, repo, branch, path);
      }

      if (seen.has(absoluteRaw)) continue;
      seen.add(absoluteRaw);

      const filename = path.split("/").pop() || path;
      const folder = path.includes("/") ? path.replace(/\/[^/]+$/, "") : "";
      images.push({
        filename,
        path,
        folder: folder || "(repo root)",
        raw_url: absoluteRaw,
        blob_url: absoluteBlob,
        source: "readme",
      });
      if (images.length >= MAX_IMAGES) return images;
    }
  }
  return images;
}

async function listFolderImages(
  owner: string,
  repo: string,
  branch: string,
  folder: string,
  token: string,
): Promise<ScannedImage[]> {
  const res = await ghFetch(
    `/repos/${owner}/${repo}/contents/${encodeURI(folder)}?ref=${encodeURIComponent(branch)}`,
    token,
  );
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  const out: ScannedImage[] = [];
  for (const entry of data) {
    if (entry.type !== "file") continue;
    if (!isImagePath(entry.name)) continue;
    out.push({
      filename: entry.name,
      path: entry.path,
      folder,
      raw_url: entry.download_url ?? rawUrl(owner, repo, branch, entry.path),
      blob_url: blobUrl(owner, repo, branch, entry.path),
      source: "folder",
    });
    if (out.length >= MAX_PER_FOLDER) break;
  }
  return out;
}

async function scanRepoImages(owner: string, repo: string, token: string) {
  // Get default branch
  const repoRes = await ghFetch(`/repos/${owner}/${repo}`, token);
  if (repoRes.status === 404) return { error: "not_found", status: 404 };
  if (repoRes.status === 401 || repoRes.status === 403) {
    return { error: "auth", status: repoRes.status, message: await repoRes.text() };
  }
  if (!repoRes.ok) return { error: "github", status: repoRes.status, message: await repoRes.text() };
  const repoData = await repoRes.json();
  const branch = repoData.default_branch ?? "main";

  const all: ScannedImage[] = [];
  const seen = new Set<string>();
  const push = (img: ScannedImage) => {
    if (seen.has(img.raw_url)) return;
    seen.add(img.raw_url);
    all.push(img);
  };

  // 1. README images first
  const readme = await fetchReadmeRaw(owner, repo, token);
  if (readme) {
    for (const img of extractReadmeImages(readme.text, readme.path, owner, repo, branch)) {
      push(img);
      if (all.length >= MAX_IMAGES) break;
    }
  }

  // 2. Known folders
  let capped = false;
  for (const folder of IMAGE_FOLDERS) {
    if (all.length >= MAX_IMAGES) {
      capped = true;
      break;
    }
    const folderImgs = await listFolderImages(owner, repo, branch, folder, token);
    for (const img of folderImgs) {
      if (all.length >= MAX_IMAGES) {
        capped = true;
        break;
      }
      push(img);
    }
  }

  return {
    images: all,
    capped: capped || all.length >= MAX_IMAGES,
    cap: MAX_IMAGES,
    branch,
    full_name: repoData.full_name,
  };
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

    if (action === "scan_images") {
      const owner = String(body.owner ?? "").trim();
      const repo = String(body.repo ?? "").trim();
      if (!owner || !repo) {
        return jsonResponse({ error: "missing_owner_or_repo" }, 400);
      }
      const result = await scanRepoImages(owner, repo, token);
      if ("error" in result) {
        return jsonResponse(result, (result as any).status ?? 500);
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
