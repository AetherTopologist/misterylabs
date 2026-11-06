import * as THREE from "three";
import { afterEach, describe, expect, it } from "vitest";
import {
  ARCH_SLOTS,
  allArchLamps,
  applyArchTier,
  monumentZone,
  registerArchLight,
  resetArchRegistry,
  selectArchSlots,
  visibleArchLights,
  writeArchSlots,
  makeSlotBlock,
} from "./cenotaph-budget";
import { lightTierFromSearch, diagnosticsReport, patchDiagnostics, getDiagnostics } from "./cenotaph-diagnostics";

afterEach(() => resetArchRegistry());

describe("cenotaph light budget", () => {
  it("keeps eight slots in every zone and does not change the count", () => {
    const lamps = allArchLamps();
    const cameras = [
      { x: 0, y: 16, z: 0 },
      { x: 0, y: 12, z: 60 },
      { x: 0, y: 10, z: -70 },
      { x: 106, y: 8, z: 12 },
      { x: 140, y: 18, z: 20 },
    ];
    for (const cam of cameras) {
      const slots = selectArchSlots(lamps, cam);
      expect(slots.length).toBe(ARCH_SLOTS);
      expect(new Set(slots.map((lamp) => lamp.name)).size).toBe(ARCH_SLOTS);
    }
    expect(monumentZone(0, 16, 0)).toBe("dome");
    expect(monumentZone(0, 12, 60)).toBe("south");
    expect(monumentZone(0, 10, -70)).toBe("north");
    expect(monumentZone(106, 8, 12)).toBe("terrace");
    expect(monumentZone(140, 18, 20)).toBe("exterior");
  });

  it("writes a fixed block and leaves unused slots dark", () => {
    const block = makeSlotBlock();
    const lamps = selectArchSlots(allArchLamps(), { x: 0, y: 16, z: 0 });
    writeArchSlots(lamps.slice(0, 3), 2200, 0xffe6c4, block);
    expect(block.pos).toHaveLength(ARCH_SLOTS);
    expect(block.pos[0].w).toBeGreaterThan(0);
    expect(block.pos[7].w).toBe(0);
    expect(block.color[7].x).toBe(0);
    const pool = lamps.find((lamp) => lamp.name === "observation-pool");
    expect(pool).toBeTruthy();
    writeArchSlots([pool!], 2200, 0xffffff, block);
    expect(block.color[0].w).toBeCloseTo(Math.cos(1.15), 5);
    expect(block.pos[1].w).toBe(0);
  });

  it("hides architectural three.js lights on the budget tier and keeps three on emissive", () => {
    const names = ["wall-grazer-east", "south-hall", "observation-pool", "north-hall", "terrace-east"];
    for (const name of names) {
      const light = new THREE.PointLight(0xffffff, 10, 10);
      light.name = name;
      registerArchLight(light);
    }
    applyArchTier("budget");
    expect(visibleArchLights()).toBe(0);
    applyArchTier("pr38");
    expect(visibleArchLights()).toBe(names.length);
    applyArchTier("emissive");
    expect(visibleArchLights()).toBe(3);
    applyArchTier("minimal");
    expect(visibleArchLights()).toBe(0);
    expect(lightTierFromSearch("?lights=pr38")).toBe("pr38");
    expect(lightTierFromSearch("")).toBe("budget");
  });
});

describe("cenotaph diagnostics report", () => {
  it("does not claim a shader log it does not have", () => {
    patchDiagnostics({
      production: "loaded",
      full: "idle",
      shaderLog: "unavailable",
      tier: "budget",
      activeRealLights: 27,
      activeArchSlots: 8,
      context: "active",
      webglVersion: "WebGL 2",
      maxFragmentUniforms: 224,
    });
    const report = diagnosticsReport("TestPhone");
    expect(report).toContain("device: TestPhone");
    expect(report).toContain("shaderLog: unavailable");
    expect(report).toContain("production: loaded");
    expect(report).toContain("full: idle");
    expect(report).toContain("maxFragmentUniforms: 224");
    expect(getDiagnostics().shaderLog).toBe("unavailable");
    expect(report).not.toContain("shader ready");
  });
});
