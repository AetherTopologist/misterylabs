import { afterEach, describe, expect, it, vi } from "vitest";
import { createDancerAudio } from "./dancer-audio";

class Param {
  value = 0;
  setValueAtTime(value: number) { this.value = value; }
  exponentialRampToValueAtTime() {}
}

class Node {
  gain = new Param();
  pan = new Param();
  frequency = new Param();
  connect() { return this; }
  start() {}
  stop() {}
}

class FakeContext {
  static last: FakeContext | null = null;
  currentTime = 0;
  state = "running";
  destination = new Node();
  resumed = false;
  suspended = false;
  closed = false;
  constructor() { FakeContext.last = this; }
  createGain() { return new Node(); }
  createOscillator() { return new Node(); }
  createStereoPanner() { return new Node(); }
  resume() { this.resumed = true; return Promise.resolve(); }
  suspend() { this.suspended = true; this.state = "suspended"; return Promise.resolve(); }
  close() { this.closed = true; this.state = "closed"; return Promise.resolve(); }
}

describe("dancer audio engine", () => {
  afterEach(() => {
    vi.useRealTimers();
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
  });

  it("stays silent until start, then stops and closes", () => {
    vi.useFakeTimers();
    (window as unknown as { AudioContext: typeof FakeContext }).AudioContext = FakeContext;
    const engine = createDancerAudio();
    expect(engine.start({ mode: "silent", volume: 0.08, seed: 1, trialS: 16, reducedMotion: false })).toBe(false);
    expect(FakeContext.last).toBeNull();
    expect(engine.start({ mode: "independent", volume: 0.2, seed: 4, trialS: 8, reducedMotion: true })).toBe(true);
    expect(FakeContext.last?.resumed).toBe(true);
    const heard: number[] = [];
    engine.onCue((cue) => heard.push(cue.audioTimeS));
    FakeContext.last!.currentTime = 3;
    vi.advanceTimersByTime(50);
    expect(heard.length).toBe(1);
    expect(heard[0]).toBe(3);
    engine.stop();
    expect(FakeContext.last?.suspended).toBe(true);
    engine.dispose();
    expect(FakeContext.last?.closed).toBe(true);
    expect(engine.currentTime()).toBeNull();
  });
});
