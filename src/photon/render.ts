import { FULL_WELL, READ_NOISE, effectiveFNumber, isoGain, layerBlur, photonScale, type ControlState, type Mode } from "./physics";

const W = 480;
const H = 320;

export type Scene = {
  rev: number;
  w: number;
  h: number;
  moon: Float32Array;
  leaf: Float32Array;
  drop: Float32Array;
  mask: Float32Array;
  scratchA: Float32Array;
  scratchB: Float32Array;
  scratchC: Float32Array;
  scratchM: Float32Array;
  scratchN: Float32Array;
  kept: Float32Array;
  out: Float32Array;
  midRgb: Float32Array;
  midMask: Float32Array;
  frame: ImageData | null;
  photos: { moon: boolean; leaf: boolean };
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash3(ix: number, iy: number, iz: number) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(iz, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function fade(t: number) {
  return t * t * (3 - 2 * t);
}

function noise3(x: number, y: number, z: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const xf = fade(x - x0);
  const yf = fade(y - y0);
  const zf = fade(z - z0);
  let acc = 0;
  for (let dz = 0; dz <= 1; dz++) {
    for (let dy = 0; dy <= 1; dy++) {
      for (let dx = 0; dx <= 1; dx++) {
        const weight =
          (dx ? xf : 1 - xf) * (dy ? yf : 1 - yf) * (dz ? zf : 1 - zf);
        acc += weight * hash3(x0 + dx, y0 + dy, z0 + dz);
      }
    }
  }
  return acc;
}

function fbm(x: number, y: number, z: number) {
  let acc = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 5; i++) {
    acc += noise3(x * freq, y * freq, z * freq) * amp;
    freq *= 2.05;
    amp *= 0.5;
  }
  return acc;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function buildMoon(w: number, h: number) {
  const rgb = new Float32Array(w * h * 3);
  const cx = w * 0.5;
  const cy = h * 0.5;
  const radius = h * 0.4;
  const rand = mulberry32(0x51a7);
  const craters: { x: number; y: number; r: number; young: number }[] = [
    { x: -0.42, y: -0.28, r: 0.2, young: 0 },
    { x: -0.18, y: -0.38, r: 0.13, young: 0 },
    { x: -0.55, y: 0.05, r: 0.16, young: 0 },
    { x: 0.08, y: -0.22, r: 0.1, young: 0 },
    { x: -0.32, y: 0.18, r: 0.11, young: 0 },
    { x: 0.46, y: 0.22, r: 0.07, young: 1 },
    { x: 0.22, y: 0.42, r: 0.09, young: 0 },
    { x: -0.05, y: 0.48, r: 0.08, young: 0 },
    { x: 0.34, y: -0.08, r: 0.055, young: 0 },
    { x: -0.62, y: -0.08, r: 0.06, young: 0 },
  ];
  for (let i = 0; i < 18; i++) {
    const ang = rand() * Math.PI * 2;
    const dist = Math.sqrt(rand()) * 0.78;
    craters.push({
      x: Math.cos(ang) * dist,
      y: Math.sin(ang) * dist,
      r: 0.025 + rand() * 0.03,
      young: 0,
    });
  }

  const mares = [
    { x: -0.34, y: -0.16, rx: 0.34, ry: 0.26 },
    { x: -0.12, y: -0.34, rx: 0.2, ry: 0.14 },
    { x: -0.48, y: 0.12, rx: 0.16, ry: 0.2 },
    { x: 0.02, y: 0.08, rx: 0.12, ry: 0.1 },
  ];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - cx) / radius;
      const ny = (y - cy) / radius;
      const r2 = nx * nx + ny * ny;
      const i = (y * w + x) * 3;
      if (r2 > 1) {
        rgb[i] = 0.008;
        rgb[i + 1] = 0.009;
        rgb[i + 2] = 0.012;
        continue;
      }
      const nz = Math.sqrt(1 - r2);
      const limb = 0.34 + 0.66 * nz ** 0.7;
      const grain = fbm(nx * 3.1 + 2, ny * 3.1, nz * 3.1);
      let alb = 0.62 + 0.08 * (grain - 0.5);
      for (const mare of mares) {
        const dx = (nx - mare.x) / mare.rx;
        const dy = (ny - mare.y) / mare.ry;
        const u = dx * dx + dy * dy;
        alb -= 0.28 * (1 - smoothstep(0.55, 1.15, u));
      }
      for (const crater of craters) {
        const dx = (nx - crater.x) / crater.r;
        const dy = (ny - crater.y) / crater.r;
        const u = Math.hypot(dx, dy);
        if (u > 1.35) continue;
        const bowl = 1 - smoothstep(0, 0.72, u);
        const rim = smoothstep(0.62, 0.82, u) * (1 - smoothstep(0.96, 1.18, u));
        const light = dx * -0.8 + dy * -0.45;
        alb -= bowl * 0.16;
        alb += rim * (0.08 + 0.34 * light);
        if (crater.young > 0 && u < 6) {
          const ang = Math.atan2(dy, dx);
          const ray = 0.5 + 0.5 * Math.cos(ang * 6);
          alb += 0.16 * ray * Math.exp(-u * 0.55);
        }
      }
      alb = Math.min(0.92, Math.max(0.05, alb * limb));
      rgb[i] = alb * 0.98;
      rgb[i + 1] = alb * 0.95;
      rgb[i + 2] = alb * 0.88;
    }
  }
  return rgb;
}

