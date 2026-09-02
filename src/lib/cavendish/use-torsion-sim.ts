import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  derive,
  initialState,
  step,
  type PaisMode,
  type SimState,
} from "./physics";

export function useTorsionSim(mode: PaisMode, strength: number, damping: number) {
  const [paused, setPaused] = useState(false);
  const [state, setState] = useState<SimState>(initialState);
  const stateRef = useRef(state);
  const paramsRef = useRef({ mode, strength, damping, paused });

  stateRef.current = state;
  paramsRef.current = { mode, strength, damping, paused };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const raw = (now - last) / 1000;
      last = now;
      const dt = Math.min(0.033, Math.max(0, raw));
      const p = paramsRef.current;
      if (!p.paused && dt > 0) {
        const next = step(stateRef.current, p, dt);
        stateRef.current = next;
        setState(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const reset = useCallback(() => {
    const next = initialState();
    stateRef.current = next;
    setState(next);
  }, []);

  // Mode change restarts the journey so the comparison is readable.
  const modeRef = useRef(mode);
  useEffect(() => {
    if (modeRef.current !== mode) {
      modeRef.current = mode;
      reset();
    }
  }, [mode, reset]);

  const derived = useMemo(
    () => derive({ mode, strength, damping }),
    [mode, strength, damping],
  );

  return {
    state,
    derived,
    paused,
    setPaused,
    reset,
  };
}
