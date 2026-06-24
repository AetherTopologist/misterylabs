#!/usr/bin/env tsx
import { execSync, spawn, type ChildProcess } from "child_process";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { firefox, type Browser, type Page } from "playwright";

type Theme = "dark" | "light";

interface RouteSpec {
  slug: string;
  path: string;
}

interface ViewportSpec {
  name: string;
  width: number;
  height: number;
}

interface BaselineManifest {
  viewports?: ViewportSpec[];
  routes?: RouteSpec[];
  files?: Record<string, Record<string, Record<Theme, string>>>;
}

interface MissingBaseline {
  route: string;
  viewport: string;
  theme: Theme;
  expected_path: string;
}

interface ContactSheetItem {
  route: RouteSpec;
  viewport: ViewportSpec;
  theme: Theme;
  beforePath: string | null;
  afterPath: string;
  beforeMissing: boolean;
}

interface VisualQaFinding {
  id?: string;
  severity?: string;
  category?: string;
  route?: string;
  title?: string;
  details?: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = "http://localhost:4173/misterylabs";
const RELEASE_NAME = "RC1";
const OUT_DIR = path.join(ROOT, "assets", "Release", RELEASE_NAME);
const SCREENSHOT_DIR = path.join(OUT_DIR, "screenshots");
const CONTACT_SHEET_PATH = path.join(OUT_DIR, "release_contact_sheet.png");
const SUMMARY_PATH = path.join(OUT_DIR, "release_summary.md");
const MANIFEST_PATH = path.join(OUT_DIR, "manifest.json");
const SETTLE_MS = 1200;

const ROUTES: RouteSpec[] = [
  { slug: "home", path: "/" },
  { slug: "atlas", path: "/atlas" },
  { slug: "observatory", path: "/observatory" },
  { slug: "media", path: "/media" },
  { slug: "observatory-force-graph", path: "/observatory/force-graph" },
  { slug: "observatory-resonance-spheres", path: "/observatory/resonance-spheres" },
  { slug: "observatory-fractal-inspiration", path: "/observatory/fractal-inspiration" },
  { slug: "observatory-transport-sphere", path: "/observatory/transport-sphere" },
  { slug: "observatory-poisson-dot", path: "/observatory/poisson-dot" },
  { slug: "observatory-quaternion", path: "/observatory/quaternion" },
  { slug: "observatory-higher-dimensional", path: "/observatory/higher-dimensional" },
  { slug: "broch-sphere", path: "/broch-sphere" },
];

const THEMES: Theme[] = ["dark", "light"];

const VIEWPORTS: ViewportSpec[] = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

function repoRelative(filepath: string): string {
  return path.relative(ROOT, filepath).split(path.sep).join("/");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fileHash(filepath: string): string {
  return createHash("sha256").update(fs.readFileSync(filepath)).digest("hex");
}

async function isServerRunning(): Promise<boolean> {
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(2000) });
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

async function waitForServer(maxMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (await isServerRunning()) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Preview server did not start within 30s");
}

function buildIfNeeded(): void {
  const distIndex = path.join(ROOT, "dist", "index.html");
  if (!fs.existsSync(distIndex)) {
    console.log("Building project...");
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  } else {
    console.log("Using existing dist/ build.");
  }
}

function stopPreview(previewProc: ChildProcess | null): void {
  if (!previewProc?.pid) return;
  try {
    process.kill(-previewProc.pid, "SIGTERM");
  } catch {
    previewProc.kill("SIGTERM");
  }
}

function readJson<T>(filepath: string): T {
  return JSON.parse(fs.readFileSync(filepath, "utf8")) as T;
}

function findBaselineManifestPath(): string {
  const configured = process.env.RELEASE_BASELINE_DIR;
  if (configured) {
    const resolved = path.isAbsolute(configured) ? configured : path.join(ROOT, configured);
    const manifestPath = fs.statSync(resolved).isDirectory()
      ? path.join(resolved, "audit-manifest.json")
      : resolved;
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`RELEASE_BASELINE_DIR did not resolve to a manifest: ${manifestPath}`);
    }
    return manifestPath;
  }

  const visualAuditRoot = path.join(ROOT, "docs", "visual-audit");
  const manifestPaths = fs.existsSync(visualAuditRoot)
    ? fs.readdirSync(visualAuditRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(visualAuditRoot, entry.name, "audit-manifest.json"))
        .filter((manifestPath) => fs.existsSync(manifestPath))
        .sort()
    : [];

  const latest = manifestPaths.at(-1);
  if (!latest) {
    throw new Error("No visual-audit baseline manifest found. Set RELEASE_BASELINE_DIR.");
  }
  return latest;
}

