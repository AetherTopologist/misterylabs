#!/usr/bin/env tsx
import { execSync, spawn, type ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { firefox, type Browser, type Page } from "playwright";

type Theme = "dark" | "light";
type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type Category =
  | "text-contrast"
  | "annotation-plate-coverage"
  | "panel-hierarchy"
  | "graph-prominence"
  | "viewport-scaling"
  | "mobile-tablet-adaptation"
  | "light-dark-consistency";

interface RouteSpec {
  slug: string;
  path: string;
}

interface ViewportSpec {
  name: string;
  width: number;
  height: number;
}

interface Finding {
  id: string;
  severity: Severity;
  category: Category;
  route: string;
  theme: Theme | "both";
  viewport: string;
  title: string;
  evidence: string;
  details: string;
  selector?: string;
  metric?: Record<string, number | string | boolean>;
  affectedViewports?: string[];
  affectedThemes?: string[];
  affectedScreenshots?: string[];
  occurrenceCount?: number;
}

interface PageMetrics {
  textSamples: number;
  contrastFailures: number;
  worstContrastRatio: number;
  annotationCandidates: number;
  platedAnnotations: number;
  floatingTextCount: number;
  clippedElements: number;
  bodyOverflowX: number;
  smallTouchTargets: number;
  panelCount: number;
  weakPanels: number;
  graphCount: number;
  largestGraphAreaRatio: number;
  svgLabelCount: number;
  smallSvgLabels: number;
  overlappingSvgLabels: number;
  screenshot: string;
}

interface Snapshot {
  route: RouteSpec;
  theme: Theme;
  viewport: ViewportSpec;
  metrics: PageMetrics;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = "http://localhost:4173/misterylabs";
const REPORT_DIR = path.join(ROOT, "reports");
const TODAY = new Date().toISOString().slice(0, 10);
const SCREENSHOT_DIR = path.join(REPORT_DIR, "visual-qa", TODAY);
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

const VIEWPORTS: ViewportSpec[] = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "laptop-sm-1024", width: 1024, height: 768 },
  { name: "laptop-1366", width: 1366, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "wide-1920", width: 1920, height: 1080 },
  { name: "ultra-2560", width: 2560, height: 1440 },
];

const THEMES: Theme[] = ["dark", "light"];
const GRAPH_ROUTES = new Set([
  "observatory-force-graph",
  "observatory-resonance-spheres",
  "observatory-fractal-inspiration",
  "observatory-transport-sphere",
  "observatory-poisson-dot",
  "observatory-quaternion",
  "observatory-higher-dimensional",
  "broch-sphere",
]);

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

function buildProject(): void {
  console.log("Building project for visual QA...");
  execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
}

async function captureSnapshot(
  page: Page,
  route: RouteSpec,
  theme: Theme,
  viewport: ViewportSpec,
): Promise<Snapshot> {
  await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle" });
  await page.evaluate((activeTheme: Theme) => {
    document.documentElement.classList.toggle("light", activeTheme === "light");
  }, theme);
  await page.waitForTimeout(SETTLE_MS);

  const viewportDir = path.join(SCREENSHOT_DIR, viewport.name);
  fs.mkdirSync(viewportDir, { recursive: true });

  const screenshotRel = path.join("visual-qa", TODAY, viewport.name, `${route.slug}-${theme}.png`);
  await page.screenshot({
    path: path.join(REPORT_DIR, screenshotRel),
    fullPage: false,
  });

  const metrics = (await page.evaluate(
    `(() => { const __name = (value) => value; return (${collectPageMetrics.toString()})(${JSON.stringify(screenshotRel)}); })()`,
  )) as PageMetrics;
  return { route, theme, viewport, metrics };
}

