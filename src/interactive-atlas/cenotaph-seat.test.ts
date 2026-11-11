/**
 * @vitest-environment node
 */
import fs from "node:fs";
import zlib from "node:zlib";
import * as THREE from "three";
import { afterEach, describe, expect, it } from "vitest";
import { constrainCenotaph, inStairMouth } from "./ascent";
import { CAP_Y, TREAD_Y, seatMonument, surveyCap } from "./cenotaph-seat";
import { CAP_WALK_R, flatDiscCap, monumentCapActive } from "./monument-cap";
import { createWalker } from "./mister-why";
import { sampleGround, setMonumentCap, setObservationDisc } from "./terrain";
import { WALK_BACK, WALK_LOOK } from "./framing";
import { WALK_R } from "./dome-floor";

const PRODUCTION = new URL("./cenotaph.glb", import.meta.url);
const FLOOR = new URL("./cenotaph-production-floor.glb", import.meta.url);

const COMPS: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

function parseGlb(file: URL) {
  const buf = fs.readFileSync(file);
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error("not a glb");
  let off = 12;
  let json: {
    accessors: Array<{ bufferView: number; byteOffset?: number; componentType: number; count: number; type: string }>;
    bufferViews: Array<{ byteOffset?: number; byteStride?: number }>;
    meshes: Array<{ name?: string; primitives: Array<{ attributes: { POSITION: number; NORMAL?: number }; indices?: number }> }>;
    nodes: Array<{ name?: string; mesh?: number; children?: number[]; matrix?: number[]; translation?: number[]; rotation?: number[]; scale?: number[] }>;
    scenes?: Array<{ nodes?: number[] }>;
    scene?: number;
  } | null = null;
  let binStart = 0;
  while (off < buf.length) {
    const len = view.getUint32(off, true);
    const type = view.getUint32(off + 4, true);
    const chunk = buf.subarray(off + 8, off + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString("utf8"));
    else if (type === 0x004e4942) binStart = off + 8;
    off += 8 + len;
  }
  if (!json) throw new Error("glb has no json");
  const accessor = (index: number) => {
    const acc = json!.accessors[index];
    const bv = json!.bufferViews[acc.bufferView];
    const ncomp = COMPS[acc.type];
    const width =
      acc.componentType === 5126 || acc.componentType === 5125
        ? 4
        : acc.componentType === 5123 || acc.componentType === 5122
          ? 2
          : 1;
    const stride = bv.byteStride || ncomp * width;
    const start = binStart + (bv.byteOffset || 0) + (acc.byteOffset || 0);
    const out = new Float32Array(acc.count * ncomp);
    for (let i = 0; i < acc.count; i++) {
      const base = start + i * stride;
      for (let c = 0; c < ncomp; c++) {
        const o = base + c * width;
        if (acc.componentType === 5126) out[i * ncomp + c] = view.getFloat32(o, true);
        else if (acc.componentType === 5125) out[i * ncomp + c] = view.getUint32(o, true);
        else if (acc.componentType === 5123) out[i * ncomp + c] = view.getUint16(o, true);
        else if (acc.componentType === 5121) out[i * ncomp + c] = view.getUint8(o);
        else if (acc.componentType === 5122) out[i * ncomp + c] = view.getInt16(o, true);
        else out[i * ncomp + c] = view.getInt8(o);
      }
    }
    return out;
  };
  const nodes = (json.nodes || []).map((node, i) => {
    const obj = new THREE.Group();
    obj.name = node.name || `node${i}`;
    if (node.matrix) obj.applyMatrix4(new THREE.Matrix4().fromArray(node.matrix));
    else {
      if (node.translation) obj.position.fromArray(node.translation);
      if (node.rotation) obj.quaternion.fromArray(node.rotation);
      if (node.scale) obj.scale.fromArray(node.scale);
    }
    if (node.mesh != null) {
      const meshDef = json!.meshes[node.mesh];
      meshDef.primitives.forEach((prim, pi) => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(accessor(prim.attributes.POSITION), 3));
        if (prim.attributes.NORMAL != null) {
          geo.setAttribute("normal", new THREE.BufferAttribute(accessor(prim.attributes.NORMAL), 3));
        }
        if (prim.indices != null) geo.setIndex(Array.from(accessor(prim.indices)));
        const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
        mesh.name = meshDef.primitives.length > 1 ? `${meshDef.name || obj.name}#${pi}` : meshDef.name || obj.name;
        obj.add(mesh);
      });
    }
    return obj;
  });
  json.nodes.forEach((node, i) => {
    for (const child of node.children || []) nodes[i].add(nodes[child]);
  });
  const root = new THREE.Group();
  const scene = json.scenes?.[json.scene || 0];
  for (const n of scene?.nodes || []) root.add(nodes[n]);
  root.updateMatrixWorld(true);
  return { root, bytes: buf.length, gzip: zlib.gzipSync(buf).length };
}