function sample(src: Float32Array, w: number, h: number, x: number, y: number) {
  const xClamped = Math.min(w - 1.001, Math.max(0, x));
  const yClamped = Math.min(h - 1.001, Math.max(0, y));
  const x0 = Math.floor(xClamped);
  const y0 = Math.floor(yClamped);
  const tx = xClamped - x0;
  const ty = yClamped - y0;
  const i00 = (y0 * w + x0) * 3;
  const i10 = i00 + 3;
  const i01 = i00 + w * 3;
  const i11 = i01 + 3;
  const out = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    const a = src[i00 + c] * (1 - tx) + src[i10 + c] * tx;
    const b = src[i01 + c] * (1 - tx) + src[i11 + c] * tx;
    out[c] = a * (1 - ty) + b * ty;
  }
  return out;
}

function buildMacro(w: number, h: number) {
  const leaf = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      const n = fbm(u * 3.2, v * 4.4, 2.2);
      const cell = fbm(u * 26, v * 26, 6);
      const midrib = Math.exp(-(((u - 0.48 + 0.05 * Math.sin(v * 9)) * 10) ** 2));
      const branch =
        Math.exp(-(((v - 0.32 - (u - 0.48) * 0.8) * 22) ** 2)) * 0.7 +
        Math.exp(-(((v - 0.58 + (u - 0.5) * 0.55) * 18) ** 2)) * 0.55 +
        Math.exp(-(((v - 0.74 - (u - 0.46) * 0.4) * 16) ** 2)) * 0.4;
      const vein = Math.min(1, midrib + branch * (0.35 + 0.3 * n));
      const shade = 0.78 + 0.28 * (1 - u) * (1 - v * 0.3);
      let r = (0.045 + 0.04 * n + cell * 0.015) * shade;
      let g = (0.13 + 0.07 * n + cell * 0.02) * shade;
      let b = (0.04 + 0.025 * n) * shade;
      r *= 1 - 0.42 * vein;
      g *= 1 - 0.38 * vein;
      b *= 1 - 0.3 * vein;
      const edge = smoothstep(0.08, 0.22, u) * smoothstep(0.08, 0.2, 1 - v);
      const i = (y * w + x) * 3;
      leaf[i] = r * (0.35 + 0.65 * edge);
      leaf[i + 1] = g * (0.35 + 0.65 * edge);
      leaf[i + 2] = b * (0.4 + 0.6 * edge);
    }
  }
  const drop = new Float32Array(w * h * 3);
  const mask = new Float32Array(w * h);
  stampDroplet(leaf, drop, mask, w, h);
  return { leaf, drop, mask };
}

