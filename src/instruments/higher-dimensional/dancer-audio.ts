import { independentCues, type AudioMode } from "./dancer-session";

export type LivePan = "left" | "right" | "center";

export type ScheduledCue = {
  index: number;
  pan: "left" | "right";
  seed: number;
  audioTimeS: number;
  scheduledAtS: number;
};

type CueHandler = (cue: ScheduledCue) => void;

type AudioCtor = new () => AudioContext;

function panValue(pan: LivePan): number {
  if (pan === "left") return -0.85;
  if (pan === "right") return 0.85;
  return 0;
}

function ctorFromWindow(): AudioCtor | null {
  const win = window as Window & { webkitAudioContext?: AudioCtor };
  return win.AudioContext ?? win.webkitAudioContext ?? null;
}

/**
 * Synthesized pulses through a StereoPannerNode.
 * Nothing is constructed until start(), which must come from a user gesture.
 * The schedule never reads dancer yaw.
 */
export function createDancerAudio() {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let panner: StereoPannerNode | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let pan: LivePan | "off" = "off";
  let onCue: CueHandler = () => {};
  let disposed = false;
  const pending: { index: number; pan: "left" | "right"; seed: number; scheduledAtS: number }[] = [];

  function clearTimer() {
    if (timer != null) {
      clearInterval(timer);
      timer = null;
    }
    pending.length = 0;
  }

  function pulse(when: number) {
    if (!ctx || !panner) return;
    const gain = ctx.createGain();
    const tone = ctx.createOscillator();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(1, when + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
    tone.type = "sine";
    tone.frequency.setValueAtTime(220, when);
    tone.connect(gain);
    gain.connect(panner);
    tone.start(when);
    tone.stop(when + 0.18);
  }

  function ensure(volume: number): boolean {
    if (disposed) return false;
    const Ctor = ctorFromWindow();
    if (!Ctor) return false;
    if (!ctx) {
      try {
        ctx = new Ctor();
        master = ctx.createGain();
        panner = ctx.createStereoPanner();
        panner.connect(master);
        master.connect(ctx.destination);
      } catch {
        ctx = null;
        return false;
      }
    }
    if (master) master.gain.value = volume;
    void ctx.resume().catch(() => {});
    return true;
  }

  return {
    start(opts: { mode: AudioMode; volume: number; seed: number; trialS: number; reducedMotion: boolean }): boolean {
      if (opts.mode === "silent") return false;
      const volume = opts.reducedMotion ? Math.min(opts.volume, 0.05) : opts.volume;
      if (!ensure(volume)) return false;
      if (!ctx || !panner) return false;
      clearTimer();
      const origin = ctx.currentTime;
      if (opts.mode === "independent") {
        pan = "center";
        panner.pan.setValueAtTime(0, origin);
        for (const cue of independentCues(opts.seed, opts.trialS)) {
          const at = origin + cue.atS;
          const value = panValue(cue.pan);
          panner.pan.setValueAtTime(value, at);
          pulse(at);
          pending.push({ index: cue.index, pan: cue.pan, seed: opts.seed, scheduledAtS: at });
        }
      } else {
        pan = "center";
        panner.pan.setValueAtTime(0, origin);
        let next = origin + 0.05;
        const arm = () => {
          if (!ctx) return;
          const horizon = ctx.currentTime + 0.4;
          while (next < horizon) {
            pulse(next);
            next += 0.5;
          }
        };
        arm();
        timer = setInterval(arm, 200);
      }
      if (opts.mode === "independent") {
        timer = setInterval(() => {
          if (!ctx) return;
          const now = ctx.currentTime;
          for (let i = pending.length - 1; i >= 0; i--) {
            const cue = pending[i];
            if (now + 0.02 < cue.scheduledAtS) continue;
            pending.splice(i, 1);
            pan = cue.pan;
            onCue({
              index: cue.index,
              pan: cue.pan,
              seed: cue.seed,
              scheduledAtS: cue.scheduledAtS,
              audioTimeS: now,
            });
          }
        }, 40);
      }
      return true;
    },
    stop() {
      clearTimer();
      pan = "off";
      if (ctx && ctx.state === "running") void ctx.suspend().catch(() => {});
    },
    setVolume(volume: number) {
      if (master) master.gain.value = volume;
    },
    setPan(next: LivePan) {
      pan = next;
      if (!ctx || !panner) return;
      const when = ctx.currentTime;
      panner.pan.setValueAtTime(panValue(next), when);
      pulse(when + 0.02);
    },
    getPan(): LivePan | "off" {
      return pan;
    },
    currentTime(): number | null {
      return ctx ? ctx.currentTime : null;
    },
    onCue(handler: CueHandler) {
      onCue = handler;
    },
    dispose() {
      this.stop();
      disposed = true;
      const closing = ctx;
      ctx = null;
      master = null;
      panner = null;
      if (closing) void closing.close().catch(() => {});
    },
  };
}

export type DancerAudio = ReturnType<typeof createDancerAudio>;
