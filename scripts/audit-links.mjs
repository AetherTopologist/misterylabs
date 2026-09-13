#!/usr/bin/env node
/**
 * Link auditor for MisterY Labs SPA.
 *
 * Derives the public route set, maintainer routes, and production basename
 * from repository reality (App.tsx, AppHeader.tsx, robots.txt, vite.config)
 * rather than a stale hard-coded known-route list.
 *
 * Run: npm run audit:links
 */

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "fs";
import { join, extname, relative } from "path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const SRC = join(ROOT, "src");
const PUBLIC_DIR = join(ROOT, "public");

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function walk(dir, exts) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory() && !entry.startsWith(".") && entry !== "node_modules") {
      results.push(...walk(full, exts));
    } else if (exts.includes(extname(entry))) {
      results.push(full);
    }
  }
  return results;
}

function unique(arr) {
  return [...new Set(arr)];
}

// ── Derive basename, routes, nav, maintainer set from repo ──

function parseBasename() {
  const vite = read("vite.config.ts");
  const m = vite.match(/base:\s*['"]([^'"]+)['"]/);
  if (!m) throw new Error("Could not parse vite.config.ts base");
  const raw = m[1];
  return raw.endsWith("/") ? raw : raw + "/";
}

function parseAppRoutes() {
  const app = read("src/App.tsx");
  const routes = [];
  const re = /<Route\s+path=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(app)) !== null) {
    if (m[1] !== "*") routes.push(m[1]);
  }
  return routes;
}

function parseHeaderNav() {
  const header = read("src/components/AppHeader.tsx");
  const nav = [];
  const re = /\{\s*to:\s*["']([^"']+)["'][^}]*label:\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(header)) !== null) nav.push({ to: m[1], label: m[2] });
  if (!nav.length) {
    const simple = /\bto:\s*["']([^"']+)["']/g;
    while ((m = simple.exec(header)) !== null) nav.push({ to: m[1], label: m[1] });
  }
  return nav;
}

function parseRobotsDisallows(basename) {
  const robots = read("public/robots.txt");
  const baseNoSlash = basename.replace(/\/$/, "");
  const disallows = [];
  for (const line of robots.split("\n")) {
    const m = line.match(/^Disallow:\s+(\S+)/);
    if (!m) continue;
    let p = m[1];
    if (p.startsWith(baseNoSlash + "/")) p = p.slice(baseNoSlash.length);
    else if (p === baseNoSlash) p = "/";
    disallows.push(p);
  }
  return unique(disallows);
}

function isParamRoute(route) {
  return route.includes(":");
}

function routeToRegex(route) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\:[^/]+/g, "[^/]+");
  return new RegExp(`^${escaped}/?$`);
}

function classifyRoute(pathname, publicRoutes, maintainerRoutes) {
  if (publicRoutes.some((r) => routeToRegex(r).test(pathname))) return "public";
  if (maintainerRoutes.some((r) => {
    if (r.endsWith("/") && !isParamRoute(r)) return pathname === r.slice(0, -1) || pathname.startsWith(r);
    return routeToRegex(r).test(pathname);
  })) return "maintainer";
  return "unknown";
}

const BASENAME = parseBasename(); // '/misterylabs/'
const BASENAME_NO_SLASH = BASENAME.replace(/\/$/, "");
const APP_ROUTES = parseAppRoutes();
const HEADER_NAV = parseHeaderNav();
const ROBOTS_DISALLOW = parseRobotsDisallows(BASENAME);

const MAINTAINER_ROUTES = unique([
  ...ROBOTS_DISALLOW.filter((p) => p && p !== "/"),
  ...APP_ROUTES.filter((r) =>
    ROBOTS_DISALLOW.some((d) => {
      if (d.endsWith("/")) return r === d.slice(0, -1) || r.startsWith(d) || r.startsWith(d.slice(0, -1) + "/");
      return r === d || r.startsWith(d + "/");
    }),
  ),
]);

