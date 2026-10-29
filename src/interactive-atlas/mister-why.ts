import * as THREE from "three";
import type { ExhibitId } from "./destinations";
import { FOLLOW_GRACE, angDelta, stepHeadingFollow, type FollowState } from "./follow-camera";
import {
  ORBIT_PITCH_DOWN,
  ORBIT_PITCH_UP,
  ORBIT_YAW,
  WALK_BACK,
  WALK_BACK_INHERIT,
  WALK_BACK_MAX,
  WALK_BACK_MIN,
  WALK_LOOK,
  WALK_LOOK_MAX,
  WALK_LOOK_MIN,
  aheadForLook,
  eyeForLook,
} from "./framing";
import { clearBoom, keepGarden, sampleGround } from "./terrain";
import { CEN_BLOCK, FOOT, PLACES, projectOut } from "./world";

const SPEED = 24;
/** Stick angle change that counts as a new command, not noise. */
const STICK_RELATCH = 0.55;
const MOVE_DEADZONE = 0.12;
const FOLLOW_SPEED = 0.8;

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}

export type WalkInput = {
  /** Strafe, camera-right positive. */
  x: number;
  /** Forward along the latched view, positive. */
  y: number;
  orbiting: boolean;
};

export type Walker = {
  group: THREE.Group;
  active: boolean;
  enter: (focus: THREE.Vector3, camera: THREE.Camera) => void;
  stop: () => void;
  update: (dt: number, time: number, input: WalkInput, reduced: boolean) => void;
  applyCamera: (camera: THREE.PerspectiveCamera, dt: number, reduced: boolean) => void;
  orbit: (dx: number, dy: number) => void;
  zoom: (factor: number) => void;
  pose: () => { x: number; z: number; heading: number; camYaw: number };
  aim: () => THREE.Vector3;
  nearest: () => { id: ExhibitId | null; proximity: number };
  snapshot: () => WalkerSnapshot;
  restore: (pose: WalkerSnapshot) => void;
};

export type WalkerSnapshot = {
  x: number;
  z: number;
  heading: number;
  camYaw: number;
  back: number;
  lookLift: number;
};

