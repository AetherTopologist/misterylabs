import * as THREE from "three";
import { cenotaphLampLayout, type CenotaphLamp } from "./cenotaph-lamps";
import { lightTierFromSearch, patchDiagnostics, type LightTier } from "./cenotaph-diagnostics";

/** Fixed shader slots. The count never changes while walking, so the program is not rebuilt. */
export const ARCH_SLOTS = 8;

/** Seated observation floor. Kept local so this module does not import the floor mesh. */
const DOME_FLOOR_Y = 12.937;

export type MonumentZone = "dome" | "south" | "north" | "terrace" | "exterior";

export type ArchLamp = CenotaphLamp & {
  /** Candela, used instead of presetSpot * gain. Dome accents are absolute. */
  absolute?: number;
  colorHex?: number;
};

const EMISSIVE_REAL = new Set(["wall-grazer-east", "south-hall", "observation-pool"]);

const registry: THREE.Light[] = [];

export function resetArchRegistry() {
  registry.length = 0;
}

export function registerArchLight(light: THREE.Light) {
  light.userData.archLight = true;
  if (!registry.includes(light)) registry.push(light);
}

export function archLights() {
  return registry;
}

export function domeBudgetLamps(): ArchLamp[] {
  const censers = [20, 160, 230, 310].map((deg, i) => {
    const theta = (deg * Math.PI) / 180;
    const x = Math.cos(theta) * 10.6;
    const z = Math.sin(theta) * 10.6;
    return {
      kind: "point" as const,
      name: `observation-censer-${i}`,
      fixture: "pendant" as const,
      x,
      y: DOME_FLOOR_Y + 1.45,
      z,
      fx: x,
      fy: DOME_FLOOR_Y,
      fz: z,
      tx: x,
      ty: DOME_FLOOR_Y,
      tz: z,
      distance: 14,
      angle: 0,
      penumbra: 0,
      gain: 1,
      absolute: 48,
      colorHex: 0xffe1b8,
    };
  });
  return [
    {
      kind: "spot",
      name: "observation-pool",
      fixture: "pendant",
      x: 0,
      y: 20.5,
      z: 6.5,
      fx: 0,
      fy: DOME_FLOOR_Y,
      fz: 0,
      tx: 0,
      ty: DOME_FLOOR_Y,
      tz: 0,
      distance: 38,
      angle: 1.15,
      penumbra: 0.85,
      gain: 1,
      absolute: 38,
      colorHex: 0xffe6c4,
    },
    {
      kind: "spot",
      name: "observation-vault",
      fixture: "pendant",
      x: 0,
      y: 19.4,
      z: -0.4,
      fx: 0,
      fy: 19.4,
      fz: -0.4,
      tx: 0,
      ty: 108,
      tz: 0,
      distance: 140,
      angle: 1.2,
      penumbra: 0.92,
      gain: 1,
      absolute: 1400,
      colorHex: 0xfff1d6,
    },
    ...censers,
  ];
}

export function allArchLamps(): ArchLamp[] {
  return [...cenotaphLampLayout(), ...domeBudgetLamps()];
}

export function monumentZone(x: number, y: number, z: number): MonumentZone {
  const r = Math.hypot(x, z);
  if (r < 26 && y > 9 && y < 36) return "dome";
  if (r >= 93 && r <= 122 && y < 22 && !(z > 108.15 && Math.abs(x) <= 18)) return "terrace";
  if (z > 24 && z < 124 && Math.abs(x) < 22 && r < 96) return "south";
  if (z < -24 && z > -110 && Math.abs(x) < 22 && r < 96) return "north";
  return "exterior";
}

function dist2(lamp: ArchLamp, cam: { x: number; y: number; z: number }) {
  const dx = lamp.x - cam.x;
  const dy = lamp.y - cam.y;
  const dz = lamp.z - cam.z;
  return dx * dx + dy * dy + dz * dz;
}

function byDistance(cam: { x: number; y: number; z: number }) {
  return (a: ArchLamp, b: ArchLamp) => dist2(a, cam) - dist2(b, cam);
}

function named(lamps: ArchLamp[], names: string[]) {
  const out: ArchLamp[] = [];
  for (const name of names) {
    const lamp = lamps.find((item) => item.name === name);
    if (lamp) out.push(lamp);
  }
  return out;
}

