export type MaskViewing = "monocular" | "binocular";
export type RenderLoopOwner = "automatic" | "anaglyph";

/**
 * A useFrame priority above 0 makes React Three Fiber skip its own gl.render.
 * Only the binocular appearance pane may take that over, and it has to draw.
 * Ground truth and monocular must stay on the automatic loop.
 */
export function renderLoopOwner(diagnostic: boolean, viewing: MaskViewing): RenderLoopOwner {
  return !diagnostic && viewing === "binocular" ? "anaglyph" : "automatic";
}