function collectPageMetrics(screenshot: string): PageMetrics {
  function __name<T>(value: T): T {
    return value;
  }

  const viewportArea = Math.max(1, window.innerWidth * window.innerHeight);

  const parseColor = (value: string): [number, number, number, number] | null => {
    const raw = value.trim();
    if (!raw || raw === "transparent") return null;
    const match = raw.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1].split(",").map((part) => part.trim());
    const r = Number(parts[0]);
    const g = Number(parts[1]);
    const b = Number(parts[2]);
    const a = parts[3] === undefined ? 1 : Number(parts[3]);
    if ([r, g, b, a].some((part) => Number.isNaN(part))) return null;
    return [r, g, b, a];
  };

  const channel = (value: number): number => {
    const normalized = value / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  const luminance = ([r, g, b]: [number, number, number]): number =>
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

  const contrast = (fg: [number, number, number], bg: [number, number, number]): number => {
    const a = luminance(fg);
    const b = luminance(bg);
    const lighter = Math.max(a, b);
    const darker = Math.min(a, b);
    return (lighter + 0.05) / (darker + 0.05);
  };

  const elementBg = (el: Element): [number, number, number] => {
    let current: Element | null = el;
    while (current) {
      const color = parseColor(getComputedStyle(current).backgroundColor);
      if (color && color[3] >= 0.35) return [color[0], color[1], color[2]];
      current = current.parentElement;
    }
    const body = parseColor(getComputedStyle(document.body).backgroundColor);
    return body ? [body[0], body[1], body[2]] : [255, 255, 255];
  };

  const hasPlate = (el: Element): boolean => {
    let current: Element | null = el;
    let depth = 0;
    while (current && depth < 5) {
      const style = getComputedStyle(current);
      const bg = parseColor(style.backgroundColor);
      const hasBg = Boolean(bg && bg[3] >= 0.25);
      const hasBorder =
        Number.parseFloat(style.borderTopWidth) > 0 ||
        Number.parseFloat(style.borderRightWidth) > 0 ||
        Number.parseFloat(style.borderBottomWidth) > 0 ||
        Number.parseFloat(style.borderLeftWidth) > 0;
      const hasShadow = style.boxShadow !== "none";
      if (hasBg || hasBorder || hasShadow) return true;
      current = current.parentElement;
      depth += 1;
    }
    return false;
  };

  const isVisible = (el: Element): boolean => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return (
      rect.width > 1 &&
      rect.height > 1 &&
      style.visibility !== "hidden" &&
      style.display !== "none" &&
      Number(style.opacity) > 0.05
    );
  };

  let textSamples = 0;
  let contrastFailures = 0;
  let worstContrastRatio = 99;
  let annotationCandidates = 0;
  let platedAnnotations = 0;
  let floatingTextCount = 0;
  let clippedElements = 0;
  let smallTouchTargets = 0;
  let panelCount = 0;
  let weakPanels = 0;

  const elements = Array.from(document.body.querySelectorAll<HTMLElement>("body *"))
    .filter((el) => isVisible(el))
    .filter((el) => !["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName));

  for (const el of elements) {
    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    const ownText = Array.from(el.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent ?? "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const fontSize = Number.parseFloat(style.fontSize);
    const fontWeight = Number.parseFloat(style.fontWeight) || 400;
    const letterSpacing = Number.parseFloat(style.letterSpacing) || 0;
    const fgRaw = parseColor(style.color);

    if (ownText.length >= 2 && fgRaw) {
      const bg = elementBg(el);
      const ratio = contrast([fgRaw[0], fgRaw[1], fgRaw[2]], bg);
      const required = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 600) ? 3 : 4.5;
      textSamples += 1;
      worstContrastRatio = Math.min(worstContrastRatio, ratio);
      if (ratio < required) contrastFailures += 1;
    }

    const uppercaseish =
      text.length >= 4 &&
      text.length <= 80 &&
      text.toUpperCase() === text &&
      /[A-Z]/.test(text);
    const annotationCandidate =
      (uppercaseish && fontSize <= 12.5) ||
      (fontSize <= 11 && letterSpacing >= 1.2) ||
      style.fontFamily.toLowerCase().includes("mono");

    if (ownText && annotationCandidate) {
      annotationCandidates += 1;
      if (hasPlate(el)) {
        platedAnnotations += 1;
      } else {
        floatingTextCount += 1;
      }
    }

    const overflowX = el.scrollWidth - el.clientWidth;
    const overflowY = el.scrollHeight - el.clientHeight;
    if (
      (overflowX > 3 || overflowY > 3) &&
      ["hidden", "clip"].includes(style.overflow) &&
      text.length > 0
    ) {
      clippedElements += 1;
    }

    const interactive =
      el.matches("a, button, input, select, textarea, [role='button'], [tabindex='0']") &&
      !el.hasAttribute("disabled");
    if (
      interactive &&
      window.innerWidth <= 768 &&
      text.length > 0 &&
      (rect.width < 44 || rect.height < 36)
    ) {
      smallTouchTargets += 1;
    }

    const bg = parseColor(style.backgroundColor);
    const hasBorder = Number.parseFloat(style.borderTopWidth) > 0;
    const areaRatio = (rect.width * rect.height) / viewportArea;
    const panelLike =
      areaRatio > 0.025 &&
      (hasBorder || style.boxShadow !== "none" || Boolean(bg && bg[3] >= 0.25));
    if (panelLike) {
      panelCount += 1;
      const bgAlpha = bg?.[3] ?? 0;
      const weakBorder =
        hasBorder && parseColor(style.borderTopColor) ? Number.parseFloat(style.borderTopWidth) <= 1 : true;
      if (bgAlpha < 0.35 && weakBorder && style.boxShadow === "none") weakPanels += 1;
    }
  }

  const graphs = Array.from(document.querySelectorAll<HTMLElement>("svg, canvas"));
  let largestGraphAreaRatio = 0;
  for (const graph of graphs) {
    if (!isVisible(graph)) continue;
    const rect = graph.getBoundingClientRect();
    largestGraphAreaRatio = Math.max(largestGraphAreaRatio, (rect.width * rect.height) / viewportArea);
  }

  const svgTexts = Array.from(document.querySelectorAll<SVGTextElement>("svg text"));
  let svgLabelCount = 0;
  let smallSvgLabels = 0;
  let overlappingSvgLabels = 0;
  const boxes: DOMRect[] = [];
  for (const label of svgTexts) {
    const rect = label.getBoundingClientRect();
    if (rect.width <= 1 || rect.height <= 1) continue;
    svgLabelCount += 1;
    const size = Number.parseFloat(getComputedStyle(label).fontSize);
    if (size < 10) smallSvgLabels += 1;
    for (const box of boxes) {
      const overlap =
        rect.left < box.right &&
        rect.right > box.left &&
        rect.top < box.bottom &&
        rect.bottom > box.top;
      if (overlap) overlappingSvgLabels += 1;
    }
    boxes.push(rect);
  }

  return {
    textSamples,
    contrastFailures,
    worstContrastRatio: worstContrastRatio === 99 ? 0 : Number(worstContrastRatio.toFixed(2)),
    annotationCandidates,
    platedAnnotations,
    floatingTextCount,
    clippedElements,
    bodyOverflowX: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
    smallTouchTargets,
    panelCount,
    weakPanels,
    graphCount: graphs.filter((graph) => isVisible(graph)).length,
    largestGraphAreaRatio: Number(largestGraphAreaRatio.toFixed(3)),
    svgLabelCount,
    smallSvgLabels,
    overlappingSvgLabels,
    screenshot,
  };
}

function classify(snapshot: Snapshot): Finding[] {
  const { route, theme, viewport, metrics } = snapshot;
  const findings: Omit<Finding, "id">[] = [];
  const annotationCoverage =
    metrics.annotationCandidates === 0
      ? 1
      : metrics.platedAnnotations / metrics.annotationCandidates;
  const mobileOrTablet = viewport.width <= 768;

  if (metrics.contrastFailures > 0) {
    findings.push({
      severity: metrics.contrastFailures >= 8 || metrics.worstContrastRatio < 2 ? "HIGH" : "MEDIUM",
      category: "text-contrast",
      route: route.slug,
      theme,
      viewport: viewport.name,
      title: "Text contrast failures detected against rendered surfaces",
      evidence: metrics.screenshot,
      details: `${metrics.contrastFailures}/${metrics.textSamples} text samples failed WCAG-style contrast thresholds. Worst sampled ratio: ${metrics.worstContrastRatio}:1.`,
      metric: {
        failures: metrics.contrastFailures,
        samples: metrics.textSamples,
        worstContrastRatio: metrics.worstContrastRatio,
      },
    });
  }

  if (metrics.floatingTextCount >= 3 || annotationCoverage < 0.55) {
    findings.push({
      severity: theme === "light" && annotationCoverage < 0.5 ? "HIGH" : "MEDIUM",
      category: "annotation-plate-coverage",
      route: route.slug,
      theme,
      viewport: viewport.name,
      title: "Floating annotation text lacks dedicated surfaces",
      evidence: metrics.screenshot,
      details: `${metrics.floatingTextCount} annotation-like labels appear without a nearby plate. Coverage: ${(annotationCoverage * 100).toFixed(0)}%.`,
      metric: {
        floatingTextCount: metrics.floatingTextCount,
        annotationCandidates: metrics.annotationCandidates,
        platedAnnotations: metrics.platedAnnotations,
        annotationCoverage: Number(annotationCoverage.toFixed(2)),
      },
    });
  }

  if (metrics.clippedElements > 0 || metrics.bodyOverflowX > 8) {
    findings.push({
      severity: mobileOrTablet || metrics.bodyOverflowX > 80 ? "CRITICAL" : "HIGH",
      category: "viewport-scaling",
      route: route.slug,
      theme,
      viewport: viewport.name,
      title: "Clipped or horizontally overflowing content detected",
      evidence: metrics.screenshot,
      details: `${metrics.clippedElements} clipped text/content elements; body horizontal overflow ${metrics.bodyOverflowX}px.`,
      metric: {
        clippedElements: metrics.clippedElements,
        bodyOverflowX: metrics.bodyOverflowX,
      },
    });
  }

  if (mobileOrTablet && metrics.smallTouchTargets > 0) {
    findings.push({
      severity: metrics.smallTouchTargets >= 6 ? "HIGH" : "MEDIUM",
      category: "mobile-tablet-adaptation",
      route: route.slug,
      theme,
      viewport: viewport.name,
      title: "Mobile/tablet interactive targets below comfortable size",
      evidence: metrics.screenshot,
      details: `${metrics.smallTouchTargets} interactive targets with text are smaller than the audit floor.`,
      metric: { smallTouchTargets: metrics.smallTouchTargets },
    });
  }

  if (metrics.panelCount > 0 && metrics.weakPanels / metrics.panelCount > 0.3) {
    findings.push({
      severity: theme === "light" ? "HIGH" : "MEDIUM",
      category: "panel-hierarchy",
      route: route.slug,
      theme,
      viewport: viewport.name,
      title: "Weak panel separation detected",
      evidence: metrics.screenshot,
      details: `${metrics.weakPanels}/${metrics.panelCount} panel-like surfaces have weak background, border, or shadow separation.`,
      metric: {
        weakPanels: metrics.weakPanels,
        panelCount: metrics.panelCount,
      },
    });
  }

  if (GRAPH_ROUTES.has(route.slug) && metrics.largestGraphAreaRatio < 0.2) {
    findings.push({
      severity: "MEDIUM",
      category: "graph-prominence",
      route: route.slug,
      theme,
      viewport: viewport.name,
      title: "Primary graph or canvas is visually under-prominent",
      evidence: metrics.screenshot,
      details: `Largest SVG/canvas occupies ${(metrics.largestGraphAreaRatio * 100).toFixed(1)}% of the viewport.`,
      metric: {
        graphCount: metrics.graphCount,
        largestGraphAreaRatio: metrics.largestGraphAreaRatio,
      },
    });
  }

  if (metrics.smallSvgLabels > 0 || metrics.overlappingSvgLabels > 0) {
    findings.push({
      severity: metrics.overlappingSvgLabels > 0 ? "HIGH" : "MEDIUM",
      category: "graph-prominence",
      route: route.slug,
      theme,
      viewport: viewport.name,
      title: "Unreadable graph labels detected",
      evidence: metrics.screenshot,
      details: `${metrics.smallSvgLabels} SVG labels below 10px; ${metrics.overlappingSvgLabels} label overlaps detected.`,
      metric: {
        svgLabelCount: metrics.svgLabelCount,
        smallSvgLabels: metrics.smallSvgLabels,
        overlappingSvgLabels: metrics.overlappingSvgLabels,
      },
    });
  }

  return findings.map((finding, index) => ({
    ...finding,
    id: `${route.slug}-${theme}-${viewport.name}-${index + 1}`,
  }));
}

function consistencyFindings(snapshots: Snapshot[]): Finding[] {
  const findings: Finding[] = [];
  const byKey = new Map<string, { dark?: Snapshot; light?: Snapshot }>();
  for (const snapshot of snapshots) {
    const key = `${snapshot.route.slug}:${snapshot.viewport.name}`;
    const entry = byKey.get(key) ?? {};
    entry[snapshot.theme] = snapshot;
    byKey.set(key, entry);
  }

  let index = 1;
  for (const { dark, light } of byKey.values()) {
    if (!dark || !light) continue;
    const contrastDelta = light.metrics.contrastFailures - dark.metrics.contrastFailures;
    const weakPanelDelta = light.metrics.weakPanels - dark.metrics.weakPanels;
    const floatingDelta = light.metrics.floatingTextCount - dark.metrics.floatingTextCount;

    if (contrastDelta >= 5 || weakPanelDelta >= 4 || floatingDelta >= 5) {
      findings.push({
        id: `theme-consistency-${index}`,
        severity: contrastDelta >= 10 || weakPanelDelta >= 8 ? "HIGH" : "MEDIUM",
        category: "light-dark-consistency",
        route: light.route.slug,
        theme: "both",
        viewport: light.viewport.name,
        title: "Hierarchy degrades in light mode compared with dark mode",
        evidence: light.metrics.screenshot,
        details: `Light mode adds ${contrastDelta} contrast failures, ${weakPanelDelta} weak panels, and ${floatingDelta} floating annotations versus dark mode.`,
        metric: {
          contrastDelta,
          weakPanelDelta,
          floatingDelta,
        },
      });
      index += 1;
    }
  }
  return findings;
}

function aggregateFindings(observations: Finding[]): Finding[] {
  const severityRank: Record<Severity, number> = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  };
  const byIssue = new Map<string, Finding[]>();

  for (const observation of observations) {
    const key = [
      observation.route,
      observation.category,
      observation.title,
      observation.theme === "both" ? "both" : "theme-specific",
    ].join("::");
    const group = byIssue.get(key) ?? [];
    group.push(observation);
    byIssue.set(key, group);
  }

  const grouped = Array.from(byIssue.values()).map((group) => {
    const strongest = group.reduce((best, current) =>
      severityRank[current.severity] > severityRank[best.severity] ? current : best,
    );
    const affectedViewports = Array.from(new Set(group.map((finding) => finding.viewport))).sort();
    const affectedThemes = Array.from(new Set(group.map((finding) => finding.theme))).sort();
    const affectedScreenshots = Array.from(new Set(group.map((finding) => finding.evidence))).sort();
    const occurrenceCount = group.length;

    return {
      ...strongest,
      theme: affectedThemes.length === 1 ? strongest.theme : "both",
      viewport: affectedViewports.length === 1 ? strongest.viewport : "multiple",
      evidence: affectedScreenshots[0] ?? strongest.evidence,
      details: `${strongest.details} Observed in ${occurrenceCount} screenshot${occurrenceCount === 1 ? "" : "s"}.`,
      affectedViewports,
      affectedThemes,
      affectedScreenshots,
      occurrenceCount,
    } satisfies Finding;
  });

  return grouped
    .sort((a, b) => {
      const severityDelta = severityRank[b.severity] - severityRank[a.severity];
      if (severityDelta !== 0) return severityDelta;
      return `${a.route}:${a.category}`.localeCompare(`${b.route}:${b.category}`);
    })
    .map((finding, index) => ({
      ...finding,
      id: `VQA-${String(index + 1).padStart(3, "0")}`,
    }));
}

