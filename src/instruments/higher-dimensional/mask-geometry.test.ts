import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  centerScale,
  classifyRelief,
  concaveFromConvex,
  positionsEqual,
  reliefDepthSign,
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

describe("hollow relief geometry", () => {
  it("moves vertices when making the concave shell", () => {
    const src = gridRelief();
    expect(classifyRelief(reliefDepthSign(src.positions))).toBe("convex relief");
    const hollow = concaveFromConvex(src);
    expect(positionsEqual(src.positions, hollow.positions)).toBe(false);
    expect(classifyRelief(reliefDepthSign(hollow.positions))).toBe("concave shell");
    expect(hollow.indices[1]).toBe(src.indices[2]);
    expect(hollow.indices[2]).toBe(src.indices[1]);
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
});
