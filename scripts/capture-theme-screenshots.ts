import { firefox, Browser, Page } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync, spawn, ChildProcess } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const BASE = "http://localhost:4173/misterylabs";
const SETTLE_MS = 1200;

const TODAY = new Date().toISOString().slice(0, 10);
const OUT_DIR = path.join(ROOT, "docs", "visual-audit", TODAY);

const ROUTES: { slug: string; path: string }[] = [
  { slug: "home",                            path: "/"                                },
  { slug: "atlas",                           path: "/atlas"                           },
  { slug: "observatory",                     path: "/observatory"                     },
  { slug: "media",                           path: "/media"                           },
  { slug: "observatory-force-graph",         path: "/observatory/force-graph"         },
  { slug: "observatory-resonance-spheres",   path: "/observatory/resonance-spheres"   },
  { slug: "observatory-fractal-inspiration", path: "/observatory/fractal-inspiration" },
  { slug: "observatory-transport-sphere",    path: "/observatory/transport-sphere"    },
  { slug: "observatory-poisson-dot",         path: "/observatory/poisson-dot"         },
  { slug: "observatory-quaternion",          path: "/observatory/quaternion"          },
  { slug: "observatory-higher-dimensional",  path: "/observatory/higher-dimensional"  },
  { slug: "broch-sphere",                    path: "/broch-sphere"                    },
];

const THEMES: ("dark" | "light")[] = ["dark", "light"];

interface Viewport { name: string; width: number; height: number }

const VIEWPORTS: Viewport[] = [
  { name: "mobile-390",     width: 390,  height: 844  },
  { name: "tablet-768",     width: 768,  height: 1024 },
  { name: "laptop-sm-1024", width: 1024, height: 768  },
  { name: "laptop-1366",    width: 1366, height: 768  },
  { name: "desktop-1440",   width: 1440, height: 900  },
  { name: "wide-1920",      width: 1920, height: 1080 },
  { name: "ultra-2560",     width: 2560, height: 1440 },
];

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
  theme: "dark" | "light",
  viewport: Viewport,
): Promise<string> {
  const url = `${BASE}${route.path}`;
  await page.goto(url, { waitUntil: "networkidle" });

  await page.evaluate((t: string) => {
    if (t === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, theme);

  await page.waitForTimeout(SETTLE_MS);

  const vpDir = path.join(OUT_DIR, viewport.name);
  fs.mkdirSync(vpDir, { recursive: true });

  const filename = `${route.slug}-${theme}.png`;
  const filepath = path.join(vpDir, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  return path.join(viewport.name, filename);
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

  const browser: Browser = await firefox.launch({ headless: true });
  const captured: string[] = [];
  const manifest: Record<string, Record<string, Record<string, string>>> = {};

  try {
    for (const viewport of VIEWPORTS) {
      console.log(`\n── ${viewport.name} (${viewport.width}×${viewport.height}) ──`);
      manifest[viewport.name] = {};

      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();

      for (const route of ROUTES) {
        manifest[viewport.name][route.slug] = {};
        for (const theme of THEMES) {
          process.stdout.write(`  ${route.slug} [${theme}]… `);
          const relPath = await captureRoute(page, route, theme, viewport);
          captured.push(relPath);
          manifest[viewport.name][route.slug][theme] = relPath;
          console.log("done");
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
    if (previewProc) previewProc.kill();
  }

  // Write manifest JSON
  fs.writeFileSync(
    path.join(OUT_DIR, "audit-manifest.json"),
    JSON.stringify({ date: TODAY, viewports: VIEWPORTS, routes: ROUTES, files: manifest }, null, 2),
  );

  // Write README index
  const now = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const vpSection = VIEWPORTS.map((vp) => {
    const rows = ROUTES.map((r) =>
      THEMES.map((t) => `| ${r.slug} | ${t} | \`${vp.name}/${r.slug}-${t}.png\` |`).join("\n"),
    ).join("\n");
    return `### ${vp.name} (${vp.width}×${vp.height})\n\n| Route | Theme | File |\n|---|---|---|\n${rows}`;
  }).join("\n\n");

  const readme = `# Visual Audit — ${TODAY}

> Generated: ${now}
> Routes: ${ROUTES.length} · Themes: ${THEMES.length} · Viewports: ${VIEWPORTS.length}
> Total screenshots: ${captured.length}

## Viewports

${VIEWPORTS.map((vp) => `- \`${vp.name}\` — ${vp.width}×${vp.height}`).join("\n")}

## Screenshot Index

${vpSection}
`;

  fs.writeFileSync(path.join(OUT_DIR, "README.md"), readme);

  console.log(`\nDone. ${captured.length} screenshots → docs/visual-audit/${TODAY}/`);
  console.log(`Manifest: docs/visual-audit/${TODAY}/audit-manifest.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