function baselineViewportName(
  baseline: BaselineManifest,
  viewport: ViewportSpec,
): string | null {
  const matchingViewport = baseline.viewports?.find(
    (candidate) => candidate.width === viewport.width && candidate.height === viewport.height,
  );
  return matchingViewport?.name ?? null;
}

function baselineImagePath(
  baselineDir: string,
  baseline: BaselineManifest,
  viewport: ViewportSpec,
  route: RouteSpec,
  theme: Theme,
): string | null {
  const viewportName = baselineViewportName(baseline, viewport);
  if (!viewportName) return null;
  const relPath = baseline.files?.[viewportName]?.[route.slug]?.[theme];
  return relPath ? path.join(baselineDir, relPath) : null;
}

async function captureRoute(
  page: Page,
  route: RouteSpec,
  theme: Theme,
  viewport: ViewportSpec,
): Promise<string> {
  await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle" });
  await page.evaluate((activeTheme: Theme) => {
    document.documentElement.classList.toggle("light", activeTheme === "light");
  }, theme);
  await page.waitForTimeout(SETTLE_MS);

  const viewportDir = path.join(SCREENSHOT_DIR, viewport.name);
  fs.mkdirSync(viewportDir, { recursive: true });
  const filepath = path.join(viewportDir, `${route.slug}-${theme}.png`);
  await page.screenshot({ path: filepath, fullPage: false });
  return filepath;
}

