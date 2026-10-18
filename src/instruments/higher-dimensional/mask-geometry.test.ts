import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  bakeWorldBuffers,
  centerScale,
  classifyRelief,
  concaveFromConvex,
  positionsEqual,
  reliefDepthSign,
  type MaskBuffers,
} from "./mask-geometry";

function gridRelief(): { positions: Float32Array; normals: Float32Array; indices: Uint32Array } {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const n = 8;
  const at = (i: number, j: number) => j * (n + 1) + i;
  for (let j = 0; j <= n; j++) {
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * 2 - 1;
      const y = (j / n) * 2 - 1;
      const z = 0.4 - 0.35 * (x * x + y * y);
      positions.push(x, y, z);
      const nx = 0.7 * x;
      const ny = 0.7 * y;
      const nz = 1;
      const l = Math.hypot(nx, ny, nz);
      normals.push(nx / l, ny / l, nz / l);
    }
  }
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
      indices.push(a, b, c, a, c, d);
    }
  }
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
  };
}

function decodeGlb(path: string) {
  const data = readFileSync(path);
  let off = 12;
  let json: { accessors: Array<{ bufferView: number; componentType: number; count: number; type: string; byteOffset?: number }>; bufferViews: Array<{ byteOffset?: number; byteLength: number }> } | null = null;
  let bin = Buffer.alloc(0);
  while (off < data.length) {
    const len = data.readUInt32LE(off);
    const type = data.toString("utf8", off + 4, off + 8);
    off += 8;
    const chunk = data.subarray(off, off + len);
    off += len;
    if (type === "JSON") json = JSON.parse(chunk.toString("utf8"));
    else bin = chunk;
  }
  if (!json) throw new Error("no json");
  const read = (index: number) => {
    const acc = json!.accessors[index];
    const view = json!.bufferViews[acc.bufferView];
    const start = (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
    const comps = acc.type === "VEC3" ? 3 : 1;
    if (acc.componentType === 5126) {
      const out = new Float32Array(acc.count * comps);
      for (let i = 0; i < out.length; i++) out[i] = bin.readFloatLE(start + i * 4);
      return out;
    }
    if (acc.componentType === 5125) {
      const out = new Uint32Array(acc.count);
      for (let i = 0; i < out.length; i++) out[i] = bin.readUInt32LE(start + i * 4);
      return out;
    }
    const out = new Uint32Array(acc.count);
    for (let i = 0; i < out.length; i++) out[i] = bin.readUInt16LE(start + i * 2);
    return out;
  };
  return {
    positions: read(0) as Float32Array,
    normals: read(1) as Float32Array,
    indices: read(2) as Uint32Array,
  };
}

function maxAbsDiff(a: Float32Array, b: Float32Array): number {
  let max = 0;
  for (let i = 0; i < a.length; i++) max = Math.max(max, Math.abs(a[i] - b[i]));
  return max;
}

function meanNormal(buf: MaskBuffers): [number, number, number] {
  const n = buf.normals.length / 3;
  let x = 0, y = 0, z = 0;
  for (let i = 0; i < n; i++) {
    x += buf.normals[i * 3];
    y += buf.normals[i * 3 + 1];
    z += buf.normals[i * 3 + 2];
  }
  return [x / n, y / n, z / n];
}

function meanWindingAgreement(buf: MaskBuffers): number {
  const p = buf.positions;
  const nrm = buf.normals;
  let sum = 0;
  let count = 0;
  for (let t = 0; t < buf.indices.length; t += 3) {
    const i = buf.indices[t];
    const j = buf.indices[t + 1];
    const k = buf.indices[t + 2];
    const ax = p[j * 3] - p[i * 3];
    const ay = p[j * 3 + 1] - p[i * 3 + 1];
    const az = p[j * 3 + 2] - p[i * 3 + 2];
    const bx = p[k * 3] - p[i * 3];
    const by = p[k * 3 + 1] - p[i * 3 + 1];
    const bz = p[k * 3 + 2] - p[i * 3 + 2];
    const cx = ay * bz - az * by;
    const cy = az * bx - ax * bz;
    const cz = ax * by - ay * bx;
    const cl = Math.hypot(cx, cy, cz);
    if (cl < 1e-8) continue;
    const nx = (nrm[i * 3] + nrm[j * 3] + nrm[k * 3]) / 3;
    const ny = (nrm[i * 3 + 1] + nrm[j * 3 + 1] + nrm[k * 3 + 1]) / 3;
    const nz = (nrm[i * 3 + 2] + nrm[j * 3 + 2] + nrm[k * 3 + 2]) / 3;
    const nl = Math.hypot(nx, ny, nz) || 1;
    sum += (cx / cl) * (nx / nl) + (cy / cl) * (ny / nl) + (cz / cl) * (nz / nl);
    count++;
  }
  return count ? sum / count : 0;
}

describe("hollow relief geometry", () => {
  it("moves vertices when making the concave shell", () => {
    const src = gridRelief();
    expect(classifyRelief(reliefDepthSign(src.positions))).toBe("convex relief");
    const hollow = concaveFromConvex(src);
    expect(positionsEqual(src.positions, hollow.positions)).toBe(false);
    expect(classifyRelief(reliefDepthSign(hollow.positions))).toBe("concave shell");
    expect(hollow.indices[1]).toBe(src.indices[1]);
    expect(hollow.indices[2]).toBe(src.indices[2]);
    expect(meanWindingAgreement(hollow)).toBeGreaterThan(0.9);
  });

  it("is not a normal reversal of the same vertices", () => {
    const src = gridRelief();
    const hollow = concaveFromConvex(src);
    let moved = 0;
    for (let i = 2; i < src.positions.length; i += 3) {
      if (src.positions[i] !== hollow.positions[i]) moved++;
    }
    expect(moved).toBe(src.positions.length / 3);
  });

  it("turns the supplied Einstein relief inward", () => {
    const raw = decodeGlb("/workspace/attachments/EinsteinMask_Decimate013.glb");
    const positions = centerScale(raw.positions);
    expect(reliefDepthSign(positions)).toBeGreaterThan(0);
    const hollow = concaveFromConvex({ ...raw, positions });
    expect(reliefDepthSign(hollow.positions)).toBeLessThan(0);
    expect(positionsEqual(positions, hollow.positions)).toBe(false);
  });

  it("turns the supplied Tesla relief inward", () => {
    const raw = decodeGlb("/workspace/attachments/TeslaMask_Decimate010.glb");
    const positions = centerScale(raw.positions);
    expect(reliefDepthSign(positions)).toBeGreaterThan(0);
    const hollow = concaveFromConvex({ ...raw, positions });
    expect(reliefDepthSign(hollow.positions)).toBeLessThan(0);
  });

  it("rotates normals with the world matrix and keeps winding in agreement", () => {
    const src = gridRelief();
    const spun = bakeWorldBuffers(
      src.positions,
      src.normals,
      src.indices,
      new THREE.Matrix4().makeRotationY(Math.PI / 2),
    );
    const [nx, , nz] = meanNormal(spun);
    expect(nx).toBeGreaterThan(0.5);
    expect(Math.abs(nz)).toBeLessThan(0.2);
    expect(meanWindingAgreement(spun)).toBeGreaterThan(0.9);
  });

  it("flips winding when the world matrix mirrors the shell", () => {
    const src = gridRelief();
    const mirrored = bakeWorldBuffers(
      src.positions,
      src.normals,
      src.indices,
      new THREE.Matrix4().makeScale(1, 1, -1),
    );
    expect(meanNormal(mirrored)[2]).toBeLessThan(-0.5);
    expect(meanWindingAgreement(mirrored)).toBeGreaterThan(0.9);
  });

  it("centers away a translation without touching normal direction", () => {
    const src = gridRelief();
    const identity = bakeWorldBuffers(src.positions, src.normals, src.indices, new THREE.Matrix4());
    const moved = bakeWorldBuffers(
      src.positions,
      src.normals,
      src.indices,
      new THREE.Matrix4().makeTranslation(12, -5, 3),
    );
    expect(maxAbsDiff(identity.positions, moved.positions)).toBeLessThan(1e-5);
    expect(maxAbsDiff(identity.normals, moved.normals)).toBeLessThan(1e-5);
  });

  it("bakes the shipped masks as convex shells whose normals face the front", () => {
    for (const file of ["einstein-mask.glb", "tesla-mask.glb"]) {
      const raw = decodeGlb(path.resolve("public/models", file));
      const baked = bakeWorldBuffers(raw.positions, raw.normals, raw.indices, new THREE.Matrix4());
      expect(classifyRelief(reliefDepthSign(baked.positions))).toBe("convex relief");
      expect(meanWindingAgreement(baked)).toBeGreaterThan(0.9);
      const hollow = concaveFromConvex(baked);
      expect(classifyRelief(reliefDepthSign(hollow.positions))).toBe("concave shell");
      expect(meanWindingAgreement(hollow)).toBeGreaterThan(0.9);
      expect(positionsEqual(baked.positions, hollow.positions)).toBe(false);
    }
  });
});
