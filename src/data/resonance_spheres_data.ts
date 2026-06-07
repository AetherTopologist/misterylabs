// Resonance Spheres + Inspiration Cards data model (adapted from xprimeray artifacts in /assets/misterylabs_artifacts and observatory_atlas)
// Coherence-maxxed: strong, specific alignment to xPRIMEray (portals as wormhole analogs,
// curved spacetime viz, rendering pipelines that deliver "real" depth, observer immersion,
// spatial storytelling, traversal mechanics).
// Nobel / Glitch first, then others pulled from existing atlas (Quake, Interstellar, Bell Labs, etc.).
// 
// This file ALSO serves as the STATIC MOCK FALLBACK when Supabase is not configured
// (i.e. missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY).
// ResonanceSpheresAtlas will use this data (with Digital Circus Trophy Room + Nobel nodes)
// and log a warning instead of crashing with "supabaseUrl is required".
//
// Textures: Use high-quality visuals from assets/misterylabs_artifacts/visuals/ (copy key ones like 
// wormhole-structure-observatory.png, observer-disagreement-hero.png, hermetic-closure-hero.png to 
// public/assets/observatory/ for serving). For the "Trophy Room with xPRIMEray GRIN distortion", 
// use a wormhole/portal image as proxy until the overspace_trophy_room_demo render + post-process is generated.

import type { ResonanceSpheresData } from '@/types/inspiration'; // or inline if no shared yet

