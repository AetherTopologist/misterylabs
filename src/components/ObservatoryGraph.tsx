import React, { useCallback } from 'react';
import { ForceGraph2D } from 'react-force-graph';
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

  // Enhanced 2D glowing orb renderer — strong approximation of the cosmic reference screenshot
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const tier = node.tier as AtlasGraphNode['tier'];
    const style = ATLAS_GRAPH_TIERS[tier] || ATLAS_GRAPH_TIERS['technical-lineage'];
    const size = Math.sqrt(node.val || 2.8) * 5.2;
    const x = node.x;
    const y = node.y;

    // Very soft outer atmospheric glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size * 2.35, 0, Math.PI * 2);
    const glow = ctx.createRadialGradient(x, y, size * 0.6, x, y, size * 2.35);
    glow.addColorStop(0, style.color + (tier === 'core' ? '33' : '1A'));
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fill();

    // Main solid glowing orb
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = style.color;
    ctx.fill();

    // Bright hot core
    ctx.beginPath();
    ctx.arc(x, y, size * 0.48, 0, Math.PI * 2);
    ctx.fillStyle = '#f0f9ff';
    ctx.fill();

    // Subtle ring / energy line for important nodes
    if (tier === 'core' || tier === 'personal-resonance') {
      ctx.beginPath();
      ctx.arc(x, y, size * 1.35, 0, Math.PI * 2);
      ctx.strokeStyle = style.color + '44';
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
    }

    ctx.restore();

    // Clean labels for key nodes
    if (size * globalScale > 18) {
      const label = node.name.length > 22 ? node.name.slice(0, 19) + '…' : node.name;
      ctx.font = `${Math.max(10.5 / globalScale, 8.5)}px JetBrains Mono, ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = tier === 'core' ? '#bae6fd' : '#e0f2fe';
      ctx.fillText(label, x, y + size + 13 / globalScale);
    }
  }, []);

  const handleNodeClick = (node: any) => {
    const fullNode = nodes.find(n => n.id === node.id) || null;
    onNodeClick?.(fullNode);
  };

  return (
    <div className={`relative w-full h-full bg-[#05060c] ${className}`}>
      <ForceGraph2D
        graphData={graphData}
        nodeCanvasObject={nodeCanvasObject}
        nodeLabel={(node: any) => `${node.name} — ${ATLAS_GRAPH_TIERS[node.tier as any]?.label || ''}`}
        linkColor={() => 'rgba(103, 232, 249, 0.32)'}
        linkWidth={1.1}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.004}
        onNodeClick={handleNodeClick}
        backgroundColor="#05060c"
        enableNodeDrag={true}
        enableZoomPanInteraction={true}
        cooldownTicks={55}
      />

      {/* Cosmic grid + vignette to match the reference screenshot */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(103,232,249,0.35) 1px, transparent 1px),
            linear-gradient(90deg, rgba(103,232,249,0.35) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,#05060c_78%)]" />
    </div>
  );
}