function triangles(root: THREE.Object3D) {
  let count = 0;
  let meshes = 0;
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    meshes++;
    const pos = mesh.geometry.getAttribute("position");
    const index = mesh.geometry.index;
    count += index ? index.count / 3 : pos.count / 3;
  });
  return { count, meshes };
}

function seatWorld(root: THREE.Object3D) {
  const seat = seatMonument(root);
  const holder = new THREE.Group();
  holder.add(root);
  root.position.copy(seat.rootPosition);
  holder.position.y = seat.holderY;
  holder.updateMatrixWorld(true);
  return { holder, seat };
}

function hitY(holder: THREE.Object3D, x: number, y: number, z: number, dir: number) {
  const ray = new THREE.Raycaster(new THREE.Vector3(x, y, z), new THREE.Vector3(0, dir, 0), 0, 40);
  const hit = ray.intersectObject(holder, true)[0];
  return hit ? hit.point.y : null;
}

afterEach(() => {
  setMonumentCap(null);
  setObservationDisc(null);
});

describe("cenotaph seating adapter", () => {
  it("walks the flat cap and, while that cap is installed, the northern passage", () => {
    const root = new THREE.Group();
    const cap = new THREE.PlaneGeometry(40, 40);
    cap.rotateX(-Math.PI / 2);
    cap.translate(0, CAP_Y, 0);
    root.add(new THREE.Mesh(cap));
    const ramp = new THREE.PlaneGeometry(8, 16);
    ramp.rotateX(-Math.PI / 2);
    ramp.translate(0, 10.9, -28);
    root.add(new THREE.Mesh(ramp));
    const lid = new THREE.PlaneGeometry(14, 20);
    lid.rotateX(-Math.PI / 2);
    lid.translate(0, 13.08, 60);
    root.add(new THREE.Mesh(lid));

    const grid = surveyCap(root);
    setMonumentCap(grid);
    expect(grid.cells).toBeGreaterThan(100);
    expect(sampleGround(16, 0)).toBeCloseTo(CAP_Y, 2);
    expect(sampleGround(0, -16)).toBeCloseTo(CAP_Y, 2);
    expect(inStairMouth(16, 0)).toBe(true);
    expect(inStairMouth(0, -16)).toBe(true);
    expect(inStairMouth(0, -21)).toBe(true);
    expect(sampleGround(0, -21)).toBeCloseTo(12.937, 2);
    expect(sampleGround(0, -28)).toBeCloseTo(10.938, 2);
    expect(sampleGround(0, 60)).toBeCloseTo(6.275, 2);
    expect(sampleGround(0, 108)).toBeCloseTo(6.275, 2);
    expect(sampleGround(0, 21)).toBeCloseTo(TREAD_Y, 2);

    const out = constrainCenotaph(21, 0, 2, 0);
    expect(Math.hypot(out.x, out.z)).toBeCloseTo(CAP_WALK_R, 2);
    expect(inStairMouth(out.x, out.z)).toBe(true);
    const north = constrainCenotaph(0, -30, 0, -4);
    expect(north.z).toBeCloseTo(-30, 3);
    expect(north.vz).toBeCloseTo(-4, 3);
    expect(inStairMouth(north.x, north.z)).toBe(true);

    const walker = createWalker(new THREE.Scene());
    walker.restore({ x: 16, z: 0, heading: Math.PI, camYaw: 0, back: WALK_BACK, lookLift: WALK_LOOK });
    expect(walker.group.position.y).toBeCloseTo(CAP_Y, 2);

    setMonumentCap(null);
    expect(inStairMouth(16, 0)).toBe(false);
    expect(inStairMouth(0, -28)).toBe(false);
    expect(sampleGround(0, -28)).toBe(0);
    expect(sampleGround(16, 0)).toBe(0);
    const back = constrainCenotaph(21, 0, 2, 0);
    expect(Math.hypot(back.x, back.z)).toBeGreaterThan(WALK_R - 0.2);
    expect(Math.hypot(back.x, back.z)).toBeLessThan(WALK_R + 0.2);
  });

  it("seats a named Unir shell on the SketchUp datum, not at 15.04", () => {
    const root = new THREE.Group();
    const sketch = new THREE.Group();
    sketch.name = "SketchUp";
    const pad = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 2), new THREE.MeshBasicMaterial());
    pad.position.y = 0.1;
    sketch.add(pad);
    const shell = new THREE.Group();
    shell.name = "Unir";
    const geo = new THREE.SphereGeometry(52, 24, 16);
    geo.translate(0, 60.928, 0);
    shell.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial()));
    root.add(sketch, shell);
    const seat = seatMonument(root);
    expect(seat.namedShell).toBe(true);
    expect(seat.holderY).toBeCloseTo(60.928, 1);
    expect(seat.rootPosition.y).toBeCloseTo(-60.928, 1);
    expect(seat.fit?.r).toBeCloseTo(52, 0);
    expect(Math.abs(seat.holderY - 15.04)).toBeGreaterThan(20);
  });

  it("discovers an unnamed shell instead of lifting the monument", () => {
    const root = new THREE.Group();
    const sketch = new THREE.Group();
    sketch.name = "SketchUp";
    const pad = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 4), new THREE.MeshBasicMaterial());
    pad.position.y = 0.1;
    sketch.add(pad);
    const geo = new THREE.SphereGeometry(52, 20, 14);
    geo.translate(0.2, 60.5, -0.1);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
    mesh.name = "Unir.510";
    root.add(sketch, mesh);
    const seat = seatMonument(root);
    expect(root.getObjectByName("Unir")).toBeUndefined();
    expect(seat.namedShell).toBe(false);
    expect(seat.holderY).toBeCloseTo(60.5, 0);
    expect(Math.abs(seat.holderY - 15.04)).toBeGreaterThan(20);
  });

  it("parks an unfitted file on the ground instead of using cenY", () => {
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 10), new THREE.MeshBasicMaterial());
    mesh.position.y = 3;
    root.add(mesh);
    const seat = seatMonument(root);
    expect(seat.fit).toBeNull();
    expect(seat.holderY).toBe(0);
    expect(seat.rootPosition.y).toBeCloseTo(-1, 5);
  });

  it("seats Production + Floor in the same frame without opening the north route", () => {
    const production = parseGlb(PRODUCTION);
    const floor = parseGlb(FLOOR);
    const prodTris = triangles(production.root);
    const floorTris = triangles(floor.root);
    expect(prodTris.count).toBe(59506);
    expect(prodTris.meshes).toBe(221);
    expect(floorTris.count).toBe(59572);
    expect(floorTris.meshes).toBe(6);
    expect(production.gzip).toBeLessThan(950_000);

    const seatedProd = seatWorld(production.root);
    const seatedFloor = seatWorld(floor.root);
    expect(seatedProd.seat.namedShell).toBe(true);
    expect(seatedFloor.seat.namedShell).toBe(false);
    expect(seatedFloor.seat.fit).not.toBeNull();
    expect(Math.abs(seatedProd.seat.holderY - seatedFloor.seat.holderY)).toBeLessThan(0.02);
    expect(Math.abs(seatedProd.seat.holderY - 15.04)).toBeGreaterThan(40);
    const prodBox = new THREE.Box3().setFromObject(seatedProd.holder);
    const floorBox = new THREE.Box3().setFromObject(seatedFloor.holder);
    expect(floorBox.min.x).toBeCloseTo(prodBox.min.x, 1);
    expect(floorBox.max.x).toBeCloseTo(prodBox.max.x, 1);
    expect(floorBox.min.z).toBeCloseTo(prodBox.min.z, 1);
    expect(floorBox.max.z).toBeCloseTo(prodBox.max.z, 1);
    expect(floorBox.max.y).toBeCloseTo(prodBox.max.y, 1);
    expect(floorBox.min.y).toBeCloseTo(0, 2);
    expect(hitY(seatedFloor.holder, 0, 2, 108, 1)).toBeCloseTo(6.275, 2);
    expect(hitY(seatedFloor.holder, 0, 10, 21, 1)).toBeCloseTo(TREAD_Y, 2);
    expect(hitY(seatedFloor.holder, 0, 20, 0, -1)).toBeCloseTo(CAP_Y, 2);

    expect(surveyCap(seatedFloor.holder).cells).toBe(0);
    const grid = surveyCap(seatedFloor.holder, 0.5, true);
    expect(grid.cells).toBeGreaterThan(100);
    expect(grid.yMin).toBeCloseTo(CAP_Y, 2);
    expect(grid.yMax).toBeCloseTo(CAP_Y, 2);
    setObservationDisc((grid.yMin + grid.yMax) / 2);
    expect(monumentCapActive()).toBe(false);
    expect(sampleGround(0, 8)).toBeCloseTo(CAP_Y, 2);
    expect(sampleGround(0, 16)).toBeCloseTo(CAP_Y, 2);
    expect(sampleGround(0, 21)).toBeCloseTo(TREAD_Y, 2);
    expect(sampleGround(0, 60)).toBeCloseTo(6.275, 2);
    expect(sampleGround(0, -28)).toBe(0);
    expect(inStairMouth(0, -28)).toBe(false);
    setMonumentCap(flatDiscCap(CAP_Y));
    expect(monumentCapActive()).toBe(true);
    expect(sampleGround(0, -16)).toBeCloseTo(CAP_Y, 2);
    expect(sampleGround(0, -20.8)).toBeCloseTo(12.937, 2);
    expect(sampleGround(0, -28)).toBeCloseTo(10.938, 2);
    expect(sampleGround(0, -60)).toBeCloseTo(6.275, 2);
    expect(sampleGround(0, -96)).toBeCloseTo(6.275, 2);
    expect(sampleGround(106, 0)).toBeCloseTo(6.275, 2);
    expect(sampleGround(0, 21)).toBeCloseTo(TREAD_Y, 2);
    expect(sampleGround(0, 60)).toBeCloseTo(6.275, 2);
    expect(sampleGround(0, 115)).toBeGreaterThan(2);
    expect(sampleGround(0, 115)).toBeLessThan(4);
    setMonumentCap(null);
    expect(monumentCapActive()).toBe(false);
    expect(sampleGround(0, -28)).toBe(0);
    expect(sampleGround(106, 0)).toBe(0);
    setObservationDisc(null);
    expect(sampleGround(0, 8)).toBeCloseTo(TREAD_Y, 2);
  }, 60000);

  it("boots visitors on Production + Floor and installs that cap", () => {
    const cen = fs.readFileSync(new URL("./cenotaph.ts", import.meta.url), "utf8");
    const scene = fs.readFileSync(new URL("./scene.ts", import.meta.url), "utf8");
    expect(cen).toContain('setGlb("floor")');
    expect(cen).not.toContain('setGlb("production")');
    expect(scene).toContain("setMonumentCap(reg.discY != null ? flatDiscCap(reg.discY) : null)");
    expect(scene).toContain("showProceduralFloor(reg.discY == null)");
  });
});
