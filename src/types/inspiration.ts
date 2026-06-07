// Resonance Spheres + Inspiration Cards data model
// Extends the existing AtlasNode concept for pop-culture / mythic / tech alignments
// that have strong, specific "signal resonance" with xPRIMEray (portals, curved transport,
// observer immersion, spatial storytelling, rendering pipelines).

export interface InspirationMedia {
  type: 'image' | 'video' | 'youtube';
  url: string;                    // direct or embed URL
  caption?: string;
  alt?: string;
  thumbnail?: string;             // for grid thumbs
  standardSize?: 'hero' | 'grid'; // 1200x675 hero or 400x225 grid
  resonanceNote?: string;         // why this media resonates with xPRIMEray
}

export interface InspirationNode {
  id: string;
  title: string;
  category: 'pop-culture' | 'physics' | 'tech-history' | 'mythic' | 'game';
  tier: 1 | 2 | 3;
  position?: { x: number; y: number; z?: number };
  parentIds?: string[];
  tags: string[];
  summary: string;
  xprimeRayAlignment: string;
  media: InspirationMedia[];
  externalLinks?: Array<{ label: string; url: string; credit?: string }>;
  resonanceSphereTexture?: string;
  zenoXeno?: 'zeno' | 'xeno' | 'both';
}

export interface ResonanceSphere {
  id: string;
  centerNodeId: string;
  textureUrl: string;
  radius: number;
  orbitingNodeIds: string[];
  description: string;
}

export interface ResonanceSpheresData {
  spheres: ResonanceSphere[];
  nodes: InspirationNode[];
  edges: Array<{ source: string; target: string; type: 'resonance' | 'parent' | 'portal-echo' | 'observer-kinship' }>;
}