export const resonanceSpheresData: ResonanceSpheresData = {
  spheres: [
    {
      id: "central-transport-sphere",
      centerNodeId: "glitch-digital-circus-trophy-room",
      // Proxy texture: a strong portal/wormhole image standing in for the Digital Circus Trophy Room 
      // rendered with xPRIMEray-style curved-ray / GRIN refraction + wormhole-edge distortion.
      // In prod: replace with the actual generated equirectangular from xprimeray overspace_trophy_room_demo + shader.
      textureUrl: "/assets/overview/wormhole_structure_contact_sheet.png", // proxy for Trophy Room + xPRIMEray distortion (copy real from assets/misterylabs_artifacts/visuals/ to public/assets/observatory/ for prod)
      radius: 1.0,
      orbitingNodeIds: [
        "glitch-digital-circus-trophy-room",
        "nobel-kip-thorne",
        "nobel-roger-penrose",
        "interstellar-gargantua",
        "quake-portal-tech"
      ],
      description: "Central dynamic canvas. Trophy Room portal screenshot (from The Amazing Digital Circus) mapped onto the sphere with xPRIMEray curved-ray / GRIN refraction and wormhole boundary distortion. Nodes orbit and connect via geodesic springs. Hover/click pulses the sphere to the linked portal region."
    }
  ],
  nodes: [
    {
      id: "glitch-digital-circus-trophy-room",
      title: "The Amazing Digital Circus — Trophy Room Portal",
      category: "pop-culture",
      tier: 1,
      position: { x: 0, y: 0, z: 0 },
      tags: ["portal", "ringmaster", "spatial-storytelling", "rendering-pipeline", "observer-immersion"],
      summary: "The Trophy Room as a liminal nexus of portals, games, and trapped observers. The ringmaster's domain is a perfect pop-culture analog for a wormhole mouth + recursive transport space.",
      xprimeRayAlignment: "Strong resonance: The Trophy Room functions as a 'wormhole mouth' where characters are pulled into recursive, rule-bending spaces. xPRIMEray's recursive mirror ghost portal and overspace fixtures are direct technical cousins — both require stable high-bounce reflection + curved transport without banding or energy loss. The rendering pipeline in the show delivers 'real' depth and parallax that straight-ray approximations would break. Perfect backdrop sphere texture candidate (use overspace_trophy_room_demo.tscn renders with added GRIN refraction on the rings and wormhole-edge distortion on the architecture).",
      media: [
        {
          type: "image",
          url: "/assets/overview/wormhole_structure_contact_sheet.png", // proxy for Trophy Room hero; replace with actual distorted render from xprimeray + artifacts/visuals/
          caption: "Trophy Room hero — mapped as central sphere texture with xPRIMEray-style GRIN refraction on portals and wormhole boundary distortion.",
          alt: "The Amazing Digital Circus Trophy Room interior with ringmaster portals, rendered with curved transport distortion (proxy using strong xPRIMEray wormhole observatory render)",
          standardSize: "hero",
          resonanceNote: "Ringmaster portals = wormhole mouths; recursive rooms = infinite mirror recursion; the 'game' rules = hermetic fixture contracts."
        },
        {
          type: "image",
          url: "/assets/observatory_atlas/observer-disagreement-hero.png", // good grid-style proxy from artifacts (copy visuals to public if needed)
          caption: "Thumbnail grid variant — observer disagreement in the nexus",
          standardSize: "grid"
        },
        {
          type: "youtube",
          url: "https://www.youtube.com/embed/PLACEHOLDER_DIGITAL_CIRCUS_TROPHY", // replace with real episode/trailer clip
          caption: "Trophy Room sequence — observe the portal transitions and spatial recursion",
          thumbnail: "/assets/observatory_atlas/hermetic-closure-hero.png"
        }
      ],
      externalLinks: [
        { label: "Glitch Productions — The Amazing Digital Circus", url: "https://www.youtube.com/@GLITCH", credit: "Glitch Productions" },
        { label: "Overspace Trophy Room Demo (xPRIMEray scene)", url: "https://github.com/AetherTopologist/xPRIMEray" }
      ],
      resonanceSphereTexture: "central-transport-sphere",
      zenoXeno: "xeno"
    },
    {
      id: "nobel-kip-thorne",
      title: "Kip Thorne — Black Hole Visualization & Gravitational Lensing",
      category: "physics",
      tier: 1,
      position: { x: 120, y: -80 },
      parentIds: ["glitch-digital-circus-trophy-room"],
      tags: ["curved-spacetime", "gravitational-lensing", "black-hole", "visualization", "nobel"],
      summary: "Nobel laureate physicist whose work on wormholes (Morris–Thorne metric) and black hole lensing (Interstellar) directly parallels xPRIMEray's Gordon effective metric and GRIN null-geodesic integration.",
      xprimeRayAlignment: "Core technical kinship: Thorne's Morris-Thorne traversable wormhole requires exotic matter to keep the throat open — xPRIMEray's wormhole fixtures and overspace topology explicitly test throat stability under curved transport. His gravitational lensing work for Interstellar (Gargantua) is the gold-standard cinematic curved-ray benchmark. xPRIMEray's 'Dual Reality' and 'Observer Disagreement' chapters are the scientific instrument version of what Thorne did for film: show the difference between naive straight transport and real geodesic curvature, with measurable, falsifiable outputs.",
      media: [
        {
          type: "image",
          url: "/assets/observatory_atlas/wormhole-dual-reality-curvature-map.png", // strong curved lensing proxy from artifacts
          caption: "Gravitational lensing around a spinning black hole — the visual that made curved null geodesics mainstream",
          standardSize: "hero",
          resonanceNote: "Direct ancestor of xPRIMEray's curved_view.gdshader and the dual-reality comparison pipeline."
        },
        {
          type: "youtube",
          url: "https://www.youtube.com/embed/PLACEHOLDER_KIP_THORNE",
          caption: "Thorne on the science of Interstellar lensing and wormholes"
        }
      ],
      externalLinks: [
        { label: "Kip Thorne Nobel Prize", url: "https://www.nobelprize.org/prizes/physics/2017/thorne/facts/" },
        { label: "The Science of Interstellar (book)", url: "https://en.wikipedia.org/wiki/The_Science_of_Interstellar" }
      ],
      zenoXeno: "zeno"
    },
    {
      id: "nobel-roger-penrose",
      title: "Roger Penrose — Trapped Surfaces, Conformal Diagrams & Singularities",
      category: "physics",
      tier: 1,
      position: { x: -140, y: 60 },
      parentIds: ["nobel-kip-thorne"],
      tags: ["trapped-surfaces", "penrose-diagram", "causal-structure", "singularity", "nobel"],
      summary: "Penrose diagrams and trapped surface theorems are the mathematical language for the causal structure that xPRIMEray's hermetic closure and boundary event ledger make observable in rendered pixels.",
      xprimeRayAlignment: "The 'hermetic fixture contract' (100% pixel classification, zero unresolved exits) is a computational embodiment of Penrose's trapped surface and causal boundary ideas. When rays in xPRIMEray hit a 'trapped' region (high-curvature GRIN shell or wormhole throat), the closure diagnostics and ownership graphs reveal the same topological features Penrose diagrams abstract. The 'unresolved island' in the transport oracle is a pixel-level Penrose singularity made visible.",
      media: [
        {
          type: "image",
          url: "/assets/observatory_atlas/hermetic-closure-hero.png",
          caption: "Trapped surfaces and causal boundaries made visible in hermetic pixel classification",
          standardSize: "hero",
          resonanceNote: "Pixel-perfect realization of Penrose causal structure in transport diagnostics."
        }
      ],
      externalLinks: [
        { label: "Roger Penrose Nobel Prize", url: "https://www.nobelprize.org/prizes/physics/2020/penrose/facts/" }
      ],
      zenoXeno: "zeno"
    },
    {
      id: "interstellar-gargantua",
      title: "Interstellar Gargantua — Cinematic Curved Null Geodesics",
      category: "pop-culture",
      tier: 2,
      position: { x: 80, y: 110 },
      parentIds: ["nobel-kip-thorne"],
      tags: ["curved-spacetime", "null-geodesics", "cinematic-rendering", "observer-perspective"],
      summary: "The gold-standard cinematic visualization of a spinning black hole and its accretion disk, achieved through real general-relativistic ray tracing.",
      xprimeRayAlignment: "The exact question xPRIMEray answers with instruments instead of film VFX: what does curved null geodesic transport actually look like to an observer on either side of the boundary? xPRIMEray's off-axis observe delta and dual-reality pipelines are the scientific, measurable version of the Gargantua render pipeline.",
      media: [
        {
          type: "image",
          url: "/assets/observatory_atlas/wormhole-dual-reality-full-stack.png",
          caption: "Gargantua-style curved transport — straight vs. real geodesic comparison (xPRIMEray dual-reality style)",
          standardSize: "hero"
        }
      ],
      externalLinks: [
        { label: "The Science of Interstellar", url: "https://www.interstellarmovie.net/" }
      ],
      zenoXeno: "both"
    },
    {
      id: "quake-portal-tech",
      title: "Quake III / Classic FPS Portal & BSP Tech",
      category: "tech-history",
      tier: 2,
      position: { x: -90, y: -100 },
      parentIds: ["glitch-digital-circus-trophy-room"],
      tags: ["bsp", "portals", "real-time-rendering", "spatial-cognition", "prediction"],
      summary: "The original real-time social engine of speed. BSP traversal, portal culling, and client-side prediction taught spatial intuition at inhuman velocity.",
      xprimeRayAlignment: "Direct ancestor of transport island detection, observer-relative coordinate framing, and the need for hermetic closure under curved fields. The same problems (visibility, prediction, low-latency spatial coherence) that xPRIMEray solves at the diagnostic layer.",
      media: [
        {
          type: "image",
          url: "/assets/observatory_atlas/hermetic-hit-closure-storyboard.png",
          caption: "Classic engine portal culling meets modern curved transport closure",
          standardSize: "grid"
        }
      ],
      externalLinks: [
        { label: "Quake III Arena", url: "https://en.wikipedia.org/wiki/Quake_III_Arena" }
      ],
      zenoXeno: "zeno"
    }
  ],
  edges: [
    { source: "glitch-digital-circus-trophy-room", target: "nobel-kip-thorne", type: "resonance" },
    { source: "nobel-kip-thorne", target: "nobel-roger-penrose", type: "parent" },
    { source: "glitch-digital-circus-trophy-room", target: "interstellar-gargantua", type: "portal-echo" },
    { source: "glitch-digital-circus-trophy-room", target: "quake-portal-tech", type: "observer-kinship" },
    { source: "nobel-kip-thorne", target: "interstellar-gargantua", type: "resonance" }
  ]
};