/** Deterministic eight-light recipe. Near fixtures fill first; the zone fills what is left. */
export function selectArchSlots(lamps: ArchLamp[], cam: { x: number; y: number; z: number }): ArchLamp[] {
  const zone = monumentZone(cam.x, cam.y, cam.z);
  const order = byDistance(cam);
  const grazers = lamps.filter((lamp) => lamp.fixture === "grazer").sort(order);
  const bollards = lamps.filter((lamp) => lamp.fixture === "bollard").sort(order);
  let recipe: ArchLamp[];
  if (zone === "dome") {
    recipe = named(lamps, [
      "observation-pool",
      "observation-vault",
      "observation-censer-0",
      "observation-censer-1",
      "observation-censer-2",
      "observation-censer-3",
      "south-hall",
      "north-hall",
    ]);
  } else if (zone === "south") {
    recipe = [
      ...named(lamps, ["south-arch", "south-hall", "south-cheek-east", "south-cheek-west", "south-threshold", "observation-pool"]),
      ...grazers.slice(0, 2),
    ];
  } else if (zone === "north") {
    recipe = [
      ...named(lamps, ["north-arch", "north-hall", "observation-pool", "observation-vault"]),
      ...bollards.slice(0, 2),
      ...grazers.slice(0, 2),
    ];
  } else if (zone === "terrace") {
    recipe = [...grazers.slice(0, 4), ...bollards.slice(0, 4)];
  } else {
    recipe = [...grazers.slice(0, 6), ...bollards.slice(0, 2)];
  }
  const near = lamps.filter((lamp) => dist2(lamp, cam) < 34 * 34).sort(order).slice(0, 6);
  const out: ArchLamp[] = [];
  for (const lamp of [...near, ...recipe]) {
    if (out.length >= ARCH_SLOTS) break;
    if (!out.includes(lamp)) out.push(lamp);
  }
  return out;
}

export type SlotBlock = {
  pos: THREE.Vector4[];
  color: THREE.Vector4[];
  aim: THREE.Vector4[];
};

export function makeSlotBlock(): SlotBlock {
  return {
    pos: Array.from({ length: ARCH_SLOTS }, () => new THREE.Vector4()),
    color: Array.from({ length: ARCH_SLOTS }, () => new THREE.Vector4()),
    aim: Array.from({ length: ARCH_SLOTS }, () => new THREE.Vector4()),
  };
}

const _color = new THREE.Color();
const _dir = new THREE.Vector3();

export function writeArchSlots(lamps: ArchLamp[], presetSpot: number, presetColor: number, into: SlotBlock) {
  for (let i = 0; i < ARCH_SLOTS; i++) {
    const lamp = lamps[i];
    if (!lamp) {
      into.pos[i].set(0, 0, 0, 0);
      into.color[i].set(0, 0, 0, 0);
      into.aim[i].set(0, -1, 0, 0);
      continue;
    }
    const intensity = lamp.absolute ?? presetSpot * lamp.gain;
    _color.setHex(lamp.colorHex ?? presetColor);
    into.pos[i].set(lamp.x, lamp.y, lamp.z, lamp.distance);
    if (lamp.kind === "spot") {
      _dir.set(lamp.tx - lamp.x, lamp.ty - lamp.y, lamp.tz - lamp.z);
      if (_dir.lengthSq() < 1e-8) _dir.set(0, 1, 0);
      else _dir.normalize();
      const cone = Math.cos(lamp.angle);
      const pen = Math.cos(lamp.angle * (1 - lamp.penumbra));
      into.color[i].set(_color.r * intensity, _color.g * intensity, _color.b * intensity, cone);
      into.aim[i].set(_dir.x, _dir.y, _dir.z, pen);
    } else {
      into.color[i].set(_color.r * intensity, _color.g * intensity, _color.b * intensity, 0);
      into.aim[i].set(0, -1, 0, 0);
    }
  }
}

export function clearArchSlots(into: SlotBlock) {
  writeArchSlots([], 0, 0, into);
}

export function applyArchTier(tier: LightTier) {
  for (const light of registry) {
    if (tier === "pr38") light.visible = true;
    else if (tier === "emissive") light.visible = EMISSIVE_REAL.has(light.name);
    else light.visible = false;
  }
}

export function visibleArchLights() {
  return registry.filter((light) => light.visible).length;
}

export function initialLightTier(): LightTier {
  if (typeof window === "undefined") return "budget";
  return lightTierFromSearch(window.location.search);
}

export function noteLightBudget(tier: LightTier, realLights: number, archSlots: number) {
  patchDiagnostics({ tier, activeRealLights: realLights, activeArchSlots: archSlots });
}