async function writeContactSheet(items: ContactSheetItem[]): Promise<void> {
  const rows = items.map((item) => {
    const before = item.beforePath
      ? `<img src="${pathToFileURL(item.beforePath).href}" alt="Before ${escapeHtml(item.route.slug)} ${item.viewport.name} ${item.theme}" />`
      : `<div class="placeholder">Missing baseline</div>`;
    const after = `<img src="${pathToFileURL(item.afterPath).href}" alt="After ${escapeHtml(item.route.slug)} ${item.viewport.name} ${item.theme}" />`;
    const missingClass = item.beforeMissing ? " missing" : "";

    return `<article class="comparison${missingClass}">
      <header>
        <strong>${escapeHtml(item.route.slug)}</strong>
        <span>${escapeHtml(item.viewport.name)} · ${item.viewport.width}x${item.viewport.height} · ${item.theme}</span>
      </header>
      <div class="pair">
        <section><h2>Before</h2>${before}</section>
        <section><h2>After</h2>${after}</section>
      </div>
    </article>`;
  }).join("\n");

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #101317;
        color: #eef3f7;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .sheet { width: 1800px; padding: 32px; }
      .title {
        display: flex;
        align-items: end;
        justify-content: space-between;
        border-bottom: 1px solid rgba(238, 243, 247, 0.18);
        margin-bottom: 24px;
        padding-bottom: 18px;
      }
      h1 { margin: 0; font-size: 34px; font-weight: 700; letter-spacing: 0; }
      .title p { margin: 0; color: rgba(238, 243, 247, 0.72); font-size: 18px; }
      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
      .comparison {
        background: #171c22;
        border: 1px solid rgba(238, 243, 247, 0.16);
        border-radius: 8px;
        overflow: hidden;
      }
      .comparison.missing { border-color: rgba(255, 196, 87, 0.55); }
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 14px;
        border-bottom: 1px solid rgba(238, 243, 247, 0.12);
        background: #20262e;
      }
      strong { font-size: 15px; }
      span { color: rgba(238, 243, 247, 0.68); font-size: 13px; white-space: nowrap; }
      .pair { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: rgba(238, 243, 247, 0.12); }
      section { min-width: 0; background: #11161b; padding: 10px; }
      h2 {
        margin: 0 0 8px;
        color: rgba(238, 243, 247, 0.7);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      img, .placeholder {
        display: block;
        width: 100%;
        height: 230px;
        object-fit: contain;
        background: #07090b;
        border-radius: 4px;
      }
      .placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffc457;
        border: 1px dashed rgba(255, 196, 87, 0.58);
        font-size: 18px;
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <div class="title">
        <h1>MisterY Labs ${RELEASE_NAME} Release Contact Sheet</h1>
        <p>Before / after comparisons · ${items.length} captures</p>
      </div>
      <div class="grid">${rows}</div>
    </main>
  </body>
</html>`;

  const browser = await firefox.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1800, height: 1200 } });
    await page.setContent(html, { waitUntil: "load" });
    await page.screenshot({ path: CONTACT_SHEET_PATH, fullPage: true });
  } finally {
    await browser.close();
  }
}

function visualQaFindings(): VisualQaFinding[] {
  const jsonPath = path.join(ROOT, "reports", "visual_qa_report.json");
  if (fs.existsSync(jsonPath)) {
    const report = readJson<{ findings?: VisualQaFinding[] }>(jsonPath);
    return report.findings ?? [];
  }
  return [];
}

function unresolvedIssueLines(findings: VisualQaFinding[]): string[] {
  if (findings.length === 0) {
    const markdownPath = path.join(ROOT, "reports", "visual_qa_report.md");
    if (fs.existsSync(markdownPath)) {
      return [`- See \`${repoRelative(markdownPath)}\` for existing visual QA notes.`];
    }
    return ["- No visual QA report was available at generation time."];
  }

  const summary = findings.reduce<Record<string, number>>((acc, finding) => {
    const severity = finding.severity ?? "UNKNOWN";
    acc[severity] = (acc[severity] ?? 0) + 1;
    return acc;
  }, {});
  const order = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"];
  const totals = order
    .filter((severity) => summary[severity])
    .map((severity) => `${summary[severity]} ${severity.toLowerCase()}`)
    .join(", ");
  const topFindings = findings.slice(0, 12).map((finding) => {
    const id = finding.id ? `${finding.id}: ` : "";
    const route = finding.route ? ` on \`${finding.route}\`` : "";
    return `- ${id}${finding.severity ?? "UNKNOWN"} ${finding.category ?? "visual"}${route} - ${finding.title ?? "Unresolved visual QA finding"}`;
  });
  return [`- Current visual QA finding count: ${totals || findings.length}.`, ...topFindings];
}

function writeSummary(
  generatedAt: string,
  baselineDir: string,
  changedRoutes: string[],
  screenshotCount: number,
  missingBaselines: MissingBaseline[],
  findings: VisualQaFinding[],
): void {
  const screenshots = VIEWPORTS.flatMap((viewport) =>
    ROUTES.flatMap((route) =>
      THEMES.map((theme) => `- \`${repoRelative(path.join(SCREENSHOT_DIR, viewport.name, `${route.slug}-${theme}.png`))}\``),
    ),
  );

  const missingLines = missingBaselines.length
    ? missingBaselines.map(
        (item) => `- ${item.route} / ${item.viewport} / ${item.theme}: \`${item.expected_path}\``,
      )
    : ["- None. All requested baseline comparisons resolved."];

  const summary = `# MisterY Labs ${RELEASE_NAME} Release Summary

Generated: ${generatedAt}
Baseline: \`${repoRelative(baselineDir)}\`

## Routes Changed

${changedRoutes.length ? changedRoutes.map((route) => `- \`${route}\``).join("\n") : "- No binary screenshot changes detected against baseline."}

## Screenshots

