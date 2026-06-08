import { useRef, useEffect, useState, useCallback } from "react";

// ── Face palette ───────────────────────────────────────────

const FACE_COLORS = [
  { fill: "rgba(34,211,238,0.82)",  stroke: "rgba(34,211,238,1)",   name: "Front",  tailwind: "bg-cyan-400",   text: "text-cyan-400"   },
  { fill: "rgba(167,139,250,0.82)", stroke: "rgba(167,139,250,1)",  name: "Back",   tailwind: "bg-violet-400", text: "text-violet-400" },
  { fill: "rgba(251,191,36,0.82)",  stroke: "rgba(251,191,36,1)",   name: "Top",    tailwind: "bg-amber-400",  text: "text-amber-400"  },
  { fill: "rgba(99,102,241,0.82)",  stroke: "rgba(99,102,241,1)",   name: "Bottom", tailwind: "bg-indigo-500", text: "text-indigo-400" },
  { fill: "rgba(74,222,128,0.82)",  stroke: "rgba(74,222,128,1)",   name: "Right",  tailwind: "bg-green-400",  text: "text-green-400"  },
  { fill: "rgba(251,113,133,0.82)", stroke: "rgba(251,113,133,1)",  name: "Left",   tailwind: "bg-rose-400",   text: "text-rose-400"   },
];

// ── Cube geometry ──────────────────────────────────────────

// 8 vertices: (±1, ±1, ±1)
const VERTS: [number,number,number][] = [
  [-1,-1, 1], [ 1,-1, 1], [ 1, 1, 1], [-1, 1, 1],
  [-1,-1,-1], [ 1,-1,-1], [ 1, 1,-1], [-1, 1,-1],
];

// 6 faces: [v0,v1,v2,v3, faceId]
const FACES: [number,number,number,number,number][] = [
  [0,1,2,3, 0], // Front  (z=+1)
  [5,4,7,6, 1], // Back   (z=-1)
  [3,2,6,7, 2], // Top    (y=+1)
  [4,5,1,0, 3], // Bottom (y=-1)
  [1,5,6,2, 4], // Right  (x=+1)
  [4,0,3,7, 5], // Left   (x=-1)
];

// Outward unit normals per face (same order as FACES)
const FACE_NORMALS: [number,number,number][] = [
  [ 0, 0, 1], [ 0, 0,-1], [ 0, 1, 0],
  [ 0,-1, 0], [ 1, 0, 0], [-1, 0, 0],
];

// ── All 11 cube nets ───────────────────────────────────────
// Each net: 6 cells as [col, row], in face-order 0-5

type NetCell = [number, number];

const NETS: NetCell[][] = [
  [[1,0],[1,3],[1,1],[1,2],[0,1],[2,1]],  //  1 — Classic cross
  [[1,0],[0,3],[1,1],[0,2],[0,1],[2,1]],  //  2 — L-Cross
  [[1,0],[2,3],[1,1],[2,2],[0,1],[2,1]],  //  3 — J-Cross
  [[1,0],[3,0],[0,0],[2,0],[1,1],[1,2]],  //  4 — Row + Tail A
  [[1,0],[3,0],[0,0],[2,0],[2,1],[2,2]],  //  5 — Row + Tail B
  [[1,0],[3,0],[0,0],[2,0],[1,1],[3,1]],  //  6 — Row Skip 1-3
  [[1,0],[3,0],[0,0],[2,0],[0,1],[2,1]],  //  7 — Row Skip 0-2
  [[1,0],[3,0],[0,0],[2,0],[1,1],[2,1]],  //  8 — Row Adjacent 1-2
  [[1,0],[3,0],[0,0],[2,0],[0,1],[1,1]],  //  9 — Row Adjacent 0-1
  [[0,0],[3,2],[1,0],[2,2],[1,1],[2,1]],  // 10 — S-Staircase
  [[2,0],[0,2],[3,0],[1,2],[2,1],[1,1]],  // 11 — Z-Staircase
];

const NET_LABELS = [
  "Classic Cross","L-Cross","J-Cross","Row + Tail A","Row + Tail B",
  "Row Skip 1-3","Row Skip 0-2","Row Adjacent 1-2","Row Adjacent 0-1",
  "S-Staircase","Z-Staircase",
];

