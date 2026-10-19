import { describe, expect, it } from "vitest";
import { DANCER_OMEGA } from "./dancer-motion";
import {
  CSV_COLUMNS,
  LEGACY_REPORTS_KEY,
  SESSION_KEY,
  appendEvent,
  circularMean,
  classifyReport,
  countsBySpeed,
  createSession,
  formatEventRow,
  loadSession,
  median,
  medianReversalInterval,
  phaseBins,
  reversalCount,
  saveSession,
  sessionToCsv,
  sessionToJson,
  wrapYaw,
  type EventInput,
} from "./dancer-session";

function input(over: Partial<EventInput> = {}): EventInput {
  return {
    tWall: 1_000,
    tMono: 10,
    yawUnwrapped: 0.4,
    physicalDirection: "cw",
    speed: 1,
    running: true,
    legEmphasis: 0.7,
    armPosition: 0.6,
    gazePct: 90,
    shaded: false,
    perspective: false,
    depthCues: false,
    floorShadow: false,
    markers: false,
    ...over,
  };
}

describe("dancer reversal session", () => {
  it("wraps yaw on the circle and does not treat 0 and 360 as distant", () => {
    expect(wrapYaw(0)).toBe(0);
    expect(wrapYaw(-0.2)).toBeCloseTo(Math.PI * 2 - 0.2, 8);
    expect(wrapYaw(Math.PI * 2 + 0.2)).toBeCloseTo(0.2, 8);
    const near = circularMean([0.05, Math.PI * 2 - 0.05]);
    expect(near.n).toBe(2);
    expect(near.R).toBeGreaterThan(0.99);
    expect(near.meanRad! < 0.1 || near.meanRad! > Math.PI * 2 - 0.1).toBe(true);
    const opposed = circularMean([0, Math.PI]);
    expect(opposed.R!).toBeCloseTo(0, 8);
    expect(phaseBins([0, Math.PI / 8 - 0.01, Math.PI], 8)).toEqual([2, 0, 0, 0, 1, 0, 0, 0]);
  });

  it("labels initial, repeat, reversal, and unsure without counting unsure as a direction", () => {
    expect(classifyReport(null, "clockwise")).toBe("initial");
    expect(classifyReport("clockwise", "clockwise")).toBe("repeat");
    expect(classifyReport("clockwise", "counterclockwise")).toBe("reversal");
    expect(classifyReport("clockwise", "unsure")).toBe("unsure");
    expect(classifyReport(null, "unsure")).toBe("unsure");

    const session = createSession(1_000, "sess-1");
    const yaw = 1.25;
    const first = appendEvent(session, input({ tWall: 1_500, yawUnwrapped: yaw, speed: 1 }), "clockwise");
    const repeat = appendEvent(first, input({ tWall: 2_000, yawUnwrapped: yaw, speed: 1 }), "clockwise");
    const unsure = appendEvent(repeat, input({ tWall: 2_400, yawUnwrapped: yaw + 1, speed: 6 }), "unsure");
    const flip = appendEvent(unsure, input({
      tWall: 3_000,
      yawUnwrapped: yaw,
      physicalDirection: "ccw",
      speed: 6,
      running: false,
      shaded: true,
      gazePct: 10,
      legEmphasis: 0.2,
    }), "counterclockwise");

    expect(flip.events.map((event) => event.kind)).toEqual(["initial", "repeat", "unsure", "reversal"]);
    expect(reversalCount(flip.events)).toBe(1);
    expect(medianReversalInterval(flip.events)).toBeNull();
    expect(flip.events[0].yawUnwrapped).toBe(yaw);
    expect(flip.events[3].yawUnwrapped).toBe(yaw);
    expect(input().yawUnwrapped).toBe(0.4);
    expect(flip.events[3]).toMatchObject({
      physicalDirection: "ccw",
      speed: 6,
      angularVelocityRadS: -6 * DANCER_OMEGA,
      running: false,
      shaded: true,
      gazeTarget: "Head",
      posePhase: null,
      legEmphasis: 0.2,
      sincePrevS: 0.6,
      elapsedS: 2,
    });
    expect(flip.events[0].sincePrevS).toBeNull();
    expect(flip.events[0].angularVelocityRadS).toBeCloseTo(DANCER_OMEGA, 8);
    expect(countsBySpeed(flip.events)).toEqual([
      { speed: 1, n: 2 },
      { speed: 6, n: 2 },
    ]);
  });

  it("takes the median gap between reversal stamps, not a linear mean of angles", () => {
    let session = createSession(0, "sess-2");
    const taps: Array<[number, "clockwise" | "counterclockwise"]> = [
      [1_000, "clockwise"],
      [2_000, "counterclockwise"],
      [5_000, "clockwise"],
      [6_000, "counterclockwise"],
    ];
    for (const [tWall, perceived] of taps) {
      session = appendEvent(session, input({ tWall, yawUnwrapped: 0 }), perceived);
    }
    expect(reversalCount(session.events)).toBe(3);
    expect(medianReversalInterval(session.events)).toBe(2);
    expect(median([])).toBeNull();
    expect(median([4, 1, 3])).toBe(3);
    expect(median([1, 9])).toBe(5);
  });

  it("exports csv and json with units and keeps the legacy key untouched", () => {
    const session = appendEvent(createSession(500, "sess-3"), input({ tWall: 1_500, tMono: 40 }), "clockwise");
    const csv = sessionToCsv(session);
    expect(csv.split("\n")[0]).toBe(CSV_COLUMNS.join(","));
    expect(csv).toContain("sess-3");
    expect(csv).toContain("elapsed_s");
    expect(csv).toContain("angular_velocity_rad_s");
    expect(csv).toContain("gaze_target_selected");
    expect(csv).toContain("Foot");
    expect(csv).toContain(",,"); // empty pose phase between arm position and gaze
    const parsed = JSON.parse(sessionToJson(session));
    expect(parsed.schema).toBe(1);
    expect(parsed.sessionId).toBe("sess-3");
    expect(parsed.config.reactionTimeCorrection).toBe("none");
    expect(parsed.config.omegaRadS).toBeCloseTo(DANCER_OMEGA, 8);
    expect(parsed.events[0].posePhase).toBeNull();
    expect(parsed.note).toMatch(/not the perceptual transition/i);
    expect(formatEventRow(session.events[0])).toMatch(/clockwise · initial/);
    expect(formatEventRow(session.events[0])).not.toMatch(/physical/);

    const memory = new Map<string, string>();
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
    };
    storage.setItem(LEGACY_REPORTS_KEY, JSON.stringify([{ t: 1, perceived: "clockwise" }]));
    saveSession(storage, session);
    const loaded = loadSession(storage, 9_999);
    expect(loaded.id).toBe("sess-3");
    expect(loaded.events).toHaveLength(1);
    expect(JSON.parse(storage.getItem(LEGACY_REPORTS_KEY) || "[]")).toEqual([{ t: 1, perceived: "clockwise" }]);
    expect(storage.getItem(SESSION_KEY)).toContain("sess-3");
  });
});
