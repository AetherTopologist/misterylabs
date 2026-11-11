import * as THREE from "three";

/**
 * West-court marker for PRIME. A pinch, not a second Cenotaph.
 * No extra real light: the atlas budget stays with the monument.
 */
export function buildPrimeHand() {
  const group = new THREE.Group();
  group.name = "prime-hand";

  const stone = new THREE.MeshStandardMaterial({
    color: 0x1c7c86,
    roughness: 0.42,
    metalness: 0.18,
  });
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x14110e,
    roughness: 0.92,
    metalness: 0.05,
  });
  const gold = new THREE.MeshBasicMaterial({ color: 0xf0d48a });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.75, 0.26, 8), plinthMat);
  plinth.position.y = 0.13;

  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.05, 0.24), stone);
  palm.position.set(0, 1.05, 0);

  const raised = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.62, 2, 5), stone);
    finger.position.set(-0.18 + i * 0.16, 1.9, 0);
    raised.add(finger);
  }

  const index = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.5, 2, 5), stone);
  index.position.set(0.32, 1.72, 0.04);
  index.rotation.z = -0.62;

  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.34, 2, 5), stone);
  thumb.position.set(0.5, 1.28, 0.06);
  thumb.rotation.z = 0.95;

  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), gold);
  spark.position.set(0.46, 1.52, 0.1);

  group.add(plinth, palm, raised, index, thumb, spark);

  return {
    group,
    tick(time: number, reduced: boolean) {
      const scale = reduced ? 1 : 1 + Math.sin(time * 3.1) * 0.12;
      spark.scale.setScalar(scale);
    },
  };
}