function summarize(findings: Finding[]): Record<Severity, number> {
  return {
    CRITICAL: findings.filter((finding) => finding.severity === "CRITICAL").length,
    HIGH: findings.filter((finding) => finding.severity === "HIGH").length,
    MEDIUM: findings.filter((finding) => finding.severity === "MEDIUM").length,
    LOW: findings.filter((finding) => finding.severity === "LOW").length,
  };
}

function writeReports(snapshots: Snapshot[], findings: Finding[], observations: Finding[]): void {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const summary = summarize(findings);
  const reportJson = {
    meta: {
      generatedAt: new Date().toISOString(),
      routes: ROUTES,
      themes: THEMES,
      viewports: VIEWPORTS,
      screenshotRoot: path.relative(ROOT, SCREENSHOT_DIR),
      screenshotCount: snapshots.length,
      criteria: [
        "text contrast",
        "annotation plate coverage",
        "panel hierarchy",
        "graph prominence",
        "viewport scaling",
        "mobile/tablet adaptation",
        "light/dark consistency",
      ],
    },
    summary,
    findings,
    observations,
    snapshots: snapshots.map((snapshot) => ({
      route: snapshot.route.slug,
      theme: snapshot.theme,
      viewport: snapshot.viewport.name,
      metrics: snapshot.metrics,
    })),
  };

  fs.writeFileSync(
    path.join(REPORT_DIR, "visual_qa_report.json"),
    JSON.stringify(reportJson, null, 2),
  );

  const bySeverity = findings.reduce<Record<Severity, Finding[]>>(
    (acc, finding) => {
      acc[finding.severity].push(finding);
      return acc;
    },
    { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [] },
  );

  const findingRows = findings
    .map(
      (finding) =>
        `| ${finding.id} | ${finding.severity} | ${finding.category} | ${finding.route} | ${finding.theme} | ${finding.viewport} | ${finding.occurrenceCount ?? 1} | ${finding.title} |`,
    )
    .join("\n");

  const severitySections = (["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Severity[])
    .map((severity) => {
      const items = bySeverity[severity];
      if (items.length === 0) return `## ${severity}\n\nNo findings.`;
      return `## ${severity}\n\n${items
        .map(
          (finding) => `### ${finding.id} — ${finding.title}

- Category: ${finding.category}
- Route: \`${finding.route}\`
- Theme / viewport: \`${finding.theme}\` / \`${finding.viewport}\`
- Occurrences: ${finding.occurrenceCount ?? 1}
- Affected viewports: ${(finding.affectedViewports ?? [finding.viewport]).map((item) => `\`${item}\``).join(", ")}
- Screenshot: \`${finding.evidence}\`
- Details: ${finding.details}`,
        )
        .join("\n\n")}`;
    })
    .join("\n\n");

  const markdown = `# MisterY Labs Visual QA Report

Generated: ${reportJson.meta.generatedAt}

This report is produced by \`npm run visual:qa\`. It audits every configured route across ${THEMES.length} themes and ${VIEWPORTS.length} viewports, captures screenshots, and emits DOM-measured findings for the MisterY Labs visual hierarchy doctrine.

## Coverage

- Routes: ${ROUTES.length}
- Themes: ${THEMES.join(", ")}
- Viewports: ${VIEWPORTS.map((viewport) => `${viewport.name} (${viewport.width}x${viewport.height})`).join(", ")}
- Screenshots: ${snapshots.length}
- Screenshot root: \`${path.relative(ROOT, SCREENSHOT_DIR)}\`

## Summary

| Severity | Count |
|---|---:|
| CRITICAL | ${summary.CRITICAL} |
| HIGH | ${summary.HIGH} |
| MEDIUM | ${summary.MEDIUM} |
| LOW | ${summary.LOW} |
| Total | ${findings.length} |

## Finding Index

| ID | Severity | Category | Route | Theme | Viewport | Occurrences | Title |
|---|---|---|---|---|---|---:|---|
${findingRows || "| - | - | - | - | - | - | 0 | No findings |"}

${severitySections}
`;

  fs.writeFileSync(path.join(REPORT_DIR, "visual_qa_report.md"), markdown);
}

async function main(): Promise<void> {
  buildProject();
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  let previewProc: ChildProcess | null = null;
  if (!(await isServerRunning())) {
    console.log("Starting vite preview for visual QA...");
    previewProc = spawn("npx", ["vite", "preview", "--port", "4173"], {
      cwd: ROOT,
      stdio: "pipe",
    });
    await waitForServer();
  }

  const snapshots: Snapshot[] = [];
  const browser: Browser = await firefox.launch({ headless: true });

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
          snapshots.push(await captureSnapshot(page, route, theme, viewport));
          console.log("done");
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
    if (previewProc) previewProc.kill();
  }

  const observations = [...snapshots.flatMap(classify), ...consistencyFindings(snapshots)];
  const findings = aggregateFindings(observations);

  writeReports(snapshots, findings, observations);
  console.log(`\nVisual QA complete: reports/visual_qa_report.md`);
  console.log(`Machine report: reports/visual_qa_report.json`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
