import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { EYE_HEIGHT, VISTA_BACK, VISTA_LIFT, WALK_BACK, WALK_LOOK } from "./framing";
import { createWalker } from "./mister-why";
import { sampleGround } from "./terrain";

function stood(z = 0) {
  const walker = createWalker(new THREE.Scene());
  walker.restore({ x: 0, z, heading: Math.PI, camYaw: 0, back: WALK_BACK, lookLift: WALK_LOOK });
  return walker;
}

describe("walk cameras", () => {
  it("starts on Follow and does not move the body when the view changes", () => {
    const walker = stood(0);
    const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.25, 400);
    walker.applyCamera(camera, 1, true);
    const pose = walker.pose();
    const feet = walker.group.position.y;
    expect(walker.view).toBe("follow");
    expect(feet).toBeCloseTo(sampleGround(0, 0), 5);

    walker.setView("eyes");
    walker.applyCamera(camera, 1, true);
    expect(walker.pose()).toEqual(pose);
    expect(walker.group.position.y).toBeCloseTo(feet, 5);
    expect(walker.group.visible).toBe(false);
    expect(camera.position.y).toBeCloseTo(feet + EYE_HEIGHT, 2);
    expect(Math.hypot(camera.position.x - pose.x, camera.position.z - pose.z)).toBeLessThan(0.05);

    const head = walker.group.getObjectByName("mister-why-head");
    expect(head?.position.y).toBe(EYE_HEIGHT);

    walker.setView("overhead");
    walker.applyCamera(camera, 1, true);
    expect(walker.pose()).toEqual(pose);
    expect(walker.group.position.y).toBeCloseTo(feet, 5);
    expect(walker.group.visible).toBe(true);
    expect(camera.position.y).toBeGreaterThan(feet + 14);
    const down = walker.aim().clone().sub(camera.position).normalize();
    expect(down.y).toBeLessThan(-0.7);

    walker.setView("follow");
    walker.applyCamera(camera, 1, true);
    expect(walker.group.visible).toBe(true);
    expect(walker.snapshot().back).toBe(WALK_BACK);
    expect(walker.snapshot().lookLift).toBe(WALK_LOOK);
    expect(Math.hypot(camera.position.x, camera.position.z - pose.z)).toBeGreaterThan(4);
  });

  it("lets Eyes look up without leaving the body, and keeps Overhead under the hall soffit", () => {
    const walker = stood(0);
    const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.25, 400);
    walker.setView("eyes");
    walker.applyCamera(camera, 1, true);
    walker.orbit(0, -160);
    walker.applyCamera(camera, 1, true);
    expect(walker.aim().y).toBeGreaterThan(walker.group.position.y + EYE_HEIGHT + 4);
    expect(Math.hypot(camera.position.x, camera.position.z)).toBeLessThan(0.05);

    const hall = stood(60);
    const hallCam = new THREE.PerspectiveCamera(46, 16 / 9, 0.25, 400);
    hall.setView("overhead");
    hall.applyCamera(hallCam, 1, true);
    expect(hall.pose().z).toBe(60);
    expect(hallCam.position.y).toBeLessThan(13.08 - 0.3);
    expect(hallCam.position.y).toBeGreaterThan(hall.group.position.y + 0.4);
  });

  it("does not let an Overhead zoom change the Follow boom", () => {
    const walker = stood(0);
    const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.25, 400);
    walker.setView("overhead");
    walker.zoom(0.5);
    walker.orbit(40, 0);
    walker.setView("follow");
    walker.applyCamera(camera, 1, true);
    expect(walker.snapshot().back).toBe(WALK_BACK);
    expect(walker.snapshot().camYaw).toBeCloseTo(0, 5);
    expect(Math.hypot(camera.position.x, camera.position.z)).toBeCloseTo(WALK_BACK, 1);
  });

  it("aims Eyes along the new stance when walk begins again", () => {
    const walker = stood(0);
    const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.25, 400);
    walker.setView("eyes");
    walker.orbit(200, 0);
    const fly = new THREE.PerspectiveCamera();
    fly.position.set(0, 20, 50);
    walker.enter(new THREE.Vector3(0, 10, 36), fly);
    const pose = walker.pose();
    const feet = walker.group.position.y;
    walker.applyCamera(camera, 1, true);
    expect(walker.pose()).toEqual(pose);
    expect(walker.group.position.y).toBeCloseTo(feet, 5);
    expect(pose.z).toBeCloseTo(36, 1);
    expect(Math.hypot(camera.position.x - pose.x, camera.position.z - pose.z)).toBeLessThan(0.05);
    expect(camera.position.y).toBeCloseTo(feet + EYE_HEIGHT, 2);
    const aim = walker.aim();
    expect(aim.z).toBeLessThan(pose.z - 1);
    expect(Math.abs(aim.x - pose.x)).toBeLessThan(1);
  });

  it("keeps Eyes locked to Mister Why's heading", () => {
    const walker = stood(16);
    const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.25, 400);
    walker.restore({ x: 0, z: 16, heading: Math.PI, camYaw: 1.2, back: WALK_BACK, lookLift: WALK_LOOK });
    const before = walker.pose();
    walker.setView("eyes");
    walker.applyCamera(camera, 1, true);
    expect(walker.pose().heading).toBeCloseTo(before.heading, 5);
    expect(walker.pose().x).toBeCloseTo(before.x, 5);
    expect(walker.pose().z).toBeCloseTo(before.z, 5);
    const aim = walker.aim();
    expect(aim.z).toBeLessThan(before.z - 1);
    expect(Math.abs(aim.x - before.x)).toBeLessThan(0.4);
    expect(camera.position.y).toBeCloseTo(walker.group.position.y + EYE_HEIGHT, 2);

    const still = walker.aim().clone();
    walker.applyCamera(camera, 1, true);
    expect(walker.pose().heading).toBeCloseTo(Math.PI, 5);
    expect(walker.aim().distanceTo(still)).toBeLessThan(1e-4);

    walker.orbit(0, -120);
    walker.applyCamera(camera, 1, true);
    expect(walker.pose().heading).toBeCloseTo(Math.PI, 5);
    expect(walker.aim().y).toBeGreaterThan(walker.group.position.y + EYE_HEIGHT + 3);

    const faced = walker.pose().heading;
    walker.orbit(90, 0);
    walker.applyCamera(camera, 1, true);
    expect(Math.abs(walker.pose().heading - faced)).toBeGreaterThan(0.2);
    expect(Math.abs(walker.aim().x - before.x)).toBeGreaterThan(1);

    const turned = walker.pose().heading;
    walker.setView("follow");
    walker.applyCamera(camera, 1, true);
    expect(walker.pose().heading).toBeCloseTo(turned, 5);
    expect(walker.pose().camYaw).toBeCloseTo(Math.atan2(Math.sin(turned + Math.PI), Math.cos(turned + Math.PI)), 5);
    expect(walker.group.visible).toBe(true);
  });

  it("keeps Vista higher and farther than Follow, and off Follow's boom", () => {
    const walker = stood(0);
    const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.25, 400);
    walker.applyCamera(camera, 1, true);
    const pose = walker.pose();
    const followY = camera.position.y;
    const followBack = Math.hypot(camera.position.x, camera.position.z);
    walker.setView("vista");
    walker.applyCamera(camera, 1, true);
    expect(walker.group.visible).toBe(true);
    expect(walker.pose()).toEqual(pose);
    expect(camera.position.y).toBeGreaterThan(followY + 4);
    expect(Math.hypot(camera.position.x, camera.position.z)).toBeGreaterThan(followBack + 4);
    expect(camera.position.y - walker.group.position.y).toBeCloseTo(VISTA_LIFT, 1);
    expect(Math.hypot(camera.position.x, camera.position.z)).toBeCloseTo(VISTA_BACK, 1);
    const down = walker.aim().clone().sub(camera.position).normalize();
    expect(down.y).toBeGreaterThan(-0.65);
    expect(down.y).toBeLessThan(-0.15);

    const before = walker.snapshot();
    walker.zoom(0.7);
    walker.orbit(80, 40);
    walker.setView("follow");
    walker.applyCamera(camera, 1, true);
    expect(walker.snapshot().back).toBe(WALK_BACK);
    expect(walker.snapshot().lookLift).toBe(WALK_LOOK);
    expect(walker.snapshot().back).toBe(before.back);
    expect(Math.abs(walker.snapshot().camYaw)).toBeGreaterThan(0.2);

    walker.setView("vista");
    walker.applyCamera(camera, 1, true);
    expect(Math.hypot(camera.position.x - walker.pose().x, camera.position.z - walker.pose().z)).toBeLessThan(VISTA_BACK);
    expect(walker.snapshot().back).toBe(WALK_BACK);
  });

  it("ducks Vista under the hall and lets it recover in the dome", () => {
    const hall = stood(60);
    const hallCam = new THREE.PerspectiveCamera(46, 16 / 9, 0.25, 400);
    hall.setView("vista");
    hall.applyCamera(hallCam, 1, true);
    expect(hallCam.position.y).toBeLessThan(13.08 - 0.2);
    expect(hallCam.position.y).toBeGreaterThan(hall.group.position.y + 0.4);
    expect(Math.hypot(hallCam.position.x, hallCam.position.z - 60)).toBeGreaterThan(8);

    const dome = stood(0);
    const domeCam = new THREE.PerspectiveCamera(46, 16 / 9, 0.25, 400);
    dome.setView("vista");
    dome.applyCamera(domeCam, 1, true);
    expect(domeCam.position.y).toBeGreaterThan(dome.group.position.y + 6);
  });
});
