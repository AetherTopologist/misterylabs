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
  MOBILE_MAX_REAL,
} from "./cenotaph-budget";
import { lightTierFromSearch, diagnosticsReport, patchDiagnostics, getDiagnostics, resetDiagnostics, subscribeDiagnostics } from "./cenotaph-diagnostics";
import { fragmentUniformVectors, lightingTierFits, physicalDistanceAtten, resolveLightTier, type LightCensus } from "./cenotaph-budget";

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
    const vault = lamps.find((lamp) => lamp.name === "observation-vault");
    expect(vault).toBeTruthy();
    writeArchSlots([vault!], 2200, 0xfff1d6, block);
    expect(block.aim[0].y).toBeLessThan(0);
    const floorToLight = new THREE.Vector3(vault!.x, vault!.y - 13.1, vault!.z).normalize();
    const aim = new THREE.Vector3(block.aim[0].x, block.aim[0].y, block.aim[0].z);
    expect(floorToLight.dot(aim)).toBeLessThan(Math.cos(vault!.angle));
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
    applyArchTier("mobile-max");
    expect(visibleArchLights()).toBe(names.filter((name) => MOBILE_MAX_REAL.has(name)).length);
    applyArchTier("minimal");
    expect(visibleArchLights()).toBe(0);
    expect(lightTierFromSearch("?lights=pr38")).toBe("pr38");
    expect(lightTierFromSearch("?lights=mobile-max")).toBe("mobile-max");
    expect(lightTierFromSearch("")).toBe("budget");
  });

  it("keeps hall and vault energy on the physical curve instead of a linear sheet", () => {
    const lamps = allArchLamps();
    const hall = lamps.find((lamp) => lamp.name === "south-hall");
    expect(hall).toBeTruthy();
    const dist = hall!.y - 6.275;
    const cd = 2200 * hall!.gain;
    const physical = (cd * physicalDistanceAtten(dist, hall!.distance)) / Math.PI;
    const linear = (cd * (1 - dist / hall!.distance) ** 2) / Math.PI;
    expect(physical).toBeGreaterThan(1);
    expect(physical).toBeLessThan(12);
    expect(linear).toBeGreaterThan(80);
    expect(physical).toBeLessThan(linear / 8);
    const vault = lamps.find((lamp) => lamp.name === "observation-vault");
    expect(vault).toBeTruthy();
    const vaultPhysical = ((vault!.absolute ?? 0) * physicalDistanceAtten(8, vault!.distance)) / Math.PI;
    const vaultLinear = ((vault!.absolute ?? 0) * (1 - 8 / vault!.distance) ** 2) / Math.PI;
    expect(vaultPhysical).toBeLessThan(vaultLinear / 8);
    expect(vault!.absolute).toBe(1400);
    const pool = lamps.find((lamp) => lamp.name === "observation-pool");
    const censer = lamps.find((lamp) => lamp.name === "observation-censer-0");
    expect(pool?.absolute).toBe(180);
    expect(censer?.absolute).toBe(10);
    expect(lamps.find((lamp) => lamp.name === "south-hall")?.gain).toBeCloseTo(0.28, 5);
    expect(lamps.find((lamp) => lamp.name === "north-hall")?.gain).toBeCloseTo(0.28, 5);
    expect(ARCH_SLOTS).toBe(8);
  });
});

const PHONE_LIMIT = 256;
const FULL_LAMPS: LightCensus = { point: 39, spot: 12, directional: 2, hemisphere: 1, ambient: 1 };
const BUDGET_LAMPS: LightCensus = { point: 22, spot: 0, directional: 2, hemisphere: 1, ambient: 1 };
const EMISSIVE_LAMPS: LightCensus = { point: 23, spot: 2, directional: 2, hemisphere: 1, ambient: 1 };
const MOBILE_LAMPS: LightCensus = { point: 38, spot: 4, directional: 2, hemisphere: 1, ambient: 1 };

function censusFor(tier: "pr38" | "mobile-max" | "emissive" | "budget" | "minimal" | "neutral"): LightCensus {
  if (tier === "pr38") return FULL_LAMPS;
  if (tier === "emissive") return EMISSIVE_LAMPS;
  if (tier === "mobile-max") return MOBILE_LAMPS;
  if (tier === "budget" || tier === "minimal" || tier === "neutral") return BUDGET_LAMPS;
  return BUDGET_LAMPS;
}

