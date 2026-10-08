import type * as THREE_NS from "three";

export type RefMode = "ours" | "ref" | "overlay";

const MEASURED_R = 2325.2;
const CENTER_IN = { x: 4805.044, y: -4793.168, z: 2185.6 };

export async function attachReference(
  parent: THREE_NS.Object3D,
  ours: THREE_NS.Object3D,
  cenR: number,
  cenY: number,
): Promise<(mode: RefMode) => void> {
  const THREE = await import("three");
  const { ColladaLoader } = await import("three/addons/loaders/ColladaLoader.js");
  const url = new URL("../../dev-ref/model.dae", import.meta.url).href;
  const loader = new ColladaLoader();
  const collada = await loader.loadAsync(url);
  const ref = collada.scene;
  const extra = cenR / (MEASURED_R * 0.0254);
  ref.scale.multiplyScalar(extra);
  const s = 0.0254 * extra;
  // Loader rotates Z-up by -90° X: (x, y, z) -> (x, z, -y)
  ref.position.set(-CENTER_IN.x * s, cenY - CENTER_IN.z * s, CENTER_IN.y * s);
  ref.visible = false;
  ref.traverse((obj) => {
    const mesh = obj as THREE_NS.Mesh;
    if (!mesh.isMesh) return;
    mesh.material = new THREE.MeshBasicMaterial({
      color: 0x6e8eae,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    mesh.frustumCulled = false;
  });
  parent.add(ref);

  return (mode) => {
    ours.visible = mode !== "ref";
    ref.visible = mode !== "ours";
    ref.traverse((obj) => {
      const mesh = obj as THREE_NS.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE_NS.MeshBasicMaterial;
      mat.opacity = mode === "overlay" ? 0.2 : 0.95;
      mat.wireframe = mode === "overlay";
      mat.depthWrite = mode === "ref";
      mat.needsUpdate = true;
    });
  };
}
