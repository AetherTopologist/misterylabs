import {
  visualGain,
  type Particle,
  type SourceMode,
  type Station,
} from "@/lib/field-resonance";

export type Palette = {
  ink: string;
  paper: string;
  mute: string;
  copper: string;
  snap: string;
  rule: string;
};

export type Scene = {
  epsilon: number;
  ox: number;
  left: number;
  right: number;
  megagauss: number;
  source: SourceMode;
  charge: number;
  placed: boolean;
  station: Station;
  destAngle: number;
  spin: number;
  particles: Particle[];
  flash: number;
};

export type Layout = { s: number; cx: number; cy: number; w: number; h: number };

const INFLOW_Y = [0.34, 0.56, 0.78, 1.02];

function cssColor(name: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function readPalette(): Palette {
  return {
    ink: cssColor("--color-ink", "#0c1014"),
    paper: cssColor("--color-paper", "#e7e1d4"),
    mute: cssColor("--color-mute", "#8f978e"),
    copper: cssColor("--color-copper", "#e08a45"),
    snap: cssColor("--color-snap", "#3dccc7"),
    rule: cssColor("--color-rule", "#2c353e"),
  };
}

export function measure(canvas: HTMLCanvasElement, host: HTMLElement): Layout {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const w = Math.max(1, host.clientWidth);
  const h = Math.max(1, host.clientHeight);
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const s = Math.min(w, h) * 0.36 * dpr;
  return { s, cx: bw / 2, cy: bh / 2, w: bw, h: bh };
}

function xy(L: Layout, x: number, y: number): [number, number] {
  return [L.cx + x * L.s, L.cy - y * L.s];
}

function strokeWorld(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  pts: [number, number][],
  color: string,
  width: number,
  alpha: number,
  dash?: number[],
) {
  if (pts.length < 2 || alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.setLineDash(dash ?? []);
  ctx.beginPath();
  const [x0, y0] = xy(L, pts[0][0], pts[0][1]);
  ctx.moveTo(x0, y0);
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = xy(L, pts[i][0], pts[i][1]);
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function arrow(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  x: number,
  y: number,
  ang: number,
  color: string,
  alpha: number,
) {
  const [px, py] = xy(L, x, y);
  const size = Math.max(6, L.s * 0.042);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(-ang);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.72, size * 0.46);
  ctx.lineTo(-size * 0.72, -size * 0.46);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Antiparallel slabs. They bow toward the moving null but never cross it. */
function inflow(ySign: 1 | -1, y0: number, ox: number, neck: number): [number, number][] {
  const pts: [number, number][] = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const x = -1.2 + (2.4 * i) / steps;
    const pinch = Math.exp(-((x - ox) ** 2) / 0.22);
    const y = ySign * y0 * (1 - neck * 0.72 * pinch);
    pts.push([x, y]);
  }
  return pts;
}

/** Reconnected flux leaving sideways: a hairpin with the bend nearest the null. */
function hairpin(side: 1 | -1, scale: number, ox: number): [number, number][] {
  const pts: [number, number][] = [];
  const steps = 36;
  const amp = 0.1 + 0.16 * scale;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const bulge = Math.sin(Math.PI * t);
    const x = ox + side * (0.2 + scale * 0.78 * (1 - bulge) + 0.04 * bulge);
    const y = Math.cos(Math.PI * t) * amp;
    pts.push([x, y]);
  }
  return pts;
}

function disc(ctx: CanvasRenderingContext2D, L: Layout, pal: Palette) {
  const [cx, cy] = xy(L, 0, 0);
  const r = L.s * 0.125;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = pal.ink;
  ctx.strokeStyle = pal.copper;
  ctx.lineWidth = Math.max(1.4, L.s * 0.009);
  ctx.beginPath();
  ctx.moveTo(-r * 2.35, r * 0.22);
  ctx.lineTo(-r * 1.05, r * 0.38);
  ctx.lineTo(-r * 1.05, -r * 0.38);
  ctx.lineTo(-r * 2.35, -r * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r * 2.35, r * 0.22);
  ctx.lineTo(r * 1.05, r * 0.38);
  ctx.lineTo(r * 1.05, -r * 0.38);
  ctx.lineTo(r * 2.35, -r * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.28, r * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function laser(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  pal: Palette,
  x: number,
  y: number,
  hot: number,
) {
  const [px, py] = xy(L, x, y);
  const inward = x > 0 ? -1 : 1;
  const [tx, ty] = xy(L, x + inward * (0.08 + 0.16 * hot), y);
  ctx.save();
  ctx.strokeStyle = pal.copper;
  ctx.globalAlpha = 0.2 + 0.75 * hot;
  ctx.lineWidth = Math.max(2, L.s * (0.01 + 0.02 * hot));
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.globalAlpha = 1;
  const hw = L.s * 0.05;
  const hh = L.s * 0.034;
  ctx.fillStyle = pal.ink;
  ctx.strokeStyle = hot > 0.4 ? pal.copper : pal.mute;
  ctx.lineWidth = Math.max(1.25, L.s * 0.007);
  ctx.beginPath();
  ctx.rect(px - hw, py - hh, hw * 2, hh * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = pal.copper;
  ctx.globalAlpha = 0.3 + 0.7 * hot;
  ctx.fillRect(px - hw * 0.32, py - hh * 0.32, hw * 0.64, hh * 0.64);
  ctx.restore();
}

function orb(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  x: number,
  y: number,
  color: string,
  r: number,
  label?: string,
) {
  const [px, py] = xy(L, x, y);
  const rad = L.s * r;
  ctx.save();
  ctx.beginPath();
  ctx.arc(px, py, rad * 2.4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.16;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(px, py, rad, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (label) {
    ctx.fillStyle = "#0c1014";
    ctx.font = `500 ${Math.max(11, L.s * 0.05)}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, px, py + 0.5);
  }
  ctx.restore();
}

function chevrons(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  ox: number,
  fade: number,
  color: string,
) {
  if (fade < 0.08) return;
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < 3; i++) {
      const x = ox + side * (0.34 + i * 0.22);
      arrow(ctx, L, x, 0, side > 0 ? 0 : Math.PI, color, fade * (0.35 + 0.15 * i));
    }
  }
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  pal: Palette,
  scene: Scene,
) {
  const { w, h } = L;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = pal.ink;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = pal.rule;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = -1.2; gx <= 1.21; gx += 0.4) {
    const [sx, yTop] = xy(L, gx, 1.28);
    const [, yBot] = xy(L, gx, -1.28);
    ctx.moveTo(sx, yTop);
    ctx.lineTo(sx, yBot);
  }
  for (let gy = -1.2; gy <= 1.21; gy += 0.4) {
    const [x0, y0] = xy(L, -1.28, gy);
    const [x1, y1] = xy(L, 1.28, gy);
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
  }
  ctx.stroke();
  ctx.restore();

  const eps = Math.max(0, Math.min(1, (scene.epsilon - 0.1) / 0.9));
  const gain = visualGain(scene.megagauss);
  const neck = eps * eps;
  const fade = neck;
  const lw = Math.max(1.25, L.s * 0.008);

  const shock = 0.08 + 0.16 * fade;
  for (const side of [-1, 1] as const) {
    strokeWorld(ctx, L, [[scene.ox, 0], [scene.ox + side * 1.05, shock]], pal.paper, 1, 0.35 * fade, [3, 6]);
    strokeWorld(ctx, L, [[scene.ox, 0], [scene.ox + side * 1.05, -shock]], pal.paper, 1, 0.35 * fade, [3, 6]);
  }

  for (const y0 of INFLOW_Y) {
    for (const sign of [1, -1] as const) {
      const pts = inflow(sign, y0, scene.ox, neck);
      strokeWorld(ctx, L, pts, pal.copper, lw, 0.4 + 0.55 * gain);
      const ax = sign > 0 ? -0.82 : 0.82;
      const ay = sign * y0 * (1 - neck * 0.72 * Math.exp(-((ax - scene.ox) ** 2) / 0.22));
      arrow(ctx, L, ax, ay, sign > 0 ? 0 : Math.PI, pal.copper, 0.7 + 0.25 * gain);
    }
  }

  if (fade > 0.04) {
    for (const scale of [0.42, 0.72, 1]) {
      for (const side of [1, -1] as const) {
        strokeWorld(ctx, L, hairpin(side, scale, scene.ox), pal.snap, lw, fade * (0.45 + 0.5 * gain));
      }
    }
  }

  chevrons(ctx, L, scene.ox, fade, pal.snap);

  for (const p of scene.particles) {
    if (p.kind !== "burst") continue;
    const [px, py] = xy(L, p.x, p.y);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life)) * (0.45 + 0.5 * gain);
    ctx.fillStyle = pal.snap;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(1.5, L.s * 0.012), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  disc(ctx, L, pal);

  if (scene.source === "lasers") {
    const ports: [number, number, number][] = [
      [-1.18, 0.42, scene.left],
      [-1.18, -0.42, scene.left],
      [1.18, 0.42, scene.right],
      [1.18, -0.42, scene.right],
    ];
    for (const [x, y, hot] of ports) laser(ctx, L, pal, x, y, hot);
  } else {
    const radius = 0.98 * (1 - 0.48 * scene.charge);
    ctx.save();
    ctx.setLineDash([2, 7]);
    ctx.strokeStyle = pal.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(L.cx, L.cy, radius * L.s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 3; i++) {
      const ang = scene.spin + (i * 2 * Math.PI) / 3;
      orb(ctx, L, Math.cos(ang) * radius, Math.sin(ang) * radius, i % 2 === 0 ? pal.copper : pal.snap, 0.06);
    }
    orb(
      ctx,
      L,
      Math.cos(scene.destAngle) * 1.26,
      Math.sin(scene.destAngle) * 1.26,
      pal.paper,
      0.05,
      "4",
    );
  }

  const [nx, ny] = xy(L, scene.ox, 0);
  ctx.save();
  ctx.globalAlpha = 0.12 + 0.28 * fade;
  ctx.fillStyle = pal.snap;
  ctx.beginPath();
  ctx.arc(nx, ny, L.s * (0.028 + 0.02 * fade), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = pal.paper;
  ctx.beginPath();
  ctx.arc(nx, ny, Math.max(2.5, L.s * 0.018), 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `500 ${Math.max(12, L.s * 0.048)}px "IBM Plex Mono", ui-monospace, monospace`;
  ctx.fillStyle = pal.snap;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("X", nx + L.s * 0.04, ny - L.s * 0.03);
  ctx.restore();

  if (scene.placed) {
    ctx.save();
    ctx.strokeStyle = pal.snap;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = Math.max(1.2, L.s * 0.006);
    ctx.beginPath();
    ctx.arc(L.cx, L.cy, L.s * 1.05, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