const CELL = 40; // px per grid cell

// ── Quaternion helpers ─────────────────────────────────────

type Quat = [number,number,number,number];

function qMul(a: Quat, b: Quat): Quat {
  const [ax,ay,az,aw] = a, [bx,by,bz,bw] = b;
  return [
    aw*bx+ax*bw+ay*bz-az*by, aw*by-ax*bz+ay*bw+az*bx,
    aw*bz+ax*by-ay*bx+az*bw, aw*bw-ax*bx-ay*by-az*bz,
  ];
}

function qRot(v: [number,number,number], q: Quat): [number,number,number] {
  const [qx,qy,qz,qw] = q, [vx,vy,vz] = v;
  const tx=2*(qy*vz-qz*vy), ty=2*(qz*vx-qx*vz), tz=2*(qx*vy-qy*vx);
  return [vx+qw*tx+qy*tz-qz*ty, vy+qw*ty+qz*tx-qx*tz, vz+qw*tz+qx*ty-qy*tx];
}

// ── Chirality-dependent Hamiltonian unfolding path ─────────
//
// A cube net IS a spanning tree of the face adjacency graph (exactly
// 5 edges, 6 nodes, no cycles). We root the tree at the highest-degree
// face and do a DFS, sorting children by their angular position around
// the parent. CW/CCW flips the sort direction, producing mirror-image
// traversal sequences — the two chiral unfolding orders.

export type Chirality = "cw" | "ccw";

// Build the adjacency list for the grid cells of a net.
// Two cells are adjacent iff they share a grid edge.
function buildNetAdj(netIdx: number): number[][] {
  const net = NETS[netIdx];
  const adj: number[][] = Array.from({ length: 6 }, () => []);
  for (let i = 0; i < 6; i++) {
    for (let j = i + 1; j < 6; j++) {
      const [ci, ri] = net[i], [cj, rj] = net[j];
      if ((ci === cj && Math.abs(ri - rj) === 1) || (ri === rj && Math.abs(ci - cj) === 1)) {
        adj[i].push(j); adj[j].push(i);
      }
    }
  }
  return adj;
}

