import { describe, expect, it } from "vitest";
import { DANCER_OMEGA } from "./dancer-motion";
import {
  AUDIO_TRIAL_S,
  CSV_COLUMNS,
  LEGACY_REPORTS_KEY,
  SESSION_KEY,
  SESSION_KEY_V1,
  appendAudioCue,
  appendEvent,
  circularMean,
  classifyReport,
  conditionOrder,
  countsBySpeed,
  createSession,
  formatEventRow,
  independentCues,
  loadSession,
  median,
  medianReversalInterval,
  migrateV1,
  panForReport,
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
    expect(parsed.schema).toBe(2);
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

  it("migrates a v1 session without rewriting it, and exports schema 2", () => {
    const v1 = {
      schema: 1,
      id: "from-v1",
      startedWall: 50,
      config: {
        omegaRadS: 0.84,
        speedMin: 0.25,
        speedMax: 6,
        reactionTimeCorrection: "none",
        posePhase: "none",
        gazeMeaning: "selected target, not measured fixation",
      },
      events: [{
        tWall: 80,
        tMono: 3,
        elapsedS: 0.03,
        yawUnwrapped: 1.7,
        yawMod: 1.7,
        physicalDirection: "ccw",
        speed: 2,
        angularVelocityRadS: -1.68,
        running: true,
        legEmphasis: 0.4,
        armPosition: 0.2,
        posePhase: null,
        gazeTarget: "Head",
        gazePct: 10,
        shaded: false,
        perspective: false,
        depthCues: false,
        floorShadow: false,
        markers: false,
        perceived: "clockwise",
        sincePrevS: null,
        kind: "initial",
      }],
    };
    const raw = JSON.stringify(v1);
    const memory = new Map<string, string>();
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
    };
    storage.setItem(SESSION_KEY_V1, raw);
    const loaded = loadSession(storage, 10);
    expect(loaded.schema).toBe(2);
    expect(loaded.migratedFrom).toBe(1);
    expect(loaded.id).toBe("from-v1");
    expect(loaded.events[0].yawUnwrapped).toBe(1.7);
    expect(loaded.events[0].audioMode).toBe("silent");
    expect(loaded.events[0].action).toBe("report");
    expect(loaded.audio.mode).toBe("silent");
    expect(loaded.audioCues).toEqual([]);
    expect(migrateV1(v1)?.events[0].physicalDirection).toBe("ccw");
    saveSession(storage, loaded);
    expect(storage.getItem(SESSION_KEY_V1)).toBe(raw);
    const csv = sessionToCsv(loaded);
    const header = csv.split("\n")[0].split(",");
    const body = csv.split("\n")[1].split(",");
    expect(header).toEqual([...CSV_COLUMNS]);
    expect(body).toHaveLength(header.length);
    expect(csv).toContain("audio_mode");
    expect(csv).toContain("audio_volume_gain");
    expect(body[header.indexOf("audio_mode")]).toBe("silent");
    expect(body[header.indexOf("row_kind")]).toBe("report");
    const parsed = JSON.parse(sessionToJson(loaded));
    expect(parsed.schema).toBe(2);
    expect(parsed.migratedFrom).toBe(1);
    expect(parsed.note).toMatch(/not a demonstrated effect/i);

    const seeded = independentCues(42, AUDIO_TRIAL_S);
    expect(seeded).toEqual(independentCues(42, AUDIO_TRIAL_S));
    expect(seeded.length).toBeGreaterThan(3);
    expect(seeded.every((cue) => cue.pan === "left" || cue.pan === "right")).toBe(true);
    const orders = [0, 1, 2, 3, 4, 5].map((seed) => conditionOrder(seed).join(","));
    expect(new Set(orders).size).toBe(6);
    expect(conditionOrder(8)).toEqual(conditionOrder(2));
    expect(panForReport("clockwise")).toBe("right");
    expect(panForReport("counterclockwise")).toBe("left");

    const cued = appendAudioCue(loaded, {
      tWall: 90,
      tMono: 4,
      yawUnwrapped: 1.7,
      physicalDirection: "ccw",
      audioTimeS: 2.5,
      scheduledAtS: 2.5,
      audioPan: "left",
      cueIndex: 0,
      seed: 42,
      cause: "independent-schedule",
    });
    expect(cued.events).toHaveLength(1);
    expect(cued.events[0].yawUnwrapped).toBe(1.7);
    expect(cued.audioCues[0].audioPan).toBe("left");
    expect(cued.audioCues[0].physicalDirection).toBe("ccw");
    const cueCsv = sessionToCsv(cued).split("\n")[2].split(",");
    expect(cueCsv).toHaveLength(CSV_COLUMNS.length);
    expect(cueCsv[CSV_COLUMNS.indexOf("row_kind")]).toBe("audio-cue");
    expect(cueCsv[CSV_COLUMNS.indexOf("audio_time_s")]).toBe("2.5");
    expect(cueCsv[CSV_COLUMNS.indexOf("observer_action")]).toBe("");
  });
});