export function createWalker(scene: THREE.Scene): Walker {
  const cloth = new THREE.MeshStandardMaterial({ color: 0x2c2824, roughness: 0.78, metalness: 0.08 });
  const ivory = new THREE.MeshStandardMaterial({
    color: 0xe7dccb,
    roughness: 0.55,
    metalness: 0.02,
    emissive: 0x3a332b,
    emissiveIntensity: 0.55,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xc4a574,
    roughness: 0.42,
    metalness: 0.45,
    emissive: 0x5a4630,
    emissiveIntensity: 0.35,
  });

  const group = new THREE.Group();
  group.name = "mister-why";
  group.visible = false;

  const hipL = new THREE.Group();
  const hipR = new THREE.Group();
  hipL.position.set(-0.11, 0.78, 0);
  hipR.position.set(0.11, 0.78, 0);
  const legGeo = new THREE.CapsuleGeometry(0.075, 0.46, 3, 6);
  const legL = new THREE.Mesh(legGeo, cloth);
  const legR = new THREE.Mesh(legGeo, cloth);
  legL.position.y = -0.34;
  legR.position.y = -0.34;
  hipL.add(legL);
  hipR.add(legR);

  const armL = new THREE.Group();
  const armR = new THREE.Group();
  armL.position.set(-0.22, 1.28, 0);
  armR.position.set(0.22, 1.28, 0);
  const armGeo = new THREE.CapsuleGeometry(0.045, 0.38, 2, 5);
  const aL = new THREE.Mesh(armGeo, cloth);
  const aR = new THREE.Mesh(armGeo, cloth);
  aL.position.y = -0.24;
  aR.position.y = -0.24;
  armL.add(aL);
  armR.add(aR);

  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.78, 8), cloth);
  coat.position.y = 1.05;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.34, 3, 7), cloth);
  torso.position.y = 1.18;
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.018, 6, 16), gold);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.42;
  const pin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.012), gold);
  pin.position.set(0, 1.18, 0.16);
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.02), gold);
  seam.position.set(0, 1.08, -0.2);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), cloth);
  head.position.y = 1.62;
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), ivory);
  face.position.set(0, 1.64, 0.09);
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.02), gold);
  brow.position.set(0, 1.69, 0.1);

  const shade = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 16),
    new THREE.MeshBasicMaterial({ color: 0x050608, transparent: true, opacity: 0.4, depthWrite: false }),
  );
  shade.rotation.x = -Math.PI / 2;
  shade.position.y = 0.03;

  group.add(shade, hipL, hipR, armL, armR, coat, torso, collar, pin, seam, head, face, brow);
  scene.add(group);

  let active = false;
  let x = FOOT.x;
  let z = FOOT.z;
  let heading = Math.PI;
  let vx = 0;
  let vz = 0;
  let phase = 0;
  let camYaw = 0;
  let lookLift = WALK_LOOK;
  let lookLiftT = WALK_LOOK;
  let back = WALK_BACK;
  let backT = WALK_BACK;
  let moveBasis = 0;
  let basisHeld = false;
  let heldStick = 0;
  let followState: FollowState = { yaw: 0, grace: 0, sustained: 0 };
  const look = new THREE.Vector3();
  const lookT = new THREE.Vector3();
  const desired = new THREE.Vector3();

  function placeBody() {
    group.position.set(x, sampleGround(x, z), z);
    group.rotation.y = heading;
  }

  function nearest() {
    let id: ExhibitId | null = null;
    let proximity = 0;
    for (const key of Object.keys(PLACES) as ExhibitId[]) {
      const p = PLACES[key];
      const d = Math.hypot(x - p.x, z - p.z);
      const near = 1 - Math.min(1, Math.max(0, (d - p.block) / (p.reach - p.block)));
      if (near > proximity) {
        proximity = near;
        id = near > 0.02 ? key : id;
      }
    }
    if (proximity <= 0.02) id = null;
    return { id, proximity };
  }

  const walker: Walker = {
    group,
    get active() {
      return active;
    },
    enter(focus, camera) {
      active = true;
      group.visible = true;
      const r = Math.hypot(focus.x, focus.z);
      if (r < 70) {
        x = FOOT.x;
        z = FOOT.z;
        heading = Math.PI;
      } else {
        const solved = projectOut(focus.x, focus.z, 0, 0);
        x = solved.x;
        z = solved.z;
        heading = Math.atan2(-x, -z);
      }
      vx = 0;
      vz = 0;
      phase = 0;
      placeBody();
      look.copy(focus);
      lookT.set(x, sampleGround(x, z) + WALK_LOOK, z);
      camYaw = Math.atan2(camera.position.x - x, camera.position.z - z);
      moveBasis = camYaw;
      basisHeld = false;
      followState = { yaw: camYaw, grace: 0, sustained: 0 };
      lookLift = WALK_LOOK;
      lookLiftT = WALK_LOOK;
      const inherited = Math.hypot(camera.position.x - x, camera.position.z - z);
      back = Math.max(WALK_BACK, Math.min(WALK_BACK_INHERIT, inherited));
      backT = WALK_BACK;
    },
    stop() {
      active = false;
      vx = 0;
      vz = 0;
      basisHeld = false;
      followState = { yaw: camYaw, grace: 0, sustained: 0 };
      hipL.rotation.x = 0;
      hipR.rotation.x = 0;
      armL.rotation.x = 0;
      armR.rotation.x = 0;
      torso.position.y = 1.18;
    },
    update(dt, _time, input, reduced) {
      if (!active) return;
      const step = Math.min(0.05, Math.max(0, dt));
      const commanded = Math.hypot(input.x, input.y) > MOVE_DEADZONE;
      const stick = Math.atan2(input.x, input.y);
      // Latch at the start of a command, including one that begins mid-orbit.
      // A held stick keeps that basis so follow cannot steer the walk.
      if (!commanded) {
        basisHeld = false;
      } else if (!basisHeld) {
        moveBasis = camYaw;
        basisHeld = true;
        heldStick = stick;
      } else if (!input.orbiting && Math.abs(angDelta(heldStick, stick)) > STICK_RELATCH) {
        moveBasis = camYaw;
        heldStick = stick;
      }
      const lookx = -Math.sin(moveBasis);
      const lookz = -Math.cos(moveBasis);
      const rightx = Math.cos(moveBasis);
      const rightz = -Math.sin(moveBasis);
      let mx = rightx * input.x + lookx * input.y;
      let mz = rightz * input.x + lookz * input.y;
      const mag = Math.hypot(mx, mz);
      if (mag > 1) {
        mx /= mag;
        mz /= mag;
      }
      const wishX = mx * SPEED;
      const wishZ = mz * SPEED;
      const k = 1 - Math.exp(-step * 6);
      vx += (wishX - vx) * k;
      vz += (wishZ - vz) * k;
      if (mag < 0.04) {
        vx *= 1 - k;
        vz *= 1 - k;
      }
      x += vx * step;
      z += vz * step;
      const solved = projectOut(x, z, vx, vz);
      const kept = keepGarden(solved.x, solved.z, solved.vx, solved.vz);
      x = kept.x;
      z = kept.z;
      vx = kept.vx;
      vz = kept.vz;
      const sp = Math.hypot(vx, vz);
      if (sp > 0.35) {
        const face = Math.atan2(vx, vz);
        heading += angDelta(heading, face) * (1 - Math.exp(-step * 9));
      }
      if (!reduced && sp > 0.4) phase += step * (7 + sp * 0.15);
      else if (reduced) phase = 0;
      const swing = reduced ? 0 : Math.sin(phase) * Math.min(0.7, sp / SPEED);
      hipL.rotation.x = swing;
      hipR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.7;
      armR.rotation.x = swing * 0.7;
      const bob = reduced ? 0 : Math.abs(Math.sin(phase)) * Math.min(0.05, sp / 400);
      torso.position.y = 1.18 + bob;
      coat.position.y = 1.05 + bob;
      placeBody();
      followState = stepHeadingFollow(followState, step, {
        reduced,
        orbiting: input.orbiting,
        moving: sp > FOLLOW_SPEED,
        heading,
      });
      camYaw = followState.yaw;
    },
    applyCamera(camera, dt, reduced) {
      if (!active) return;
      const step = Math.min(0.08, Math.max(0, dt));
      const damp = reduced ? 1 : 1 - Math.exp(-step * 1.8);
      const ox = Math.sin(camYaw);
      const oz = Math.cos(camYaw);
      back += (backT - back) * damp;
      lookLift += (lookLiftT - lookLift) * damp;
      const feet = sampleGround(x, z);
      const ahead = aheadForLook(lookLift);
      lookT.set(x - ox * ahead, feet + lookLift, z - oz * ahead);
      look.lerp(lookT, damp);
      const eye = feet + eyeForLook(lookLift);
      desired.set(x + ox * back, eye, z + oz * back);
      const cr = Math.hypot(desired.x, desired.z);
      if (cr < CEN_BLOCK + 3 && cr > 0.01) {
        const s = (CEN_BLOCK + 3) / cr;
        desired.x *= s;
        desired.z *= s;
      }
      const cleared = clearBoom(x, z, { x: desired.x, y: desired.y, z: desired.z });
      desired.set(cleared.x, cleared.y, cleared.z);
      if (reduced) camera.position.copy(desired);
      else camera.position.lerp(desired, damp);
      camera.lookAt(look);
      camera.updateMatrixWorld();
    },
    orbit(dx, dy) {
      camYaw -= dx * ORBIT_YAW;
      const gain = dy > 0 ? ORBIT_PITCH_DOWN : ORBIT_PITCH_UP;
      lookLiftT = clamp(lookLiftT - dy * gain, WALK_LOOK_MIN, WALK_LOOK_MAX);
      followState = { yaw: camYaw, grace: FOLLOW_GRACE, sustained: 0 };
    },
    zoom(factor) {
      backT = clamp(backT * factor, WALK_BACK_MIN, WALK_BACK_MAX);
    },
    pose: () => ({ x, z, heading, camYaw }),
    aim: () => look.clone(),
    nearest,
    snapshot: () => ({ x, z, heading, camYaw, back: backT, lookLift: lookLiftT }),
    restore(pose) {
      active = true;
      group.visible = true;
      x = pose.x;
      z = pose.z;
      heading = pose.heading;
      vx = 0;
      vz = 0;
      phase = 0;
      camYaw = pose.camYaw;
      moveBasis = pose.camYaw;
      basisHeld = false;
      followState = { yaw: pose.camYaw, grace: 0, sustained: 0 };
      back = pose.back;
      backT = pose.back;
      lookLift = pose.lookLift;
      lookLiftT = pose.lookLift;
      placeBody();
      const ox = Math.sin(camYaw);
      const oz = Math.cos(camYaw);
      const feet = sampleGround(x, z);
      const ahead = aheadForLook(lookLift);
      look.set(x - ox * ahead, feet + lookLift, z - oz * ahead);
      lookT.copy(look);
    },
  };

  return walker;
}