// Compute the DFS-ordered unfolding path for the given chirality.
// Returns:
//   edges  — 5 directed [from, to] pairs in DFS visit order
//   order  — 6 face indices in DFS pre-order (visit sequence)
//
// Chirality controls the sort direction of children at each branch:
//   CW  → ascending angular offset from the "incoming" direction
//   CCW → descending angular offset (mirror image)
//
// This means: for a cross net, CW visits arms clockwise (top→right→…→left),
// CCW visits them counterclockwise (top→left→…→right). The step labels
// (1-6) differ, demonstrating that different intrinsic traversal orders
// exist for the same geometric surface.
export function computeUnfoldPath(
  netIdx: number,
  chirality: Chirality,
): { edges: [number, number][]; order: number[] } {
  const net = NETS[netIdx];
  const adj = buildNetAdj(netIdx);

  // Root at the highest-degree node (most central face)
  let root = 0;
  for (let i = 1; i < 6; i++) if (adj[i].length > adj[root].length) root = i;

  const visited = new Array(6).fill(false);
  const edges: [number, number][] = [];
  const order: number[] = [];

  function dfs(node: number, parent: number) {
    visited[node] = true;
    order.push(node);

    const [nc, nr] = net[node];
    const children = adj[node].filter(n => !visited[n]);
    if (children.length === 0) return;

    // "Incoming direction" = direction from node toward parent
    // For the root (no parent) we use a virtual parent directly above,
    // so 12 o'clock = 0 relative angle, giving a consistent starting point.
    const [pc, pr] = parent >= 0 ? net[parent] : [nc, nr - 1];
    const baseAngle = Math.atan2(pr - nr, pc - nc); // angle pointing TOWARD parent

    // Sort children by their angular offset from the incoming direction.
    // CW  = ascending offset (going clockwise in screen coords)
    // CCW = descending offset (going counterclockwise)
    children.sort((a, b) => {
      const [ac, ar] = net[a], [bc, br] = net[b];
      let da = Math.atan2(ar - nr, ac - nc) - baseAngle;
      let db = Math.atan2(br - nr, bc - nc) - baseAngle;
      // Normalize to [0, 2π) so sort direction is unambiguous
      da = ((da % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      db = ((db % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      return chirality === "cw" ? da - db : db - da;
    });

    for (const child of children) {
      edges.push([node, child]);
      dfs(child, node);
    }
  }

  dfs(root, -1);
  return { edges, order };
}

// ── Path color helper ──────────────────────────────────────
// Gradient from cyan (edge 0) through to amber (last edge)

function pathRgb(i: number, total: number): [number, number, number] {
  const t = total > 1 ? i / (total - 1) : 0;
  return [
    Math.round(22  + (251 -  22) * t),
    Math.round(211 + (191 - 211) * t),
    Math.round(238 + ( 36 - 238) * t),
  ];
}

// ── Net path overlay (canvas on top of SVG) ────────────────
//
// Draws animated dashed arrows between adjacent face centers in the
// unfolding sequence.  A separate transparent canvas is overlaid on
// the SVG so hover interaction still works on the SVG elements.

function drawNetPath(
  canvas: HTMLCanvasElement,
  netIdx: number,
  edges: [number, number][],
  order: number[],
  animPhase: number,   // 0..7, cycles, drives the cascade reveal
  dashPhase: number,   // monotonically increasing, drives moving dashes
  hovered: number | null,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const net = NETS[netIdx];
  const minCol = Math.min(...net.map(c => c[0]));
  const minRow = Math.min(...net.map(c => c[1]));
  const maxCol = Math.max(...net.map(c => c[0])) - minCol;
  const maxRow = Math.max(...net.map(c => c[1])) - minRow;
  const gW = (maxCol + 1) * CELL;
  const gH = (maxRow + 1) * CELL;

  // Resize buffer if the net changed
  if (canvas.width !== gW || canvas.height !== gH) {
    canvas.width  = gW;
    canvas.height = gH;
    canvas.style.width  = gW + "px";
    canvas.style.height = gH + "px";
  }
  ctx.clearRect(0, 0, gW, gH);

  // Face center positions in canvas pixels
  const centers = net.map(([c, r]): [number, number] => [
    (c - minCol + 0.5) * CELL,
    (r - minRow + 0.5) * CELL,
  ]);

  const REVEAL_SPEED = 0.75; // units of animPhase to fully draw one edge

  for (let i = 0; i < edges.length; i++) {
    const [from, to] = edges[i];
    // Reveal progress for this edge: 0 = not started, 1 = fully drawn
    const progress = Math.min(1, Math.max(0, (animPhase - i) / REVEAL_SPEED));
    if (progress <= 0) continue;

    const [x1, y1] = centers[from];
    const [x2, y2] = centers[to];
    const ex = x1 + (x2 - x1) * progress; // current tip of drawing line
    const ey = y1 + (y2 - y1) * progress;

    const [rr, gg, bb] = pathRgb(i, edges.length);
    const isHovEdge = hovered === from || hovered === to;
    const baseAlpha = isHovEdge ? 0.95 : 0.72;

    // Outer glow halo
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = 10;
    ctx.strokeStyle = `rgba(${rr},${gg},${bb},${0.14 * progress})`;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.lineWidth = 5;
    ctx.strokeStyle = `rgba(${rr},${gg},${bb},${0.22 * progress})`;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.restore();

    // Animated dashed core line
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `rgba(${rr},${gg},${bb},${baseAlpha * progress})`;
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -(dashPhase * 10);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Arrowhead — fades in once the line tip is past 65% travel
    if (progress > 0.65) {
      const headAlpha = Math.min(1, (progress - 0.65) / 0.35) * baseAlpha;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const sz = 7;
      ctx.save();
      ctx.fillStyle = `rgba(${rr},${gg},${bb},${headAlpha})`;
      ctx.shadowColor = `rgba(${rr},${gg},${bb},0.7)`;
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - sz * Math.cos(angle - Math.PI / 6), ey - sz * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(ex - sz * 0.35 * Math.cos(angle),       ey - sz * 0.35 * Math.sin(angle));
      ctx.lineTo(ex - sz * Math.cos(angle + Math.PI / 6), ey - sz * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Particle dot at current line tip while drawing
    if (progress < 0.99) {
      const [rr2, gg2, bb2] = pathRgb(i, edges.length);
      ctx.save();
      ctx.fillStyle = `rgba(${rr2},${gg2},${bb2},0.9)`;
      ctx.shadowColor = `rgba(${rr2},${gg2},${bb2},0.8)`;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Step-number origin dot on the root face
  const rootFace = order[0];
  const [rcx, rcy] = centers[rootFace];
  const rootReveal = Math.min(1, animPhase * 3);
  if (rootReveal > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(255,255,255,${0.5 * rootReveal})`;
    ctx.shadowColor = "rgba(255,255,255,0.6)";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(rcx, rcy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── 3D cube + path overlay ─────────────────────────────────

function drawCube(
  canvas: HTMLCanvasElement,
  q: Quat,
  hovered: number | null,
  pathEdges: [number, number][],
  pathOrder: number[],
  animPhase: number,
  dashPhase: number,
  showPath: boolean,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const dpr = window.devicePixelRatio || 1;
  const fov = H * 0.76, dist = 4.8;
  const sc = Math.min(W, H) * 0.24;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#05060c";
  ctx.fillRect(0, 0, W, H);

  // Background grid
  ctx.strokeStyle = "rgba(255,255,255,0.016)";
  ctx.lineWidth = 0.5 * dpr;
  const gs = 40 * dpr;
  for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Project a model-space vertex → screen [x, y, rz]
  function proj(v: [number,number,number]): [number,number,number] {
    const [rx,ry,rz] = qRot([v[0]*sc/dpr, v[1]*sc/dpr, v[2]*sc/dpr], q);
    const z = rz * dpr + dist * sc;
    const s = z > 0.01 ? fov / z : fov;
    return [cx + rx*dpr*s, cy - ry*dpr*s, rz];
  }
  const pv = VERTS.map(v => proj(v));

  // Sort faces back-to-front
  const sorted = FACES.map(([a,b,c,d,fi]) => ({
    a, b, c, d, fi, z: (pv[a][2]+pv[b][2]+pv[c][2]+pv[d][2]) / 4,
  })).sort((x, y) => x.z - y.z);

  // Draw faces
  for (const { a,b,c,d,fi } of sorted) {
    const fc = FACE_COLORS[fi];
    const isHov = hovered === fi;
    ctx.beginPath();
    ctx.moveTo(pv[a][0], pv[a][1]); ctx.lineTo(pv[b][0], pv[b][1]);
    ctx.lineTo(pv[c][0], pv[c][1]); ctx.lineTo(pv[d][0], pv[d][1]);
    ctx.closePath();
    ctx.fillStyle = fc.fill.replace("0.82", isHov ? "0.92" : "0.52");
    ctx.fill();
    ctx.strokeStyle = isHov ? fc.stroke : fc.stroke.replace("1)", "0.75)");
    ctx.lineWidth = isHov ? 2 * dpr : 0.9 * dpr;
    ctx.stroke();
    if (isHov) {
      ctx.shadowColor = fc.stroke;
      ctx.shadowBlur = 18 * dpr;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  // ── Hamiltonian path overlay on the 3D cube ───────────────
  // Face centers are the average of their four projected vertices.
  // We draw dashed arrows between centers in the chirality-ordered
  // DFS sequence, mirroring the animation in the 2D net canvas.
  if (showPath && pathEdges.length > 0) {
    const faceCenters = FACES.map(([a, b, c, d]) => [
      (pv[a][0]+pv[b][0]+pv[c][0]+pv[d][0]) / 4,
      (pv[a][1]+pv[b][1]+pv[c][1]+pv[d][1]) / 4,
    ] as [number, number]);

    // Check which faces point toward the camera (positive rotated z-normal)
    const faceFwd = FACE_NORMALS.map(n => qRot(n, q)[2] > 0);

    const REVEAL_SPEED = 0.75;

    for (let i = 0; i < pathEdges.length; i++) {
      const [from, to] = pathEdges[i];
      const progress = Math.min(1, Math.max(0, (animPhase - i) / REVEAL_SPEED));
      if (progress <= 0) continue;

      const [x1, y1] = faceCenters[from];
      const [x2, y2] = faceCenters[to];
      const ex = x1 + (x2 - x1) * progress;
      const ey = y1 + (y2 - y1) * progress;

      const [rr, gg, bb] = pathRgb(i, pathEdges.length);
      const bothFwd = faceFwd[from] && faceFwd[to];
      const isHovEdge = hovered === from || hovered === to;
      // Fade path when crossing "through" the cube (hidden faces)
      const baseAlpha = (isHovEdge ? 0.9 : bothFwd ? 0.70 : 0.28) * progress;

      // Wide glow halo
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineWidth = 14 * dpr;
      ctx.strokeStyle = `rgba(${rr},${gg},${bb},${0.12 * progress})`;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.lineWidth = 7 * dpr;
      ctx.strokeStyle = `rgba(${rr},${gg},${bb},${0.22 * progress})`;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.restore();

      // Dashed core
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineWidth = 1.6 * dpr;
      ctx.strokeStyle = `rgba(${rr},${gg},${bb},${baseAlpha})`;
      ctx.setLineDash([5 * dpr, 5 * dpr]);
      ctx.lineDashOffset = -(dashPhase * 10 * dpr);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Arrowhead
      if (progress > 0.65) {
        const headAlpha = Math.min(1, (progress - 0.65) / 0.35) * baseAlpha;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const sz = 10 * dpr;
        ctx.save();
        ctx.fillStyle = `rgba(${rr},${gg},${bb},${headAlpha})`;
        ctx.shadowColor = `rgba(${rr},${gg},${bb},0.7)`;
        ctx.shadowBlur = 12 * dpr;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - sz * Math.cos(angle - Math.PI/6), ey - sz * Math.sin(angle - Math.PI/6));
        ctx.lineTo(ex - sz * 0.32 * Math.cos(angle),     ey - sz * 0.32 * Math.sin(angle));
        ctx.lineTo(ex - sz * Math.cos(angle + Math.PI/6), ey - sz * Math.sin(angle + Math.PI/6));
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Travelling particle dot at the drawing tip
      if (progress < 0.99 && baseAlpha > 0.1) {
        ctx.save();
        ctx.fillStyle = `rgba(${rr},${gg},${bb},0.9)`;
        ctx.shadowColor = `rgba(${rr},${gg},${bb},0.9)`;
        ctx.shadowBlur = 12 * dpr;
        ctx.beginPath();
        ctx.arc(ex, ey, 3 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Origin dot on root face center
    const rootCenter = faceCenters[pathOrder[0]];
    const rootReveal = Math.min(1, animPhase * 3);
    if (rootReveal > 0 && rootCenter) {
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${0.6 * rootReveal})`;
      ctx.shadowColor = "rgba(255,255,255,0.7)";
      ctx.shadowBlur = 14 * dpr;
      ctx.beginPath();
      ctx.arc(rootCenter[0], rootCenter[1], 4 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Diagnostic corner brackets
  const m = 14*dpr, ml = 10*dpr;
  ctx.strokeStyle = "rgba(34,211,238,0.32)"; ctx.lineWidth = 0.8*dpr;
  ctx.beginPath(); ctx.moveTo(m,m+ml); ctx.lineTo(m,m); ctx.lineTo(m+ml,m); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W-m,H-m-ml); ctx.lineTo(W-m,H-m); ctx.lineTo(W-m-ml,H-m); ctx.stroke();
  ctx.strokeStyle = "rgba(251,191,36,0.22)";
  ctx.beginPath(); ctx.moveTo(m,H-m-ml); ctx.lineTo(m,H-m); ctx.lineTo(m+ml,H-m); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W-m,m+ml); ctx.lineTo(W-m,m); ctx.lineTo(W-m-ml,m); ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.font = `${8*dpr}px "JetBrains Mono",ui-monospace,monospace`;
  ctx.textAlign = "center"; ctx.letterSpacing = `${2*dpr}px`;
  ctx.fillText("CUBE · 6 FACES · 3D VIEW", cx, m + 10*dpr);
  ctx.textAlign = "left"; ctx.letterSpacing = "0px";
}

// ── Component ──────────────────────────────────────────────

export function CubeNetExplorer() {
  // ── Canvas refs ────────────────────────────────────────
  const canvasRef    = useRef<HTMLCanvasElement>(null);  // 3D cube
  const netCanvasRef = useRef<HTMLCanvasElement>(null);  // 2D path overlay

  // ── Spin / orientation ─────────────────────────────────
  const rafRef  = useRef<number>(0);
  const spinRef = useRef(0);
  const qRef    = useRef<Quat>([0,0,0,1]);

  // ── Animation phase refs (read by RAF, avoids stale closures) ──
  const animPhaseRef = useRef(0);
  const dashPhaseRef = useRef(0);

  // ── Path data refs ─────────────────────────────────────
  const pathEdgesRef = useRef<[number, number][]>([]);
  const pathOrderRef = useRef<number[]>([]);

  // ── Toggleable behaviour refs ──────────────────────────
  const autoRef      = useRef(true);
  const hoveredRef   = useRef<number | null>(null);
  const showPathRef  = useRef(true);
  const chiralityRef = useRef<Chirality>("cw");
  const netIdxRef    = useRef(0);

  // ── React state (controls UI re-renders) ───────────────
  const [netIdx,    setNetIdx]    = useState(0);
  const [hovered,   setHovered]   = useState<number | null>(null);
  const [autoSpin,  setAutoSpin]  = useState(true);
  const [chirality, setChirality] = useState<Chirality>("cw");
  const [showPath,  setShowPath]  = useState(true);

  // Sync state → refs
  useEffect(() => { autoRef.current     = autoSpin;  }, [autoSpin]);
  useEffect(() => { hoveredRef.current  = hovered;   }, [hovered]);
  useEffect(() => { showPathRef.current = showPath;  }, [showPath]);
  useEffect(() => { chiralityRef.current = chirality; }, [chirality]);
  useEffect(() => { netIdxRef.current   = netIdx;    }, [netIdx]);

  // Recompute path whenever netIdx or chirality changes
  useEffect(() => {
    const { edges, order } = computeUnfoldPath(netIdx, chirality);
    pathEdgesRef.current = edges;
    pathOrderRef.current = order;
    animPhaseRef.current = 0; // restart cascade animation
  }, [netIdx, chirality]);

  const handleCellHover = useCallback((fi: number | null) => setHovered(fi), []);

  // ── RAF loop (mount-only) ──────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const r = canvas!.getBoundingClientRect();
      canvas!.width  = r.width  * dpr;
      canvas!.height = r.height * dpr;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let last = performance.now();

    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05); // cap at 50ms
      last = now;

      // Advance path animation phases
      // animPhase cycles 0→7: edges 0-4 cascade in, rest 5-7 stays fully visible
      animPhaseRef.current = (animPhaseRef.current + dt * 0.50) % 7;
      dashPhaseRef.current += dt * 1.4;

      // Cube auto-spin
      if (autoRef.current) {
        spinRef.current += 0.007;
        const a = spinRef.current;
        const yh = a / 2;
        const qY: Quat = [0, Math.sin(yh), 0, Math.cos(yh)];
        const ph = Math.sin(a * 0.31) * 0.4 / 2;
        const qX: Quat = [Math.sin(ph), 0, 0, Math.cos(ph)];
        qRef.current = qMul(qX, qY);
      }

      // Draw 3D cube (+ path overlay on cube)
      drawCube(
        canvas!,
        qRef.current,
        hoveredRef.current,
        pathEdgesRef.current,
        pathOrderRef.current,
        animPhaseRef.current,
        dashPhaseRef.current,
        showPathRef.current,
      );

      // Draw 2D net path overlay
      const netCanvas = netCanvasRef.current;
      if (netCanvas && showPathRef.current) {
        drawNetPath(
          netCanvas,
          netIdxRef.current,
          pathEdgesRef.current,
          pathOrderRef.current,
          animPhaseRef.current,
          dashPhaseRef.current,
          hoveredRef.current,
        );
      } else if (netCanvas) {
        // Clear when hidden
        const ctx = netCanvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, netCanvas.width, netCanvas.height);
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  // ── Derived display data (React render) ───────────────
  // Compute current step labels for SVG faces
  const { order: unfoldOrder } = computeUnfoldPath(netIdx, chirality);
  const stepByFace = new Array(6).fill(0);
  unfoldOrder.forEach((fi, step) => { stepByFace[fi] = step + 1; });

  const net = NETS[netIdx];
  const minCol = Math.min(...net.map(c => c[0]));
  const minRow = Math.min(...net.map(c => c[1]));
  const maxCol = Math.max(...net.map(c => c[0])) - minCol;
  const maxRow = Math.max(...net.map(c => c[1])) - minRow;
  const gridW  = (maxCol + 1) * CELL;
  const gridH  = (maxRow + 1) * CELL;

  return (
    <div className="flex flex-col overflow-hidden border border-border/35 bg-card/20 lg:flex-row">

      {/* ── Left panel: 2D net + controls ─────────────────── */}
      <div className="flex flex-col gap-4 border-b border-border/30 bg-secondary/30 p-5 lg:w-72 lg:border-b-0 lg:border-r">
        <div>
          <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/45">
            SYS // OBS-CN · Cube Nets
          </div>
          <h3 className="text-base font-semibold tracking-tight">2D Net Explorer</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/55">
            All 11 distinct nets that fold into a cube. Hover a face to
            highlight it in both views. Numbers show the unfolding sequence order.
          </p>
        </div>

        {/* Net display — SVG + canvas overlay */}
        <div
          className="flex items-center justify-center rounded-sm border border-border/25 bg-secondary/10 p-4"
          aria-label={`Cube net ${netIdx + 1}: ${NET_LABELS[netIdx]}`}
        >
          {/* Wrapper gives relative context for the overlay canvas */}
          <div className="relative">
            <svg
              width={gridW}
              height={gridH}
              viewBox={`0 0 ${gridW} ${gridH}`}
              role="img"
              aria-label="Cube net grid"
            >
              {net.map(([col, row], fi) => {
                const nc  = FACE_COLORS[fi];
                const x   = (col - minCol) * CELL;
                const y   = (row - minRow) * CELL;
                const isActive = hovered === fi;
                return (
                  <g
                    key={fi}
                    onMouseEnter={() => handleCellHover(fi)}
                    onMouseLeave={() => handleCellHover(null)}
                    onClick={() => setAutoSpin(false)}
                    className="cursor-pointer"
                    aria-label={nc.name}
                  >
                    <rect
                      x={x + 1} y={y + 1}
                      width={CELL - 3} height={CELL - 3}
                      rx={4}
                      fill={nc.fill}
                      stroke={nc.stroke}
                      strokeWidth={isActive ? 2 : 0.9}
                      opacity={isActive ? 1 : 0.72}
                    />
                    {isActive && (
                      <rect
                        x={x + 1} y={y + 1}
                        width={CELL - 3} height={CELL - 3}
                        rx={4}
                        fill="none"
                        stroke={nc.stroke}
                        strokeWidth={6}
                        opacity={0.25}
                      />
                    )}
                    {/* Face abbreviation */}
                    <text
                      x={x + CELL / 2} y={y + CELL / 2 + 2}
                      textAnchor="middle"
                      fontSize={9}
                      fontFamily="JetBrains Mono, ui-monospace, monospace"
                      fontWeight={700}
                      fill="rgba(0,0,0,0.72)"
                      pointerEvents="none"
                    >
                      {nc.name.slice(0, 2).toUpperCase()}
                    </text>
                    {/* Unfolding step label — updates with chirality */}
                    <text
                      x={x + CELL - 5} y={y + CELL - 5}
                      textAnchor="end"
                      fontSize={8}
                      fontFamily="JetBrains Mono, ui-monospace, monospace"
                      fontWeight={600}
                      fill="rgba(0,0,0,0.60)"
                      pointerEvents="none"
                    >
                      {stepByFace[fi]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Transparent canvas overlay for animated path arrows */}
            <canvas
              ref={el => {
                netCanvasRef.current = el;
              }}
              className="pointer-events-none absolute inset-0"
              aria-hidden
            />
          </div>
        </div>

        {/* Net label */}
        <div className="text-center">
          <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/35">
            Net {netIdx + 1} of 11
          </div>
          <div className="mt-0.5 text-xs font-medium text-foreground/70">{NET_LABELS[netIdx]}</div>
        </div>

        {/* ── Chirality toggle ──────────────────────────── */}
        <div className="panel">
          <div className="panel-header">
            <span>Unfolding Chirality</span>
            <span className={chirality === "cw" ? "text-cyan-400/70" : "text-amber-400/65"}>
              {chirality === "cw" ? "⟳ CW" : "⟲ CCW"}
            </span>
          </div>
          <div className="flex gap-2 p-2">
            <button
              type="button"
              onClick={() => setChirality("cw")}
              className={`flex-1 rounded-sm border px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] transition-colors ${
                chirality === "cw"
                  ? "border-cyan-500/50 bg-cyan-950/30 text-cyan-300"
                  : "border-border/30 text-muted-foreground/45 hover:border-border/55 hover:text-foreground/60"
              }`}
            >
              ⟳ Clockwise
            </button>
            <button
              type="button"
              onClick={() => setChirality("ccw")}
              className={`flex-1 rounded-sm border px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] transition-colors ${
                chirality === "ccw"
                  ? "border-amber-500/50 bg-amber-950/25 text-amber-300"
                  : "border-border/30 text-muted-foreground/45 hover:border-border/55 hover:text-foreground/60"
              }`}
            >
              ⟲ Counter-CW
            </button>
          </div>
        </div>

        {/* ── Path toggle ───────────────────────────────── */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPath(p => !p)}
            className={`flex-1 rounded-sm border px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] transition-colors ${
              showPath
                ? "border-violet-500/40 bg-violet-950/20 text-violet-300"
                : "border-border/30 text-muted-foreground/40 hover:border-border/55"
            }`}
          >
            {showPath ? "Hide Path" : "Show Path"}
          </button>
          <button
            type="button"
            onClick={() => { animPhaseRef.current = 0; }}
            className="rounded-sm border border-border/28 px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 transition-colors hover:border-border/55 hover:text-muted-foreground"
          >
            Replay
          </button>
        </div>

        {/* Net selector */}
        <div className="grid grid-cols-6 gap-1">
          {NETS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setNetIdx(i)}
              className={`rounded-sm border py-1.5 font-mono text-[9px] font-semibold transition-colors ${
                i === netIdx
                  ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-300"
                  : "border-border/25 bg-secondary/15 text-muted-foreground/50 hover:border-border/45 hover:text-foreground/60"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Face legend */}
        <div className="rounded-sm border border-border/25 bg-secondary/15 p-3">
          <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/35">
            Face key
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {FACE_COLORS.map((fc, i) => (
              <div
                key={i}
                className={`flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 transition-colors ${hovered === i ? "bg-secondary/50" : ""}`}
                onMouseEnter={() => handleCellHover(i)}
                onMouseLeave={() => handleCellHover(null)}
              >
                <span className={`cn-face-${i} h-2.5 w-2.5 shrink-0 rounded-sm`} />
                <span className="font-mono text-[9px] text-muted-foreground/60">{fc.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Educational note */}
        <div className="rounded-sm border border-violet-500/14 bg-violet-950/10 p-3">
          <div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.3em] text-violet-400/50">
            Observer Note · Chirality
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground/52">
            The same cube net can be traversed CW or CCW — producing mirror-image
            unfolding sequences. In xPRIMEray's transport model, a boundary's
            intrinsic curvature determines which chiral path is "natural," just as
            a helix prefers one handedness depending on the field geometry it
            propagates through.
          </p>
        </div>
      </div>

      {/* ── Right panel: 3D cube canvas ───────────────────── */}
      <div className="relative min-h-[280px] flex-1 sm:min-h-[360px] lg:min-h-0">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          aria-label="Rotating 3D cube with six colored faces and Hamiltonian unfolding path overlay"
        />
        {/* Bottom-right controls */}
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          <button
            type="button"
            onClick={() => setAutoSpin(a => !a)}
            className="flex items-center gap-1.5 rounded-sm border border-white/10 bg-black/50 px-2 py-1 backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${autoSpin ? "animate-pulse bg-cyan-400/80" : "bg-muted-foreground/40"}`} />
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-foreground/50">
              {autoSpin ? "Spinning" : "Paused"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
