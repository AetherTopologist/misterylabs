/** Radians per second at speed 1. Matches the legacy 0.014 rad/frame step at 60 fps. */
export const DANCER_OMEGA = 0.014 * 60;

/** Speed slider. 1× is DANCER_OMEGA. 6× is one revolution in about 1.25 s. */
export const DANCER_SPEED_MIN = 0.25;
export const DANCER_SPEED_MAX = 6;
export const DANCER_SPEED_STEP = 0.05;

export type SpinDirection = 1 | -1;

/**
 * Physical yaw after a constant-rate interval.
 * Perceived spin is not this number. The silhouette does not determine it.
 * `offset` is the phase already accumulated. Changing `speed` does not zero it.
 */
export function physicalAngle(args: {
  elapsed: number;
  speed: number;
  direction: SpinDirection;
  offset?: number;
}): number {
  const offset = args.offset ?? 0;
  return offset + args.direction * args.speed * DANCER_OMEGA * args.elapsed;
}
