import { firefox, Browser, Page } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync, spawn, ChildProcess } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const BASE = "http://localhost:4173/misterylabs";
const VIEWPORT = { width: 1440, height: 1100 };
const SETTLE_MS = 1000;

const TODAY = new Date().toISOString().slice(0, 10);
const OUT_DIR = path.join(ROOT, "docs", "visual-audit", TODAY);

const ROUTES: { slug: string; path: string }[] = [
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
];

const THEMES: ("dark" | "light")[] = ["dark", "light"];

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
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Preview server did not start within 30s");
}

async function captureRoute(
  page: Page,
  route: { slug: string; path: string },
  theme: "dark" | "light"
): Promise<string> {
  const url = `${BASE}${route.path}`;
  await page.goto(url, { waitUntil: "networkidle" });

  // Force theme via html class (same mechanism as useTheme hook)
  await page.evaluate((t: string) => {
    if (t === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, theme);

  // Settle for fonts, canvas, SVG animations
  await page.waitForTimeout(SETTLE_MS);

  const filename = `${route.slug}-${theme}.png`;
  const filepath = path.join(OUT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  return filename;
}

function buildIfNeeded(): void {
  const distIndex = path.join(ROOT, "dist", "index.html");
  if (!fs.existsSync(distIndex)) {
    console.log("Building project…");
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  } else {
    console.log("Using existing dist/ build.");
  }
}

async function main(): Promise<void> {
  buildIfNeeded();

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let previewProc: ChildProcess | null = null;
  const alreadyRunning = await isServerRunning();

  if (!alreadyRunning) {
    console.log("Starting vite preview…");
    previewProc = spawn("npx", ["vite", "preview", "--port", "4173"], {
      cwd: ROOT,
      detached: false,
      stdio: "pipe",
    });
    await waitForServer();
    console.log("Preview server ready.");
  } else {
    console.log("Preview server already running at localhost:4173.");
  }

  const captured: string[] = [];
  const browser: Browser = await firefox.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();

    for (const route of ROUTES) {
      for (const theme of THEMES) {
        process.stdout.write(`  ${route.slug} [${theme}]… `);
        const filename = await captureRoute(page, route, theme);
        captured.push(filename);
        console.log("done");
      }
    }

    await context.close();
  } finally {
    await browser.close();
    if (previewProc) {
      previewProc.kill();
    }
  }

  // Generate README.md
  const now = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const fileList = captured.map((f) => `- \`${f}\``).join("\n");
  const routeList = ROUTES.map((r) => `- \`${r.slug}\` → \`${r.path}\``).join("\n");

  const readme = `# Visual Audit — ${TODAY}

> Reference screenshots for visual/theme audit only.
> Generated: ${now}
> Viewport: ${VIEWPORT.width}×${VIEWPORT.height}

## Routes captured

${routeList}

## Screenshots

${fileList}
`;

  fs.writeFileSync(path.join(OUT_DIR, "README.md"), readme);

  console.log(`\nDone. ${captured.length} screenshots → docs/visual-audit/${TODAY}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
