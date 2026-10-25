/**
 * Walk-camera follow. A patient trailing yaw, not a steering assist.
 *
 * Avatar heading is atan2(vx, vz): 0 faces +Z.
 * The camera sits at (sin(camYaw), cos(camYaw)) and looks the opposite way.
 * Behind the face, camYaw = heading + π. Those are not the same number.
 */

export const FOLLOW_GRACE = 1.5;
export const FOLLOW_SUSTAIN = 0.35;
export const FOLLOW_RATE = 1.5;
export const FOLLOW_RATE_FAST = 2;
export const FOLLOW_FAST_AT = 1.1;

export type FollowState = {
  yaw: number;
  grace: number;
  sustained: number;
};

export function angDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

export function trailingYaw(heading: number) {
  return heading + Math.PI;
}

export function stepHeadingFollow(
  state: FollowState,
  dt: number,
  opts: { reduced: boolean; orbiting: boolean; moving: boolean; heading: number },
): FollowState {
  const step = Math.max(0, dt);
  if (opts.orbiting) {
    return { yaw: state.yaw, grace: FOLLOW_GRACE, sustained: 0 };
  }
  if (opts.reduced) {
    return { yaw: state.yaw, grace: Math.max(0, state.grace - step), sustained: 0 };
  }
  if (state.grace > 0) {
    return { yaw: state.yaw, grace: Math.max(0, state.grace - step), sustained: 0 };
  }
  if (!opts.moving) {
    return { yaw: state.yaw, grace: 0, sustained: 0 };
  }
  const sustained = state.sustained + step;
  if (sustained < FOLLOW_SUSTAIN) {
    return { yaw: state.yaw, grace: 0, sustained };
  }
  const delta = angDelta(state.yaw, trailingYaw(opts.heading));
  const rate = Math.abs(delta) > FOLLOW_FAST_AT ? FOLLOW_RATE_FAST : FOLLOW_RATE;
  return {
    yaw: state.yaw + delta * (1 - Math.exp(-rate * step)),
    grace: 0,
    sustained,
  };
}
