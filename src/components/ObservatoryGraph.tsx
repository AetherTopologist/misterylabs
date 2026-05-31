import React, { useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { getAtlasGraphData, type AtlasGraphNode, ATLAS_GRAPH_TIERS } from '@/lib/atlasGraph';

interface ObservatoryGraphProps {
  onNodeClick?: (node: AtlasGraphNode | null) => void;
  className?: string;
}

export function ObservatoryGraph({ onNodeClick, className = '' }: ObservatoryGraphProps) {
  const { nodes, links } = getAtlasGraphData();

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

  // Proper 3D emissive glowing orbs — designed for deep cosmic feel matching the reference screenshot
  const nodeThreeObject = useCallback((node: any) => {
    const tier = node.tier as AtlasGraphNode['tier'];
    const style = ATLAS_GRAPH_TIERS[tier] || ATLAS_GRAPH_TIERS['technical-lineage'];
    const size = Math.sqrt(node.val || 2.8) * 3.2;

    const group = new THREE.Group();

    // === Core emissive sphere (the bright heart of the orb) ===
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

    // === Inner bright highlight (white hot core) ===
    const highlightGeom = new THREE.SphereGeometry(size * 0.55, 32, 32);
    const highlightMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: tier === 'core' ? 0.4 : 0.3,
    });
    group.add(new THREE.Mesh(highlightGeom, highlightMat));

    // === Large soft outer glow shell (the signature cosmic orb look) ===
    const glowGeom = new THREE.SphereGeometry(size * 2.25, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: style.color,
      transparent: true,
      opacity: tier === 'core' ? 0.16 : tier === 'personal-resonance' ? 0.12 : 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    group.add(glow);

    // === Extra prominent outer halo for the central xPRIMEray node ===
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

    // === Special warm cathedral glow treatment for Bell Labs ===
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

    // Add a subtle point light inside important nodes for extra volumetric feel (Three.js lighting)
    if (tier === 'core' || tier === 'personal-resonance') {
      const light = new THREE.PointLight(style.color, 0.8, size * 8);
      light.position.set(0, 0, 0);
      group.add(light);
    }

    return group;
  }, []);

  const handleNodeClick = (node: any) => {
    const fullNode = nodes.find(n => n.id === node.id) || null;
    onNodeClick?.(fullNode);
  };

  return (
    <div className={`relative w-full h-full bg-[#05060c] ${className}`}>
      <ForceGraph3D
        graphData={graphData}
        nodeThreeObject={nodeThreeObject}
        nodeLabel={(node: any) => `${node.name} — ${ATLAS_GRAPH_TIERS[node.tier as any]?.label || ''}`}
        linkColor={() => 'rgba(103, 232, 249, 0.25)'}
        linkWidth={1.0}
        linkOpacity={0.5}
        onNodeClick={handleNodeClick}
        backgroundColor="#05060c"
        showNavInfo={false}
        enableNodeDrag={true}
        enableNavigationControls={true}
        cooldownTicks={80}
        // Initial camera position for a nice overview of the cosmic structure
        cameraPosition={{ x: 80, y: -120, z: 420 }}
      />

      {/* Cosmic grid + vignette overlay to match the reference aesthetic */}
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,6,12,0.65)_80%)]" />
    </div>
  );
}