describe("full lamps capability", () => {
  it("refuses the Adreno 750 uniform budget and still allows a desktop limit", () => {
    expect(fragmentUniformVectors(FULL_LAMPS)).toBeGreaterThan(PHONE_LIMIT);
    expect(fragmentUniformVectors(BUDGET_LAMPS)).toBeLessThanOrEqual(PHONE_LIMIT);
    expect(fragmentUniformVectors(EMISSIVE_LAMPS)).toBeLessThanOrEqual(PHONE_LIMIT);
    const refused = lightingTierFits(PHONE_LIMIT, FULL_LAMPS, "Full lamps");
    expect(refused.ok).toBe(false);
    expect(refused.reason).toContain("256");
    expect(refused.reason).toContain("fragment vectors");
    expect(refused.reason).not.toContain("shader");
    expect(lightingTierFits(1024, FULL_LAMPS).ok).toBe(true);
    expect(lightingTierFits(4096, FULL_LAMPS).ok).toBe(true);
    expect(lightingTierFits(PHONE_LIMIT, BUDGET_LAMPS).ok).toBe(true);
    expect(lightingTierFits(PHONE_LIMIT, EMISSIVE_LAMPS).ok).toBe(true);
    const mobileVectors = fragmentUniformVectors(MOBILE_LAMPS);
    expect(mobileVectors).toBe(238);
    expect(PHONE_LIMIT - mobileVectors).toBeGreaterThanOrEqual(16);
    expect(lightingTierFits(PHONE_LIMIT, MOBILE_LAMPS, "Mobile Max").ok).toBe(true);
    expect(MOBILE_MAX_REAL.has("observation-vault")).toBe(true);
    expect(MOBILE_MAX_REAL.has("wall-grazer-east")).toBe(true);
    expect(MOBILE_MAX_REAL.has("wall-grazer-0")).toBe(false);
    expect(MOBILE_MAX_REAL.has("south-threshold")).toBe(false);
  });

  it("uses Mobile Max when Full Lamps does not fit, and keeps an explicit Budget", () => {
    const phone = resolveLightTier("pr38", PHONE_LIMIT, censusFor);
    expect(phone.tier).toBe("mobile-max");
    expect(phone.vectors).toBe(238);
    expect(phone.note).toContain("256");
    expect(phone.note).toContain("Mobile Max");
    expect(resolveLightTier("pr38", 4096, censusFor).tier).toBe("pr38");
    expect(resolveLightTier("budget", PHONE_LIMIT, censusFor)).toMatchObject({ tier: "budget", note: null });
    expect(resolveLightTier("emissive", PHONE_LIMIT, censusFor).tier).toBe("emissive");
    expect(resolveLightTier("neutral", PHONE_LIMIT, censusFor).tier).toBe("neutral");
  });
});

describe("cenotaph diagnostics report", () => {
  afterEach(() => resetDiagnostics());

  it("does not claim a shader log it does not have", () => {
    patchDiagnostics({
      production: "loaded",
      floor: "idle",
      shaderLog: "unavailable",
      tier: "budget",
      activeRealLights: 27,
      activeArchSlots: 8,
      uniformVectors: 170,
      context: "active",
      webglVersion: "WebGL 2",
      maxFragmentUniforms: 224,
    });
    const report = diagnosticsReport("TestPhone");
    expect(report).toContain("device: TestPhone");
    expect(report).toContain("shaderLog: unavailable");
    expect(report).toContain("production: loaded");
    expect(report).toContain("floor: idle");
    expect(report).toContain("maxFragmentUniforms: 224");
    expect(report).toContain("uniformVectors: 170");
    expect(getDiagnostics().shaderLog).toBe("unavailable");
    expect(report).not.toContain("shader ready");
  });

  it("publishes a new snapshot for each tier and shader change", () => {
    resetDiagnostics();
    const seen: string[] = [];
    const stop = subscribeDiagnostics(() => {
      const snap = getDiagnostics();
      seen.push(`${snap.tier}:${snap.activeRealLights}:${snap.shaderLog}`);
    });
    const first = getDiagnostics();
    patchDiagnostics({ tier: "emissive", activeRealLights: 29, activeArchSlots: 0 });
    const second = getDiagnostics();
    patchDiagnostics({ tier: "neutral", activeRealLights: 26, activeArchSlots: 0 });
    const third = getDiagnostics();
    patchDiagnostics({ shaderLog: "link failed" });
    const fourth = getDiagnostics();
    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
    expect(fourth).not.toBe(third);
    expect(fourth.tier).toBe("neutral");
    expect(fourth.shaderLog).toBe("link failed");
    expect(fourth.activeRealLights).toBe(26);
    expect(seen).toEqual(["emissive:29:unavailable", "neutral:26:unavailable", "neutral:26:link failed"]);
    patchDiagnostics({ tier: "neutral", shaderLog: "link failed" });
    expect(getDiagnostics()).toBe(fourth);
    stop();
  });
});