const PUBLIC_ROUTES = APP_ROUTES.filter((r) =>
  !MAINTAINER_ROUTES.some((d) => {
    if (d.endsWith("/")) return r === d.slice(0, -1) || r.startsWith(d) || r.startsWith(d.slice(0, -1) + "/");
    return r === d || r.startsWith(d + "/");
  }),
);

// ── Collect page section ids ──

const SECTION_ID_RE = /\bid=["']([A-Za-z][\w:-]*)["']/g;
const SKIP_ID_PREFIXES = ["tsv-", "cav-", "qc-", "vc-", "cr-", "broch"];
const sectionIds = new Set();
const allIds = new Set();

function considerId(id) {
  allIds.add(id);
  if (SKIP_ID_PREFIXES.some((p) => id.startsWith(p) || id === "nodeGlow" || id === "brochGlow")) return;
  sectionIds.add(id);
}

// ── Scan ──

const findings = {
  publicRoutes: [],
  maintainerRoutes: [],
  unknownRoutes: [],
  hashAnchors: [],
  bundlerEntries: [],
  externalUrls: [],
  assetPaths: [],
  dynamicRefs: [],
  placeholders: [],
  seedData: [],
};

const PLACEHOLDER_RE = /^(#|javascript:void\(0\)|javascript:|about:blank)?$/;
const SEED_RE = /example\.com|xprime\/xprimeray|xprime\/portal/;

function stripBasename(pathname) {
  if (pathname === BASENAME_NO_SLASH || pathname === BASENAME) return "/";
  if (pathname.startsWith(BASENAME)) return "/" + pathname.slice(BASENAME.length);
  if (pathname.startsWith(BASENAME_NO_SLASH + "/")) return pathname.slice(BASENAME_NO_SLASH.length);
  return pathname;
}

function expandInterpolations(value) {
  return value
    .replace(/\$\{(?:BASE|import\.meta\.env\.BASE_URL)\}/g, BASENAME)
    .replace(/%BASE_URL%/g, BASENAME);
}

function categorize(value, label, file, line) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const entry = { file: rel, line, label, value };
  const raw = value.trim();

  if (PLACEHOLDER_RE.test(raw)) {
    findings.placeholders.push(entry);
    return;
  }
  if (SEED_RE.test(raw)) {
    findings.seedData.push(entry);
    return;
  }

  const expanded = expandInterpolations(raw);
  if (/\$\{/.test(expanded)) {
    findings.dynamicRefs.push(entry);
    return;
  }

  if (expanded.startsWith("mailto:") || expanded.startsWith("http://") || expanded.startsWith("https://")) {
    findings.externalUrls.push(entry);
    return;
  }
  if (expanded.startsWith("@/assets/") || label === "asset-import") {
    findings.assetPaths.push(entry);
    return;
  }
  if (expanded.startsWith("#")) {
    findings.hashAnchors.push(entry);
    return;
  }

  // SVG animate to="-40", Broch Sphere edge `to: "k-einstein"`, etc.
  if ((label === "to" || label === "data-href") && !/^(?:[/#]|https?:|mailto:)/.test(expanded)) {
    if (expanded !== "") return;
  }

  if (expanded.startsWith("/") || expanded.startsWith("./") || expanded.startsWith("../")) {
    const noQuery = expanded.split("?")[0];
    const [pathPart, hashPart] = noQuery.split("#");
    const logical = stripBasename(pathPart || "/");

    if (logical.startsWith("/assets/") || logical.endsWith(".png") || logical.endsWith(".svg") || logical.endsWith(".jpg") || logical.endsWith(".webp")) {
      findings.assetPaths.push({ ...entry, value: expanded, logical });
      return;
    }

    if (hashPart) {
      findings.hashAnchors.push({ ...entry, value: `#${hashPart}`, route: logical });
    }

    const kind = classifyRoute(logical, PUBLIC_ROUTES, MAINTAINER_ROUTES);
    const routed = { ...entry, value: expanded, logical };
    if (kind === "public") findings.publicRoutes.push(routed);
    else if (kind === "maintainer") findings.maintainerRoutes.push(routed);
    else if (logical.startsWith("/src/") || logical === "/src") {
      findings.bundlerEntries.push(routed);
    } else findings.unknownRoutes.push(routed);
    return;
  }

  findings.unknownRoutes.push(entry);
}

const PATTERNS = [
  { re: /href=["']([^"']*)["']/g, label: "href" },
  { re: /\bto=["']([^"']*)["']/g, label: "to" },
  { re: /\bsrc=["']([^"']*)["']/g, label: "src" },
  { re: /from\s+["'](@\/assets\/[^"']+)["']/g, label: "asset-import" },
  { re: /:\s*["'](https?:\/\/[^"']+)["']/g, label: "data-url" },
  { re: /(?:href|to|src)=\{`([^`]*)`\}/g, label: "tpl" },
  { re: /(?:href|to|src)=\{([A-Za-z_][\w.]+)\}/g, label: "dynamic-expr" },
  { re: /\b(?:href|to):\s*["']([^"']*)["']/g, label: "data-href" },
];

const files = [
  ...walk(SRC, [".tsx", ".ts", ".html"]),
  ...walk(PUBLIC_DIR, [".html"]),
  join(ROOT, "index.html"),
];

for (const file of files) {
  let src;
  try { src = readFileSync(file, "utf8"); } catch { continue; }

  SECTION_ID_RE.lastIndex = 0;
  let idm;
  while ((idm = SECTION_ID_RE.exec(src)) !== null) considerId(idm[1]);

  for (const { re, label } of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src)) !== null) {
      const lineNum = src.slice(0, m.index).split("\n").length;
      if (label === "dynamic-expr") {
        findings.dynamicRefs.push({
          file: relative(ROOT, file).replace(/\\/g, "/"),
          line: lineNum,
          label,
          value: m[1],
        });
        continue;
      }
      categorize(m[1], label, file, lineNum);
    }
  }
}

function assetExists(value, logical) {
  const v = expandInterpolations(value);
  if (v.startsWith("@/assets/")) {
    return existsSync(join(SRC, "assets", v.slice("@/assets/".length)));
  }
  const path = logical || stripBasename(v.split("?")[0].split("#")[0]);
  const rel = path.replace(/^\//, "");
  return existsSync(join(PUBLIC_DIR, rel)) || existsSync(join(ROOT, rel));
}

function uniqEntries(arr) {
  const seen = new Set();
  const out = [];
  for (const e of arr) {
    const k = `${e.file}:${e.line}:${e.value}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}

for (const key of Object.keys(findings)) {
  findings[key] = uniqEntries(findings[key]);
}

const missingAssets = findings.assetPaths.filter((e) => !assetExists(e.value, e.logical));

const brokenAnchors = findings.hashAnchors.filter((e) => {
  const id = e.value.replace(/^#/, "");
  if (!id) return true;
  return !allIds.has(id);
});

const headerNavUnresolved = HEADER_NAV.filter((n) => classifyRoute(n.to, PUBLIC_ROUTES, MAINTAINER_ROUTES) !== "public");

const brokenPublicRoutes = findings.unknownRoutes.filter((e) => {
  const logical = e.logical || stripBasename((e.value || "").split("?")[0].split("#")[0]);
  return logical.startsWith("/");
});

function fmt(arr) {
  if (!arr.length) return "  _(none)_\n";
  return arr.map((e) => {
    const shown = e.value === "" ? "(empty)" : e.value;
    return `  - \`${shown}\`${e.logical && e.logical !== e.value ? ` → \`${e.logical}\`` : ""} — ${e.file}:${e.line}`;
  }).join("\n") + "\n";
}

function uniqValues(arr) {
  const seen = new Set();
  const out = [];
  for (const e of arr) {
    if (seen.has(e.value)) continue;
    seen.add(e.value);
    out.push(e);
  }
  return out;
}

const uniqueExternals = uniqValues(findings.externalUrls);
const cathedralStillPresent = uniqueExternals.some((e) => e.value.includes("cathedral_probe_architecture"));

const report = `# LINK_AUDIT.md
_Generated by \`npm run audit:links\` on ${new Date().toISOString().slice(0, 10)}_

This report is a **static** public-readiness check. It derives routes from
\`src/App.tsx\`, public header navigation from \`src/components/AppHeader.tsx\`,
crawler disallows from \`public/robots.txt\`, and the production basename from
\`vite.config.ts\` (\`${BASENAME}\`).

React Router \`to\` / \`href\` values are matched **without** requiring the
basename prefix. A link to \`/atlas\` and a link to \`${BASENAME_NO_SLASH}/atlas\`
are the same public route. Basename-only differences are not failures.

Maintainer routes (\`/mission\`, \`/dashboard\`, \`/projects/*\`) are registered
and reachable directly, but they are **not** public navigation requirements.

---

## Derived route classification

**Production basename:** \`${BASENAME}\`

**Public routes (from \`App.tsx\`, minus maintainer):**

${PUBLIC_ROUTES.map((r) => `- \`${r}\``).join("\n")}

**Maintainer / internal routes (robots.txt Disallow ∪ matching App routes):**

${MAINTAINER_ROUTES.map((r) => `- \`${r}\``).join("\n")}

**Public header navigation (\`AppHeader\` NAV_LINKS):**

${HEADER_NAV.map((n) => `- ${n.label} → \`${n.to}\``).join("\n")}

${headerNavUnresolved.length ? `**WARNING:** header nav entries that do not match a public route:\n${fmt(headerNavUnresolved.map((n) => ({ value: n.to, file: "src/components/AppHeader.tsx", line: "?" })))}` : "All header nav entries resolve to public routes."}

---

## Summary

| Category | Count |
|---|---|
| Public internal route links | ${findings.publicRoutes.length} |
| Maintainer internal route links | ${findings.maintainerRoutes.length} |
| Unknown / unresolved internal routes | ${findings.unknownRoutes.length} |
| Vite bundler entries | ${findings.bundlerEntries.length} |
| Hash anchor links | ${findings.hashAnchors.length} |
| External URLs | ${findings.externalUrls.length} (${uniqueExternals.length} unique) |
| Asset paths | ${findings.assetPaths.length} |
| Dynamic refs | ${findings.dynamicRefs.length} |
| Placeholders found | ${findings.placeholders.length} |
| Seed/test data URLs | ${findings.seedData.length} |

---

## Broken public internal routes

${brokenPublicRoutes.length ? fmt(brokenPublicRoutes) : "  _(none — all public internal routes resolve against App.tsx + basename)_\n"}

Unclassified scan hits that are not leading-slash routes (SVG attributes, relative tokens) — not failures:

${fmt(findings.unknownRoutes.filter((e) => {
  const logical = e.logical || (e.value || "");
  return !logical.startsWith("/");
}))}

## Maintainer-internal links (not public navigation)

These resolve to registered maintainer routes. They are **not** public-nav
requirements and are not treated as audit failures.

${fmt(findings.maintainerRoutes)}

## Vite bundler entries (not public routes)

${fmt(findings.bundlerEntries)}
## Broken hash anchors

${brokenAnchors.length ? fmt(brokenAnchors) : "  _(none — all hash anchors match an \`id=\` in \`src/\`)_\n"}

Section ids discovered: ${sectionIds.size} (plus ${allIds.size - sectionIds.size} svg/form ids retained for target matching).

## Intentionally placeholder / disabled links

${findings.placeholders.length ? fmt(findings.placeholders) : "  _(none)_\n"}

---

## External links (listed; not required to be live-fetched)

${fmt(uniqueExternals)}

### Notes on specific external links

| URL | Note |
|---|---|
| \`https://xprimeray.github.io/GD_xPRIMEray/\` | xPRIMEray main docs — public outbound |
| \`https://github.com/AetherTopologist/GD_xPRIMEray\` | Engine repository — public outbound |
${cathedralStillPresent ? "| `https://xprimeray.github.io/GD_xPRIMEray/Research/cathedral_probe_architecture/` | Still referenced from Research.tsx — **unverified** live page; adjacent finding only |\n" : ""}| Wikipedia / personal-site inspiration URLs | Assumed live; not fetched this run |
| NASA/Hubble Saturn decagon | Recorded in inspiration queue; cited from Saturn Polygon Lab |

---

## Asset paths

${fmt(findings.assetPaths)}
${missingAssets.length ? `**Missing assets (${missingAssets.length}):**\n${fmt(missingAssets)}` : "All scanned asset paths resolve under `public/` or `src/assets/`."}

---

## Dynamic references (runtime / interpolated)

${fmt(findings.dynamicRefs)}
These are not statically verifiable (user-provided URLs, GitHub API fields, template ids).

---

## Seed / test data URLs (intentional non-real URLs)

${fmt(findings.seedData)}
These appear in seed/placeholder data. Not real destinations.

---

## Auditor contract

- Public Observatory/demo routes are first-class known routes.
- \`/auth\` is **not** a current route and is not in the known-route set.
- \`/mission\`, \`/dashboard\`, and \`/projects/*\` are maintainer — direct route
  preserved, public discoverability not required.
- Do not treat a missing basename prefix on an otherwise valid public route as broken.
`;

const outPath = join(ROOT, "LINK_AUDIT.md");
writeFileSync(outPath, report, "utf8");

const failCount = brokenPublicRoutes.length + brokenAnchors.length + missingAssets.length + headerNavUnresolved.length;

console.log("\n=== MisterY Labs Link Audit ===\n");
console.log(`Basename: ${BASENAME}`);
console.log(`Scanned ${files.length} files`);
console.log(`Public routes (derived): ${PUBLIC_ROUTES.length}`);
console.log(`Maintainer routes (derived): ${MAINTAINER_ROUTES.join(", ")}`);
console.log(`Public internal links: ${findings.publicRoutes.length}`);
console.log(`Maintainer internal links: ${findings.maintainerRoutes.length}`);
console.log(`Hash anchors: ${findings.hashAnchors.length}`);
console.log(`External URLs: ${findings.externalUrls.length} (${uniqueExternals.length} unique)`);
console.log(`Asset paths: ${findings.assetPaths.length}`);
console.log(`Placeholders: ${findings.placeholders.length}`);
console.log(`\nBroken public routes: ${brokenPublicRoutes.length}`);
console.log(`Broken hash anchors: ${brokenAnchors.length}`);
console.log(`Missing assets: ${missingAssets.length}`);
if (brokenPublicRoutes.length) {
  console.log("\nBROKEN PUBLIC ROUTES:");
  brokenPublicRoutes.forEach((e) => console.log(`  ${e.value} — ${e.file}:${e.line}`));
}
if (brokenAnchors.length) {
  console.log("\nBROKEN ANCHORS:");
  brokenAnchors.forEach((e) => console.log(`  ${e.value} — ${e.file}:${e.line}`));
}
if (missingAssets.length) {
  console.log("\nMISSING ASSETS:");
  missingAssets.forEach((e) => console.log(`  ${e.value} — ${e.file}:${e.line}`));
}
console.log(`\nReport written to LINK_AUDIT.md`);
if (failCount) {
  console.log(`\nFAIL — ${failCount} unresolved public-readiness item(s).\n`);
  process.exit(1);
}
console.log("\nPASS — no unresolved public routes, anchors, or assets.\n");