- Screenshot count: ${screenshotCount}
- Contact sheet: \`${repoRelative(CONTACT_SHEET_PATH)}\`

${screenshots.join("\n")}

## Visual Improvements

- Release evolution is now observable through a fixed 12-route, 2-theme, 3-viewport screenshot matrix.
- RC1 adds a before/after contact sheet so route-level visual movement can be reviewed without manually opening individual captures.
- RC1 adds \`manifest.json\` so future agents can locate release artifacts without scraping this markdown.

## Unresolved Issues

${unresolvedIssueLines(findings).join("\n")}

## Missing Baselines

${missingLines.join("\n")}
`;

  fs.writeFileSync(SUMMARY_PATH, summary);
}

async function main(): Promise<void> {
  buildIfNeeded();

  const baselineManifestPath = findBaselineManifestPath();
  const baselineDir = path.dirname(baselineManifestPath);
  const baseline = readJson<BaselineManifest>(baselineManifestPath);
  const generatedAt = new Date().toISOString();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.rmSync(SCREENSHOT_DIR, { recursive: true, force: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  let previewProc: ChildProcess | null = null;
  if (!(await isServerRunning())) {
    console.log("Starting vite preview for release artifacts...");
    previewProc = spawn("npx", ["vite", "preview", "--port", "4173"], {
      cwd: ROOT,
      detached: true,
      stdio: "ignore",
    });
    previewProc.unref();
    await waitForServer();
  } else {
    console.log("Preview server already running at localhost:4173.");
  }

  const browser: Browser = await firefox.launch({ headless: true });
  const contactSheetItems: ContactSheetItem[] = [];
  const missingBaselines: MissingBaseline[] = [];
  const changedRouteSet = new Set<string>();
  let screenshotCount = 0;

  try {
    for (const viewport of VIEWPORTS) {
      console.log(`\n${viewport.name} (${viewport.width}x${viewport.height})`);
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();

      for (const route of ROUTES) {
        for (const theme of THEMES) {
          process.stdout.write(`  ${route.slug} [${theme}] ... `);
          const afterPath = await captureRoute(page, route, theme, viewport);
          screenshotCount += 1;

          const expectedBaseline = baselineImagePath(baselineDir, baseline, viewport, route, theme);
          const beforePath = expectedBaseline && fs.existsSync(expectedBaseline) ? expectedBaseline : null;
          const beforeMissing = beforePath === null;

          if (beforeMissing) {
            changedRouteSet.add(route.slug);
            missingBaselines.push({
              route: route.slug,
              viewport: viewport.name,
              theme,
              expected_path: expectedBaseline ? repoRelative(expectedBaseline) : `${viewport.name}/${route.slug}-${theme}.png`,
            });
          } else if (fileHash(beforePath) !== fileHash(afterPath)) {
            changedRouteSet.add(route.slug);
          }

          contactSheetItems.push({ route, viewport, theme, beforePath, afterPath, beforeMissing });
          console.log("done");
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
    stopPreview(previewProc);
  }

  await writeContactSheet(contactSheetItems);

  const changedRoutes = ROUTES
    .map((route) => route.slug)
    .filter((slug) => changedRouteSet.has(slug));
  const findings = visualQaFindings();

  writeSummary(generatedAt, baselineDir, changedRoutes, screenshotCount, missingBaselines, findings);

  const manifest = {
    generated_at: generatedAt,
    baseline_dir: repoRelative(baselineDir),
    routes: ROUTES,
    viewports: VIEWPORTS,
    screenshot_count: screenshotCount,
    changed_routes: changedRoutes,
    missing_baselines: missingBaselines,
    contact_sheet_path: repoRelative(CONTACT_SHEET_PATH),
    summary_path: repoRelative(SUMMARY_PATH),
  };

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`\nDone. ${screenshotCount} screenshots -> ${repoRelative(SCREENSHOT_DIR)}/`);
  console.log(`Contact sheet: ${repoRelative(CONTACT_SHEET_PATH)}`);
  console.log(`Summary: ${repoRelative(SUMMARY_PATH)}`);
  console.log(`Manifest: ${repoRelative(MANIFEST_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