function stampDroplet(leaf: Float32Array, drop: Float32Array, mask: Float32Array, w: number, h: number) {
  drop.fill(0);
  mask.fill(0);
  const dx = w * 0.56;
  const dy = h * 0.46;
  const rad = h * 0.2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x - dx;
      const py = y - dy;
      const u2 = (px * px + py * py) / (rad * rad);
      const i = y * w + x;
      if (u2 > 1) continue;
      const nz = Math.sqrt(1 - u2);
      const nx = px / rad;
      const ny = py / rad;
      const fres = 0.02 + 0.98 * (1 - nz) ** 5;
      const bend = (1 - nz) * rad * 0.62;
      const sampled = sample(leaf, w, h, x - nx * bend, y - ny * bend * 0.85);
      const env = 0.015 + 0.05 * nz;
      let r = sampled[0] * (1 - fres) * 0.92 + env * fres;
      let g = sampled[1] * (1 - fres) * 0.94 + env * fres * 1.1;
      let b = sampled[2] * (1 - fres) * 0.9 + env * fres * 1.2;
      const hx = -0.35;
      const hy = -0.5;
      const hz = 1.79;
      const inv = 1 / Math.hypot(hx, hy, hz);
      const spec = Math.max(0, nx * hx * inv + ny * hy * inv + nz * hz * inv) ** 70;
      r += spec * 0.95;
      g += spec * 0.92;
      b += spec * 0.82;
      const glint = Math.exp(-((nx + 0.15) ** 2 + (ny + 0.55) ** 2) * 28) * 0.35;
      r += glint;
      g += glint;
      b += glint * 0.9;
      drop[i * 3] = r;
      drop[i * 3 + 1] = g;
      drop[i * 3 + 2] = b;
      mask[i] = 1;
      const shadow = Math.exp(-((x - dx) ** 2 + (y - (dy + rad * 0.72)) ** 2) / (rad * rad * 0.55));
      if (mask[i] < 0.5) {
        leaf[i * 3] *= 1 - shadow * 0.45;
        leaf[i * 3 + 1] *= 1 - shadow * 0.45;
        leaf[i * 3 + 2] *= 1 - shadow * 0.45;
      }
    }
  }
  // Contact shadow outside the droplet, second pass.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (mask[i] > 0) continue;
      const sx = (x - dx) / rad;
      const sy = (y - (dy + rad * 0.78)) / (rad * 0.55);
      const shadow = Math.exp(-(sx * sx * 0.35 + sy * sy));
      if (shadow < 0.05) continue;
      leaf[i * 3] *= 1 - shadow * 0.5;
      leaf[i * 3 + 1] *= 1 - shadow * 0.5;
      leaf[i * 3 + 2] *= 1 - shadow * 0.5;
    }
  }
}

export function createScene(): Scene {
  const macro = buildMacro(W, H);
  const n = W * H * 3;
  const pixels = W * H;
  return {
    rev: 3,
    w: W,
    h: H,
    moon: buildMoon(W, H),
    leaf: macro.leaf,
    drop: macro.drop,
    mask: macro.mask,
    scratchA: new Float32Array(n),
    scratchB: new Float32Array(n),
    scratchC: new Float32Array(n),
    scratchM: new Float32Array(pixels),
    scratchN: new Float32Array(pixels),
    kept: new Float32Array(n),
    out: new Float32Array(n),
    midRgb: new Float32Array(n),
    midMask: new Float32Array(pixels),
    frame: null,
    photos: { moon: false, leaf: false },
  };
}

function boxBlur(
  src: Float32Array,
  dst: Float32Array,
  mid: Float32Array,
  w: number,
  h: number,
  ch: number,
  radius: number,
) {
  if (radius < 1) {
    if (dst !== src) dst.set(src);
    return;
  }
  const win = radius * 2 + 1;
  for (let y = 0; y < h; y++) {
    for (let c = 0; c < ch; c++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) {
        const x = Math.min(w - 1, Math.max(0, k));
        sum += src[(y * w + x) * ch + c];
      }
      for (let x = 0; x < w; x++) {
        mid[(y * w + x) * ch + c] = sum / win;
        const remove = Math.min(w - 1, Math.max(0, x - radius));
        const add = Math.min(w - 1, Math.max(0, x + radius + 1));
        sum -= src[(y * w + remove) * ch + c];
        sum += src[(y * w + add) * ch + c];
      }
    }
  }
  for (let x = 0; x < w; x++) {
    for (let c = 0; c < ch; c++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) {
        const y = Math.min(h - 1, Math.max(0, k));
        sum += mid[(y * w + x) * ch + c];
      }
      for (let y = 0; y < h; y++) {
        dst[(y * w + x) * ch + c] = sum / win;
        const remove = Math.min(h - 1, Math.max(0, y - radius));
        const add = Math.min(h - 1, Math.max(0, y + radius + 1));
        sum -= mid[(remove * w + x) * ch + c];
        sum += mid[(add * w + x) * ch + c];
      }
    }
  }
}

