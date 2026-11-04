import * as THREE from "three";
import type { ExhibitId, WalkCamera } from "./destinations";
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
  EYE_HEIGHT,
  VISTA_BACK,
  VISTA_BACK_MAX,
  VISTA_BACK_MIN,
  VISTA_LIFT,
  VISTA_LIFT_MAX,
  VISTA_LIFT_MIN,
  aheadForLook,
  eyeForLook,
} from "./framing";
import { clearBoom, keepGarden, sampleGround } from "./terrain";
import { fitBoom, inStairMouth, placeCenotaphCamera } from "./ascent";
import { FOOT, PLACES, projectOut } from "./world";

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
  /** Follow, Eyes, Vista, or Overhead. Does not move the body. */
  setView: (next: WalkCamera) => void;
  readonly view: WalkCamera;
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
  head.name = "mister-why-head";
  head.position.y = EYE_HEIGHT;
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
  let view: WalkCamera = "follow";
  let eyePitch = 0;
  let overYaw = 0;
  let overH = 26;
  let overTilt = 1.15;
  let vistaYaw = 0;
  let vistaBack = VISTA_BACK;
  let vistaBackT = VISTA_BACK;
  let vistaLift = VISTA_LIFT;
  let vistaLiftT = VISTA_LIFT;
  let vistaState: FollowState = { yaw: 0, grace: 0, sustained: 0 };
  const look = new THREE.Vector3();
  const lookT = new THREE.Vector3();
  const desired = new THREE.Vector3();

  function placeBody() {
    group.position.set(x, sampleGround(x, z), z);
    group.rotation.y = heading;
  }

  function showBody() {
    group.visible = active && view !== "eyes";
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
      const mouth = inStairMouth(focus.x, focus.z);
      if (r < 70 && !mouth) {
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
      // Walk is starting from a new stance. Keep the chosen mode, but aim it
      // with this entry instead of a yaw left over from the last visit.
      if (view === "eyes") {
        eyePitch = 0;
      } else if (view === "overhead") {
        overYaw = camYaw;
      } else if (view === "vista") {
        vistaYaw = camYaw;
        vistaState = { yaw: camYaw, grace: 0, sustained: 0 };
      }
      showBody();
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
      group.visible = true;
    },
    update(dt, _time, input, reduced) {
      if (!active) return;
      const step = Math.min(0.05, Math.max(0, dt));
      const commanded = Math.hypot(input.x, input.y) > MOVE_DEADZONE;
      const stick = Math.atan2(input.x, input.y);
      // Eyes looks along the body. Forward is that facing, every frame,
      // so a sidestep cannot leave the view pointing somewhere else.
      // Follow, Vista, and Overhead latch a basis so the boom cannot steer the walk.
      const basisYaw = view === "overhead" ? overYaw : view === "vista" ? vistaYaw : camYaw;
      if (view === "eyes") {
        moveBasis = heading + Math.PI;
        basisHeld = false;
      } else if (!commanded) {
        basisHeld = false;
      } else if (!basisHeld) {
        moveBasis = basisYaw;
        basisHeld = true;
        heldStick = stick;
      } else if (!input.orbiting && Math.abs(angDelta(heldStick, stick)) > STICK_RELATCH) {
        moveBasis = basisYaw;
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
      // In Eyes the body does not chase a strafe. Heading is the look,
      // and only a turn changes it. Follow, Vista, and Overhead still face travel.
      if (view !== "eyes" && sp > 0.35) {
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
      if (view === "follow" || view === "vista") {
        const state = view === "vista" ? vistaState : followState;
        const stepped = stepHeadingFollow(state, step, {
          reduced,
          orbiting: input.orbiting,
          moving: sp > FOLLOW_SPEED,
          heading,
        });
        if (view === "vista") {
          vistaState = stepped;
          vistaYaw = stepped.yaw;
        } else {
          followState = stepped;
          camYaw = stepped.yaw;
        }
      }
    },
    applyCamera(camera, dt, reduced) {
      if (!active) return;
      showBody();
      const step = Math.min(0.08, Math.max(0, dt));
      const damp = reduced ? 1 : 1 - Math.exp(-step * 1.8);
      const feet = sampleGround(x, z);
      if (view === "eyes") {
        const fx = Math.sin(heading);
        const fz = Math.cos(heading);
        const eyeY = feet + EYE_HEIGHT;
        const reach = 8;
        const cp = Math.cos(eyePitch);
        const sp = Math.sin(eyePitch);
        lookT.set(x + fx * cp * reach, eyeY + sp * reach, z + fz * cp * reach);
        look.lerp(lookT, damp);
        let boom = placeCenotaphCamera(x, z, { x, y: eyeY, z });
        boom = clearBoom(x, z, boom, 0.2);
        if (boom.y > eyeY) boom.y = eyeY;
        desired.set(boom.x, boom.y, boom.z);
      } else if (view === "overhead") {
        const back = overH * Math.cos(overTilt);
        const lift = overH * Math.sin(overTilt);
        const ox = Math.sin(overYaw);
        const oz = Math.cos(overYaw);
        lookT.set(x, feet + 0.35, z);
        look.lerp(lookT, damp);
        desired.set(x + ox * back, feet + lift, z + oz * back);
        let boom = clearBoom(x, z, { x: desired.x, y: desired.y, z: desired.z });
        boom = placeCenotaphCamera(x, z, boom);
        boom = clearBoom(x, z, boom);
        desired.set(boom.x, boom.y, boom.z);
      } else if (view === "vista") {
        const ox = Math.sin(vistaYaw);
        const oz = Math.cos(vistaYaw);
        vistaBack += (vistaBackT - vistaBack) * damp;
        vistaLift += (vistaLiftT - vistaLift) * damp;
        const ahead = Math.min(12, vistaBack * 0.42);
        lookT.set(x - ox * ahead, feet + 2.05, z - oz * ahead);
        look.lerp(lookT, damp);
        desired.set(x + ox * vistaBack, feet + vistaLift, z + oz * vistaBack);
        let boom = clearBoom(x, z, { x: desired.x, y: desired.y, z: desired.z });
        boom = fitBoom(x, z, boom);
        boom = clearBoom(x, z, boom);
        desired.set(boom.x, boom.y, boom.z);
      } else {
        const ox = Math.sin(camYaw);
        const oz = Math.cos(camYaw);
        back += (backT - back) * damp;
        lookLift += (lookLiftT - lookLift) * damp;
        const ahead = aheadForLook(lookLift);
        lookT.set(x - ox * ahead, feet + lookLift, z - oz * ahead);
        look.lerp(lookT, damp);
        const eye = feet + eyeForLook(lookLift);
        desired.set(x + ox * back, eye, z + oz * back);
        let boom = clearBoom(x, z, { x: desired.x, y: desired.y, z: desired.z });
        boom = placeCenotaphCamera(x, z, boom);
        boom = clearBoom(x, z, boom);
        desired.set(boom.x, boom.y, boom.z);
      }
      if (reduced || (view !== "follow" && view !== "vista")) camera.position.copy(desired);
      else camera.position.lerp(desired, damp);
      camera.lookAt(look);
      camera.updateMatrixWorld();
    },
    orbit(dx, dy) {
      if (view === "eyes") {
        heading = Math.atan2(Math.sin(heading - dx * ORBIT_YAW), Math.cos(heading - dx * ORBIT_YAW));
        const gain = dy > 0 ? 0.0045 : 0.008;
        eyePitch = clamp(eyePitch - dy * gain, -1.15, 1.3);
        return;
      }
      if (view === "overhead") {
        overYaw -= dx * ORBIT_YAW;
        overTilt = clamp(overTilt - dy * 0.0025, 0.55, 1.35);
        return;
      }
      if (view === "vista") {
        vistaYaw -= dx * ORBIT_YAW;
        const gain = dy > 0 ? ORBIT_PITCH_DOWN : ORBIT_PITCH_UP;
        vistaLiftT = clamp(vistaLiftT - dy * gain, VISTA_LIFT_MIN, VISTA_LIFT_MAX);
        vistaState = { yaw: vistaYaw, grace: FOLLOW_GRACE, sustained: 0 };
        return;
      }
      camYaw -= dx * ORBIT_YAW;
      const gain = dy > 0 ? ORBIT_PITCH_DOWN : ORBIT_PITCH_UP;
      lookLiftT = clamp(lookLiftT - dy * gain, WALK_LOOK_MIN, WALK_LOOK_MAX);
      followState = { yaw: camYaw, grace: FOLLOW_GRACE, sustained: 0 };
    },
    zoom(factor) {
      if (view === "overhead") {
        overH = clamp(overH * factor, 9, 48);
        return;
      }
      if (view === "vista") {
        vistaBackT = clamp(vistaBackT * factor, VISTA_BACK_MIN, VISTA_BACK_MAX);
        return;
      }
      if (view === "eyes") return;
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
    setView(next) {
      if (next !== "follow" && next !== "eyes" && next !== "overhead" && next !== "vista") return;
      if (next !== view) {
        const behind = Math.atan2(Math.sin(heading + Math.PI), Math.cos(heading + Math.PI));
        const seedVista = (yaw: number) => {
          vistaYaw = yaw;
          vistaState = { yaw, grace: 0, sustained: 0 };
        };
        if (view === "eyes") {
          if (next === "follow") {
            camYaw = behind;
            moveBasis = behind;
            basisHeld = false;
            followState = { yaw: behind, grace: 0, sustained: 0 };
          } else if (next === "overhead") {
            overYaw = behind;
          } else {
            seedVista(behind);
          }
        } else if (view === "vista") {
          if (next === "follow") {
            camYaw = vistaYaw;
            moveBasis = vistaYaw;
            basisHeld = false;
            followState = { yaw: vistaYaw, grace: 0, sustained: 0 };
          } else if (next === "overhead") {
            overYaw = vistaYaw;
          }
        } else if (view === "overhead") {
          if (next === "vista") seedVista(overYaw);
        } else if (next === "overhead") {
          overYaw = camYaw;
        } else if (next === "vista") {
          seedVista(camYaw);
        }
        if (next === "eyes") eyePitch = 0;
        view = next;
      }
      showBody();
    },
    get view() {
      return view;
    },
  };

  return walker;
}
