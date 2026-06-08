import React, { useCallback, useEffect, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { getAtlasGraphData, type AtlasGraphNode, ATLAS_GRAPH_TIERS } from '@/lib/atlasGraph';
import { useTheme } from '@/hooks/useTheme';

interface ObservatoryGraphProps {
  onNodeClick?: (node: AtlasGraphNode | null) => void;
  className?: string;
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

export function ObservatoryGraph({ onNodeClick, className = '' }: ObservatoryGraphProps) {
  const { theme } = useTheme();
  const [webGLAvailable] = React.useState(() => detectWebGL());
  const fgRef = useRef<any>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Defensive data load — log and expose empty graph rather than crashing
  const { nodes, links } = React.useMemo(() => {
    try {
      return getAtlasGraphData();
    } catch (err) {
      console.error('[ObservatoryGraph] getAtlasGraphData failed:', err);
      return { nodes: [], links: [] };
    }
  }, []);

  const graphData = {
    nodes: nodes.map(node => ({
      ...node,
      color: ATLAS_GRAPH_TIERS[node.tier]?.color || '#67e8f9',
    })),
    links: links.map(link => ({
      ...link,
      source: typeof link.source === 'object' ? (link.source as any).id : link.source,
      target: typeof link.target === 'object' ? (link.target as any).id : link.target,
    })),
  };

  // Helper: Create a 3D text sprite (real 3D label floating above the orb)
  const createTextSprite = (text: string, color: string, size = 18) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      // Return an invisible sprite rather than throwing
      return new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, opacity: 0 }));
    }

    ctx.font = `${size}px 'JetBrains Mono', ui-monospace, monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(80, 20, 1); // scale in world units
    return sprite;
  };

  // Proper 3D emissive glowing orbs with real 3D labels
  const nodeThreeObject = useCallback((node: any) => {
    const tier = node.tier as AtlasGraphNode['tier'];
    const style = ATLAS_GRAPH_TIERS[tier] || ATLAS_GRAPH_TIERS['technical-lineage'];
    const size = Math.sqrt(node.val || 2.8) * 3.2;

    const group = new THREE.Group();

    // === Core emissive sphere ===
    const coreGeom = new THREE.SphereGeometry(size, 32, 32);
    const coreMat = new THREE.MeshPhongMaterial({
      color: style.color,
      emissive: style.color,
      emissiveIntensity: tier === 'core' ? 1.4 : tier === 'personal-resonance' ? 0.85 : 0.6,
      shininess: 10,
      specular: 0x111111,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    group.add(core);

    // Inner bright highlight
    const highlightGeom = new THREE.SphereGeometry(size * 0.55, 32, 32);
    const highlightMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: tier === 'core' ? 0.4 : 0.3,
    });
    group.add(new THREE.Mesh(highlightGeom, highlightMat));

    // Large soft outer glow shell
    const glowGeom = new THREE.SphereGeometry(size * 2.25, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: style.color,
      transparent: true,
      opacity: tier === 'core' ? 0.16 : tier === 'personal-resonance' ? 0.12 : 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    group.add(new THREE.Mesh(glowGeom, glowMat));

    // Extra halo for core
    if (tier === 'core') {
      const haloGeom = new THREE.SphereGeometry(size * 3.8, 32, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.06,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      group.add(new THREE.Mesh(haloGeom, haloMat));
    }

    // Special treatment for Bell Labs
    if (node.id === 'bell-labs') {
      const cathedralGeom = new THREE.SphereGeometry(size * 2.7, 32, 32);
      const cathedralMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.11,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      group.add(new THREE.Mesh(cathedralGeom, cathedralMat));
    }

    // Point light for important nodes
    if (tier === 'core' || tier === 'personal-resonance') {
      const light = new THREE.PointLight(style.color, 0.9, size * 9);
      group.add(light);
    }

    // === Real 3D label (Sprite with canvas texture) ===
    const shortLabel = node.name.length > 20 ? node.name.slice(0, 17) + '…' : node.name;
    const labelSprite = createTextSprite(
      shortLabel,
      tier === 'core' ? '#bae6fd' : '#e0f2fe',
      tier === 'core' ? 22 : 16
    );
    labelSprite.position.set(0, size * 2.8, 0); // float above the orb
    group.add(labelSprite);

    return group;
  }, []);

  const handleNodeClick = (node: any) => {
    const fullNode = nodes.find(n => n.id === node.id) || null;
    setSelectedId(fullNode?.id || null);
    onNodeClick?.(fullNode);

    // Auto camera framing on selection (smooth fly-to)
    if (fullNode && fgRef.current) {
      const { x = 0, y = 0, z = 0 } = fullNode as any;
      const distance = 220;
      const newPos = {
        x: x + distance * 0.6,
        y: y + distance * 0.3,
        z: z + distance,
      };

      // Use the internal camera controls for smooth transition if available
      const controls = fgRef.current.controls?.();
      if (controls) {
        controls.target.set(x, y, z);
        controls.update();
      }

      // Animate camera position
      fgRef.current.cameraPosition(newPos, { x, y, z }, 1200);
    }
  };

  // Optional: reset camera when deselecting
  useEffect(() => {
    if (!selectedId && fgRef.current) {
      fgRef.current.cameraPosition({ x: 80, y: -120, z: 420 }, undefined, 800);
    }
  }, [selectedId]);

  if (!webGLAvailable) {
    return (
      <div className={`flex h-full items-center justify-center text-sm text-muted-foreground ${className}`}>
        3D graph requires WebGL, which is not available in this browser.
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-background ${className}`}>
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeThreeObject={nodeThreeObject}
        nodeLabel={(node: any) => `${node.name} — ${ATLAS_GRAPH_TIERS[node.tier as any]?.label || ''}`}
        linkColor={() => 'rgba(103, 232, 249, 0.22)'}
        linkWidth={0.85}
        linkOpacity={0.45}
        linkDirectionalParticles={3}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleColor={() => 'rgba(103,232,249,0.7)'}
        linkDirectionalParticleWidth={0.8}
        onNodeClick={handleNodeClick}
        backgroundColor={theme === 'light' ? '#fafafa' : '#05060c'}
        showNavInfo={false}
        enableNodeDrag={true}
        enableNavigationControls={true}
        cooldownTicks={70}
        // Nice starting view
        cameraPosition={{ x: 80, y: -120, z: 420 }}
      />

      {/* Cosmic grid + vignette */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(103,232,249,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(103,232,249,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: theme === 'light'
            ? 'radial-gradient(circle at center, transparent 30%, rgba(240,242,248,0.55) 80%)'
            : 'radial-gradient(circle at center, transparent 30%, rgba(5,6,12,0.65) 80%)',
        }}
      />
    </div>
  );
}
