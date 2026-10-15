export const WORM_TUBE_WARNING =
  "Artistic deformation. This tube is not a 4D projection, not a cube-net fold, and not a topological eversion.";

export type WormQuad = {
  pts: [number, number, number][];
  depth: number;
};

/** Hand-authored tube. Radius and centerline are not taken from the 4D projection. */
export function wormTubeQuads(time: number, tubular = 28, radial = 10): WormQuad[] {
  const quads: WormQuad[] = [];
  const rings: [number, number, number][][] = [];
  for (let i = 0; i <= tubular; i++) {
    const u = (i / tubular) * Math.PI * 2;
    const bend = 0.55 + 0.45 * Math.sin(time * 0.35);
    const R = 0.92;
    const cx = Math.cos(u) * R;
    const cy = Math.sin(u) * R * bend;
    const cz = Math.sin(u * 2 + time * 0.8) * 0.28;
    const rad = 0.16 + 0.09 * Math.sin(u * 3 + time);
    const tx = -Math.sin(u);
    const ty = Math.cos(u) * bend;
    const tz = Math.cos(u * 2 + time * 0.8) * 0.28 * 2 / R;
    const tangent = normalize([tx, ty, tz]);
    const upGuess: [number, number, number] = Math.abs(tangent[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const side = normalize(cross(tangent, upGuess));
    const up = normalize(cross(side, tangent));
    const ring: [number, number, number][] = [];
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      ring.push([
        cx + (Math.cos(a) * side[0] + Math.sin(a) * up[0]) * rad,
        cy + (Math.cos(a) * side[1] + Math.sin(a) * up[1]) * rad,
        cz + (Math.cos(a) * side[2] + Math.sin(a) * up[2]) * rad,
      ]);
    }
    rings.push(ring);
  }
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const j2 = (j + 1) % radial;
      const pts: [number, number, number][] = [
        rings[i][j], rings[i][j2], rings[i + 1][j2], rings[i + 1][j],
      ];
      const depth = (pts[0][2] + pts[1][2] + pts[2][2] + pts[3][2]) / 4;
      quads.push({ pts, depth });
    }
  }
  quads.sort((a, b) => a.depth - b.depth);
  return quads;
}

export function wormRadius(time: number, u: number): number {
  return 0.16 + 0.09 * Math.sin(u * 3 + time);
}

function cross(a: number[], b: number[]): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function normalize(v: number[]): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
