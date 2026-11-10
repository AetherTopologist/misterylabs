import * as THREE from "three";

/**
 * Monument flame for the Cenotaph front court.
 * A translucent shell and a dark core. No extra real light: the atlas
 * light budget stays with the Cenotaph.
 */
export function buildPrometheusFlame() {
  const group = new THREE.Group();
  group.name = "prometheus-flame";

  const stone = new THREE.Mesh(
    new THREE.CylinderGeometry(2.15, 2.35, 0.28, 6),
    new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.92, metalness: 0.05 }),
  );
  stone.position.y = 0.14;

  const bronze = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 1.55, 0.46, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a3424, roughness: 0.42, metalness: 0.78 }),
  );
  bronze.position.y = 0.46;

  const profile: THREE.Vector2[] = [];
  const inner: THREE.Vector2[] = [];
  for (let i = 0; i <= 22; i++) {
    const t = i / 22;
    const y = 0.12 + t * 3.25;
    const radius = Math.sin(Math.PI * Math.pow(t, 0.7)) * (0.64 - t * 0.3);
    profile.push(new THREE.Vector2(Math.max(0.02, radius), y));
    inner.push(new THREE.Vector2(Math.max(0.012, radius * 0.4), y * 0.9 + 0.08));
  }

  const shellMat = new THREE.MeshStandardMaterial({
    color: 0xffc27a,
    emissive: 0xe8893a,
    emissiveIntensity: 1.1,
    transparent: true,
    opacity: 0.8,
    roughness: 0.32,
    metalness: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const shell = new THREE.Mesh(new THREE.LatheGeometry(profile, 32), shellMat);
  const core = new THREE.Mesh(
    new THREE.LatheGeometry(inner, 24),
    new THREE.MeshBasicMaterial({ color: 0x140c08 }),
  );

  const flame = new THREE.Group();
  flame.add(shell, core);

  const count = 16;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const ring = 0.16 + (i % 4) * 0.1;
    positions[i * 3] = Math.cos(angle) * ring;
    positions[i * 3 + 1] = 0.45 + (i % 8) * 0.26;
    positions[i * 3 + 2] = Math.sin(angle) * ring;
  }
  const emberGeo = new THREE.BufferGeometry();
  emberGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const embers = new THREE.Points(
    emberGeo,
    new THREE.PointsMaterial({
      color: 0xffb15a,
      size: 0.055,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );

  group.add(stone, bronze, flame, embers);

  return {
    group,
    tick(time: number, reduced: boolean) {
      const lean = reduced ? 0 : Math.sin(time * 1.25) * 0.04;
      const breath = reduced ? 1 : 1 + Math.sin(time * 2.8) * 0.028;
      flame.rotation.z = lean;
      flame.scale.set(1, breath, 1);
      shellMat.emissiveIntensity = reduced ? 1.05 : 1.02 + Math.sin(time * 5.2) * 0.16;
      embers.position.y = reduced ? 0 : Math.sin(time * 1.6) * 0.035;
    },
  };
}
