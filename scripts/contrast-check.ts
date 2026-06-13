#!/usr/bin/env tsx
/**
 * WCAG contrast checker for the MisterY Labs luminance token system.
 *
 * Computes relative luminance (WCAG 2.1 §1.4.3) for every token pair and
 * reports pass/fail against the appropriate success criterion:
 *
 *   AA normal  ≥ 4.5:1  — prose text (< 18pt / < 14pt bold)
 *   AA large   ≥ 3.0:1  — large text (≥ 18pt or ≥ 14pt bold) and graphical elements
 *   AAA normal ≥ 7.0:1
 */

// ── Types ────────────────────────────────────────────────────────────────────

type HSL = [number, number, number]; // [H 0-360, S 0-100, L 0-100]
type Level = 'AA' | 'AA-large' | 'AAA';

interface PairSpec {
  label: string;
  fg: HSL;
  bg: HSL;
  required: Level;
}

interface ThemeSpec {
  name: string;
  // layer tokens
  layerPage: HSL;
  layerDiagram: HSL;
  layerPanel: HSL;
  layerPanelStrong: HSL;
  // ink tokens
  inkPrimary: HSL;
  inkSecondary: HSL;
  inkMuted: HSL;
  inkAmbient: HSL;
  // annotation spot colors
  annotationCyan: HSL;
  annotationAmber: HSL;
}

// ── WCAG math ────────────────────────────────────────────────────────────────

function relativeLuminance([h, s, l]: HSL): number {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hPrime = h / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if      (hPrime < 1) { r = c; g = x; b = 0; }
  else if (hPrime < 2) { r = x; g = c; b = 0; }
  else if (hPrime < 3) { r = 0; g = c; b = x; }
  else if (hPrime < 4) { r = 0; g = x; b = c; }
  else if (hPrime < 5) { r = x; g = 0; b = c; }
  else                  { r = c; g = 0; b = x; }

  const srgb = (v: number) => v + m;
  const lin  = (v: number) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

  return 0.2126 * lin(srgb(r)) + 0.7152 * lin(srgb(g)) + 0.0722 * lin(srgb(b));
}

function contrastRatio(fg: HSL, bg: HSL): number {
  const lf = relativeLuminance(fg);
  const lb = relativeLuminance(bg);
  const lighter = Math.max(lf, lb);
  const darker  = Math.min(lf, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

function evaluate(ratio: number, required: Level): { pass: boolean; badge: string } {
  const pass = (t: number) => ratio >= t;
  if (required === 'AA-large') {
    return {
      pass: pass(3.0),
      badge: pass(7.0) ? '✓ AAA' : pass(4.5) ? '✓ AA' : pass(3.0) ? '✓ AA-large' : '✗ FAIL',
    };
  }
  if (required === 'AA') {
    return {
      pass: pass(4.5),
      badge: pass(7.0) ? '✓ AAA' : pass(4.5) ? '✓ AA' : '✗ FAIL',
    };
  }
  // AAA
  return {
    pass: pass(7.0),
    badge: pass(7.0) ? '✓ AAA' : pass(4.5) ? '~ AA (not AAA)' : '✗ FAIL',
  };
}

// ── Token definitions ─────────────────────────────────────────────────────────

const DARK: ThemeSpec = {
  name: 'DARK',
  layerPage:         [230, 25,  7],
  layerDiagram:      [230, 22, 10],
  layerPanel:        [230, 22, 11],
  layerPanelStrong:  [230, 20, 13],
  inkPrimary:        [220, 25, 95],
  inkSecondary:      [220, 18, 75],
  inkMuted:          [220, 12, 62],
  inkAmbient:        [220, 12, 44],
  annotationCyan:    [188, 92, 58],
  annotationAmber:   [ 28, 95, 60],
};

const LIGHT: ThemeSpec = {
  name: 'LIGHT',
  layerPage:         [  0,  0, 99],
  layerDiagram:      [220, 12, 96],
  layerPanel:        [  0,  0,100],
  layerPanelStrong:  [220, 12, 94],
  inkPrimary:        [230, 20,  8],
  inkSecondary:      [220, 15, 22],
  inkMuted:          [220, 12, 32],
  inkAmbient:        [220, 12, 50],
  annotationCyan:    [188, 80, 35],
  annotationAmber:   [ 28, 90, 40],
};

// ── Build pair list from a theme spec ─────────────────────────────────────────

function buildPairs(t: ThemeSpec): PairSpec[] {
  return [
    {
      label: 'ink-primary      on layer-page',
      fg: t.inkPrimary, bg: t.layerPage,
      required: 'AA',
    },
    {
      label: 'ink-secondary    on layer-page',
      fg: t.inkSecondary, bg: t.layerPage,
      required: 'AA',
    },
    {
      label: 'ink-muted        on layer-panel',
      fg: t.inkMuted, bg: t.layerPanel,
      required: 'AA',
    },
    {
      label: 'ink-ambient      on layer-panel-strong',
      fg: t.inkAmbient, bg: t.layerPanelStrong,
      required: 'AA-large',
    },
    {
      label: 'cyan annotation  on layer-page',
      fg: t.annotationCyan, bg: t.layerPage,
      required: 'AA-large',
    },
    {
      label: 'cyan annotation  on layer-panel',
      fg: t.annotationCyan, bg: t.layerPanel,
      required: 'AA-large',
    },
    {
      label: 'amber annotation on layer-page',
      fg: t.annotationAmber, bg: t.layerPage,
      required: 'AA-large',
    },
    {
      label: 'amber annotation on layer-panel',
      fg: t.annotationAmber, bg: t.layerPanel,
      required: 'AA-large',
    },
  ];
}

// ── Reporting ─────────────────────────────────────────────────────────────────

function runTheme(spec: ThemeSpec): number {
  const pairs = buildPairs(spec);
  let failCount = 0;

  console.log(`\n${spec.name} MODE`);
  console.log('─'.repeat(68));

  for (const pair of pairs) {
    const ratio = contrastRatio(pair.fg, pair.bg);
    const { pass, badge } = evaluate(ratio, pair.required);
    if (!pass) failCount++;

    const ratioStr = ratio.toFixed(2).padStart(6);
    const reqStr   = `(req: ${pair.required})`;
    console.log(`  ${pair.label.padEnd(42)} ${ratioStr}:1  ${badge.padEnd(14)} ${reqStr}`);
  }

  return failCount;
}

// ── Entry point ───────────────────────────────────────────────────────────────

console.log('\nMisterY Labs — Luminance Token Contrast Audit');
console.log('══════════════════════════════════════════════════════════════════════');
console.log('Thresholds: AA ≥4.5:1 (prose) · AA-large ≥3.0:1 (graphical) · AAA ≥7.0:1');

const darkFails  = runTheme(DARK);
const lightFails = runTheme(LIGHT);
const total      = darkFails + lightFails;

console.log('\n' + '─'.repeat(68));

if (total === 0) {
  console.log('  All checks pass.\n');
} else {
  console.log(`  ${total} check${total > 1 ? 's' : ''} failed — see ✗ rows above.\n`);
  process.exit(1);
}