function gaussianRadii(sigma: number) {
  if (sigma < 0.45) return [];
  const n = 3;
  const wIdeal = Math.sqrt((12 * sigma * sigma) / n + 1);
  let wl = Math.floor(wIdeal);
  if (wl % 2 === 0) wl -= 1;
  if (wl < 1) wl = 1;
  const wu = wl + 2;
  const mIdeal = (12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4);
  const m = Math.min(n, Math.max(0, Math.round(mIdeal)));
  const radii: number[] = [];
  for (let i = 0; i < n; i++) {
    const width = i < m ? wl : wu;
    const radius = (width - 1) / 2;
    if (radius >= 1) radii.push(radius);
  }
  return radii;
}

function blurInto(
  src: Float32Array,
  a: Float32Array,
  b: Float32Array,
  mid: Float32Array,
  w: number,
  h: number,
  ch: number,
  sigma: number,
) {
  const radii = gaussianRadii(sigma);
  if (!radii.length) {
    if (a !== src) a.set(src);
    return a;
  }
  let input = src;
  let output = a;
  for (let i = 0; i < radii.length; i++) {
    boxBlur(input, output, mid, w, h, ch, radii[i]);
    input = output;
    output = output === a ? b : a;
  }
  return input;
}

function warpRgb(src: Float32Array, dst: Float32Array, w: number, h: number, amp: number, time: number) {
  if (amp < 0.15) {
    dst.set(src);
    return;
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx =
        amp * (Math.sin(y * 0.045 + time) + 0.45 * Math.sin(x * 0.03 - time * 1.3));
      const dy = amp * (Math.cos(x * 0.038 + time * 0.8) * 0.8 + 0.3 * Math.sin(y * 0.05 + time));
      const color = sample(src, w, h, x + dx, y + dy);
      const i = (y * w + x) * 3;
      dst[i] = color[0];
      dst[i + 1] = color[1];
      dst[i + 2] = color[2];
    }
  }
}

function warpMask(src: Float32Array, dst: Float32Array, w: number, h: number, amp: number, time: number) {
  if (amp < 0.15) {
    dst.set(src);
    return;
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = amp * (Math.sin(y * 0.045 + time) + 0.45 * Math.sin(x * 0.03 - time * 1.3));
      const dy = amp * (Math.cos(x * 0.038 + time * 0.8) * 0.8);
      const xs = Math.min(w - 1, Math.max(0, Math.round(x + dx)));
      const ys = Math.min(h - 1, Math.max(0, Math.round(y + dy)));
      dst[y * w + x] = src[ys * w + xs];
    }
  }
}

function composite(leaf: Float32Array, drop: Float32Array, mask: Float32Array, dst: Float32Array, n: number) {
  for (let i = 0; i < n; i++) {
    const m = Math.min(1, Math.max(0, mask[i]));
    dst[i * 3] = leaf[i * 3] * (1 - m) + drop[i * 3];
    dst[i * 3 + 1] = leaf[i * 3 + 1] * (1 - m) + drop[i * 3 + 1];
    dst[i * 3 + 2] = leaf[i * 3 + 2] * (1 - m) + drop[i * 3 + 2];
  }
}

function tone(
  src: Float32Array,
  canvas: HTMLCanvasElement,
  scene: Scene,
  photon: number,
  gain: number,
  seed: number,
) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  if (!scene.frame) scene.frame = ctx.createImageData(canvas.width, canvas.height);
  const data = scene.frame.data;
  const rand = mulberry32(seed);
  const read2 = READ_NOISE * READ_NOISE;
  const count = canvas.width * canvas.height;
  for (let p = 0; p < count; p++) {
    const u1 = Math.max(1e-8, rand());
    const u2 = rand();
    const gaus = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    for (let c = 0; c < 3; c++) {
      const mean = Math.max(0, src[p * 3 + c]) * FULL_WELL * photon;
      const noisy = Math.max(0, mean + gaus * Math.sqrt(mean + read2));
      const mapped = noisy * gain;
      const shown = Math.min(FULL_WELL, mapped) / FULL_WELL;
      data[p * 4 + c] = Math.round(255 * shown ** (1 / 2.2));
    }
    data[p * 4 + 3] = 255;
  }
  ctx.putImageData(scene.frame, 0, 0);
}

export function drawFrame(scene: Scene, canvas: HTMLCanvasElement, mode: Mode, controls: ControlState, time: number) {
  if (canvas.width !== scene.w || canvas.height !== scene.h) {
    canvas.width = scene.w;
    canvas.height = scene.h;
    scene.frame = null;
  }
  const blur = layerBlur(mode, controls.seeing, controls.focus, effectiveFNumber(controls));
  const photon = photonScale(controls);
  const gain = isoGain(controls);
  const seed = Math.round(photon * 1000 + controls.focus * 17 + controls.seeing * 13);
  const { w, h, scratchA, scratchB, scratchC, scratchM, scratchN, midRgb, midMask, kept, out } = scene;

  if (mode === "moon") {
    warpRgb(scene.moon, scratchA, w, h, blur.warpPx, time);
    const blurred = blurInto(scratchA, scratchB, scratchC, midRgb, w, h, 3, blur.subject);
    tone(blurred, canvas, scene, photon, gain, seed);
    return;
  }

  warpRgb(scene.leaf, scratchA, w, h, blur.warpPx, time);
  const leafBlur = blurInto(scratchA, scratchB, scratchC, midRgb, w, h, 3, blur.ground);
  kept.set(leafBlur);
  warpRgb(scene.drop, scratchA, w, h, blur.warpPx * 0.35, time);
  const dropBlur = blurInto(scratchA, scratchB, scratchC, midRgb, w, h, 3, blur.subject);
  warpMask(scene.mask, scratchM, w, h, blur.warpPx * 0.35, time);
  const maskBlur = blurInto(scratchM, scratchN, scratchM, midMask, w, h, 1, blur.subject);
  composite(kept, dropBlur, maskBlur, out, w * h);
  tone(out, canvas, scene, photon, gain, seed);
}

export const PLATE_SOURCES = {
  moon: {
    title: "Galileo full Moon",
    credit: "NASA / JPL / USGS, PIA00405. Public domain.",
    note: "Taken 7 December 1992 on the way to Jupiter. Maria, highlands, and Tycho’s rays are the photograph. The sensor model on top of it is illustrative.",
  },
  leaf: {
    title: "Water droplets on a leaf",
    credit: "Siddharth Patil, CC0 1.0. Wikimedia Commons, “Water droplets on leaf.jpg”.",
    note: "Veins and droplets are the photograph. One illustrative lens-droplet is composited so the near plane can still be focused apart from the leaf.",
  },
} as const;

function loadPlate(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

function plateFromImage(image: HTMLImageElement, w: number, h: number, fit: "contain" | "cover", targetMean: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return new Float32Array(w * h * 3);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  const scale = fit === "cover" ? Math.max(w / image.width, h / image.height) : Math.min(w / image.width, h / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);
  const data = ctx.getImageData(0, 0, w, h).data;
  const rgb = new Float32Array(w * h * 3);
  let sum = 0;
  let counted = 0;
  for (let p = 0; p < w * h; p++) {
    const r = (data[p * 4] / 255) ** 2.2;
    const g = (data[p * 4 + 1] / 255) ** 2.2;
    const b = (data[p * 4 + 2] / 255) ** 2.2;
    rgb[p * 3] = r;
    rgb[p * 3 + 1] = g;
    rgb[p * 3 + 2] = b;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (luma > 0.02) {
      sum += luma;
      counted += 1;
    }
  }
  const gain = targetMean / Math.max(1e-4, counted ? sum / counted : 1);
  for (let i = 0; i < rgb.length; i++) rgb[i] = Math.min(1.6, rgb[i] * gain);
  return rgb;
}

/** Replaces procedural plates when the public-domain files load. Safe to call once. */
export async function adoptPhotographs(scene: Scene) {
  const [moon, leaf] = await Promise.all([
    loadPlate(`${import.meta.env.BASE_URL}photon/moon.jpg`).catch(() => null),
    loadPlate(`${import.meta.env.BASE_URL}photon/leaf.jpg`).catch(() => null),
  ]);
  if (moon) {
    scene.moon.set(plateFromImage(moon, scene.w, scene.h, "contain", 0.5));
    scene.photos.moon = true;
  }
  if (leaf) {
    scene.leaf.set(plateFromImage(leaf, scene.w, scene.h, "cover", 0.2));
    stampDroplet(scene.leaf, scene.drop, scene.mask, scene.w, scene.h);
    scene.photos.leaf = true;
  }
  return { ...scene.photos };
}
