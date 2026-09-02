import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ExternalLink, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ResonanceSphere } from './ResonanceSphere';
import { resonanceSpheresData, type InspirationNode, type InspirationMedia } from '@/data/resonance_spheres_data';
import { useTheme } from '@/hooks/useTheme';

/**
 * ResonanceSpheresAtlas
 * The flagship interactive exhibit for the MisteryLabs Observatory / Atlas.
 * 
 * - Central ResonanceSphere (textured backdrop with GRIN/wormhole distortion)
 * - Orbiting inspiration nodes (force-directed / ring layout with geodesic springs)
 * - Click node → rich modal with:
 *   - Media carousel (hero images at consistent 16:9, grid thumbs, YT embeds)
 *   - "Signal resonance" text (xprimeRayAlignment)
 *   - Tags, summary, tasteful credits with "Resonance Echo"
 * 
 * Builds directly on FractalInspirationAtlas concepts + the xprimeray artifacts
 * copied into /assets/misterylabs_artifacts and observatory_atlas.
 * 
 * Visual style: Dark cinematic observatory (deep blacks, cyan/amber accents,
 * subtle force lines / geodesic springs). Hover/click: nodes pulse, sphere "rotates"
 * toward the linked portal region (via highlight prop).
 * 
 * Mobile: Sphere on top, vertical node list below; modal full-screen friendly.
 * Desktop: Sphere + SVG overlay constellation.
 */

interface ExpandedState {
  node: InspirationNode | null;
  mediaIndex: number;
}

export const ResonanceSpheresAtlas: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({ node: null, mediaIndex: 0 });

  const data = resonanceSpheresData || { spheres: [], nodes: [], edges: [] };
  const { spheres = [], nodes = [], edges = [] } = data;

  if (!spheres.length || !nodes.length) {
    return (
      <div className="p-4 border border-border rounded bg-muted/20 text-sm text-muted-foreground">
        Resonance Spheres data unavailable. Using classic Atlas view.
      </div>
    );
  }

  const centralSphere = spheres[0];

  // Simple ring + jitter positions for "orbiting the sphere" (prototype; real would use d3-force or the Fractal canvas physics)
  const positionedNodes = useMemo(() => {
    return nodes.map((node, i) => {
      const baseAngle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
      const jitter = (node.position?.x || 0) * 0.015;
      const dist = node.id === centralSphere.centerNodeId ? 0.9 : (node.tier === 1 ? 1.65 : 2.1);
      return {
        ...node,
        x: Math.cos(baseAngle + jitter) * dist * 160 + 300,
        y: Math.sin(baseAngle + jitter) * dist * 95 + 295,
      };
    });
  }, [nodes, centralSphere.centerNodeId]);

  const openNode = (node: InspirationNode) => {
    setExpanded({ node, mediaIndex: 0 });
    setHighlightedNodeId(node.id);
    // Future: tell sphere to "face" the UV region of this node's portal on the texture
  };

  const closeModal = () => {
    setExpanded({ node: null, mediaIndex: 0 });
    setHighlightedNodeId(null);
  };

  const currentMedia: InspirationMedia | undefined = expanded.node?.media?.[expanded.mediaIndex];
  const totalMedia = expanded.node?.media?.length || 0;

  const nextMedia = () => {
    if (!expanded.node) return;
    setExpanded(prev => ({
      ...prev,
      mediaIndex: (prev.mediaIndex + 1) % totalMedia
    }));
  };

  const prevMedia = () => {
    if (!expanded.node) return;
    setExpanded(prev => ({
      ...prev,
      mediaIndex: (prev.mediaIndex - 1 + totalMedia) % totalMedia
    }));
  };

  return (
    <div className="resonance-spheres-atlas bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-400/60 mb-1">
              OBSERVATORY • INSPIRATION CONSTELLATION
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
              Resonance Spheres
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground/90">
              A living canvas of portal echoes, curved spacetime kinship, and observer immersion — 
              anchored to the xPRIMEray transport observatory. <span className="text-amber-600 dark:text-amber-400/80">Coherence-maxxed.</span>
            </p>
          </div>
          <div className="text-xs font-mono text-muted-foreground/60">
            {nodes.length} nodes • {edges.length} resonance paths<br />
            Nobel first • Glitch (Trophy Room) as central texture
          </div>
        </div>

        {/* Central Sphere + Constellation */}
        <div className="relative mx-auto mb-10" style={{ maxWidth: 620 }}>
          <ResonanceSphere
            size={580}
            distortion={0.48}
            textureUrl={centralSphere.textureUrl}
            showRays
            isDark={isDark}
            className="mx-auto rounded-full shadow-2xl border border-border/50"
            // Pass highlight for pulse / "rotation toward portal" effect
            // (current canvas impl pulses on any highlight; future versions can offset draw for direction)
          />

          {/* Orbiting nodes + geodesic springs (SVG overlay) */}
          <svg
            className="absolute inset-0 pointer-events-auto"
            width="580"
            height="580"
            viewBox="0 0 580 580"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          >
            {/* Geodesic / spring lines */}
            {edges.map((edge, idx) => {
              const src = positionedNodes.find(n => n.id === edge.source);
              const tgt = positionedNodes.find(n => n.id === edge.target);
              if (!src || !tgt) return null;
              const isActive = highlightedNodeId === edge.source || highlightedNodeId === edge.target;
              const lineColor = isDark ? (isActive ? "#67e8f9" : "#64748b") : (isActive ? "#0891b2" : "#475569");
              return (
                <line
                  key={idx}
                  x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                  stroke={lineColor}
                  strokeOpacity={isActive ? 0.75 : (isDark ? 0.35 : 0.55)}
                  strokeWidth={isActive ? 1.5 : (isDark ? 0.8 : 1.1)}
                />
              );
            })}

            {/* Nodes */}
            {positionedNodes.map((node) => {
              const isCentral = node.id === centralSphere.centerNodeId;
              const isHighlighted = highlightedNodeId === node.id;
              const r = isCentral ? 18 : (node.tier === 1 ? 13 : 9);
              const fillColor = isHighlighted 
                ? (isDark ? "#67e8f9" : "#0891b2") 
                : (isCentral ? (isDark ? "#f59e0b" : "#d97706") : (isDark ? "#0ea5e9" : "#0284c7"));
              const strokeColor = isDark ? "#0a0c16" : "#e2e8f0";
              const textColor = isHighlighted 
                ? (isDark ? "#e0f2fe" : "#0c4a6e") 
                : (isDark ? "#94a3b8" : "#475569");
              return (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={2}
                    className="cursor-pointer transition-all"
                    onClick={() => openNode(node)}
                    onMouseEnter={() => setHighlightedNodeId(node.id)}
                    onMouseLeave={() => setHighlightedNodeId(null)}
                  />
                  {/* Subtle pulse ring on highlight */}
                  {isHighlighted && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={r + 6}
                      fill="none"
                      stroke={isDark ? "#67e8f9" : "#0891b2"}
                      strokeOpacity={0.5}
                      strokeWidth={1.5}
                    />
                  )}
                  <text
                    x={node.x}
                    y={node.y + r + 14}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize={isCentral ? 11 : 9}
                    fontFamily="monospace"
                    className="pointer-events-none select-none"
                  >
                    {node.title.length > 22 ? node.title.slice(0, 20) + '…' : node.title}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="text-center mt-2 text-[10px] font-mono tracking-[0.2em] text-muted-foreground/70">
            Hover / click nodes • Sphere pulses on resonance • Central texture = living portal
          </div>
        </div>

        {/* Quick node list for mobile / accessibility */}
        <div className="md:hidden mb-8">
          <div className="font-mono text-[9px] uppercase tracking-widest text-amber-400/70 mb-2">Jump to node</div>
          <div className="flex flex-wrap gap-2">
            {nodes.map(n => (
              <Button 
                key={n.id} 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => openNode(n)}
              >
                {n.title.split('—')[0].trim()}
              </Button>
            ))}
          </div>
        </div>

        {/* Legend / Admin note */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground/70 font-mono border-t border-border pt-4">
          <div>
            Tier 1 (Nobel/Glitch) • Tier 2 (Cinematic/Engine) • zeno/xeno tags in data
          </div>
          <button 
            onClick={() => {
              // Simple admin/curate helper — logs a ready-to-paste node template
              const template = {
                id: "new-resonance-node",
                title: "New High-Coherence Node",
                category: "pop-culture",
                tier: 1,
                tags: ["portal", "traversal"],
                summary: "...",
                xprimeRayAlignment: "Strong, specific alignment to xPRIMEray curved transport / observer / hermetic...",
                media: [{ type: "image", url: "...", caption: "...", standardSize: "hero", resonanceNote: "..." }],
                externalLinks: [{ label: "...", url: "...", credit: "..." }]
              };
              console.log('%c[Resonance Spheres] Curate template (copy into resonance_spheres_data.ts):', 'color:#f59e0b', template);
              alert('Template logged to console. Paste into src/data/resonance_spheres_data.ts nodes array.');
            }}
            className="underline hover:text-amber-400"
          >
            + Curate new node (admin)
          </button>
        </div>
      </div>

      {/* Expanded Node Modal with rich media */}
      <Dialog open={!!expanded.node} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-4xl bg-background border-border text-foreground p-0 overflow-hidden">
          {expanded.node && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-[10px]">
                        TIER {expanded.node.tier} • {expanded.node.category.toUpperCase()}
                      </Badge>
                      {expanded.node.zenoXeno && (
                        <Badge className="bg-cyan-500/10 text-cyan-400 text-[10px]">{expanded.node.zenoXeno.toUpperCase()}</Badge>
                      )}
                    </div>
                    <DialogTitle className="text-2xl tracking-tight pr-8">{expanded.node.title}</DialogTitle>
                    <DialogDescription className="text-muted-foreground/80 mt-1">
                      {expanded.node.summary}
                    </DialogDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={closeModal}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-auto">
                {/* Media Carousel / Gallery */}
                {expanded.node.media && expanded.node.media.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/70">Curated Media</div>
                      {totalMedia > 1 && (
                        <div className="flex items-center gap-2 text-xs">
                          <Button variant="outline" size="sm" onClick={prevMedia}><ChevronLeft className="h-3 w-3" /></Button>
                          <span className="font-mono tabular-nums">{expanded.mediaIndex + 1} / {totalMedia}</span>
                          <Button variant="outline" size="sm" onClick={nextMedia}><ChevronRight className="h-3 w-3" /></Button>
                        </div>
                      )}
                    </div>

                    <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30">
                      {currentMedia?.type === 'image' && (
                        <img 
                          src={currentMedia.url} 
                          alt={currentMedia.alt || currentMedia.caption || expanded.node.title}
                          className="w-full max-h-[420px] object-contain bg-card"
                        />
                      )}
                      {currentMedia?.type === 'youtube' && (
                        <div className="aspect-video bg-black">
                          <iframe
                            width="100%"
                            height="100%"
                            src={currentMedia.url.replace('watch?v=', 'embed/').split('&')[0]}
                            title={currentMedia.caption}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}
                      {currentMedia?.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-4 py-2 text-xs font-mono text-primary/90">
                          {currentMedia.caption}
                        </div>
                      )}
                    </div>

                    {currentMedia?.resonanceNote && (
                      <p className="mt-2 text-sm italic text-primary/80 border-l-2 border-cyan-400/40 pl-3">
                        {currentMedia.resonanceNote}
                      </p>
                    )}

                    {/* Thumbnail strip for quick nav */}
                    {expanded.node.media.length > 1 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                        {expanded.node.media.map((m, idx) => (
                          <button
                            key={idx}
                            onClick={() => setExpanded(e => ({ ...e, mediaIndex: idx }))}
                            className={`flex-shrink-0 w-20 h-12 rounded overflow-hidden border ${idx === expanded.mediaIndex ? 'border-primary' : 'border-border'}`}
                          >
                            <img 
                              src={m.thumbnail || m.url} 
                              alt="" 
                              className="w-full h-full object-cover" 
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Signal Resonance (xPRIMEray alignment) */}
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-400/70 mb-1.5">SIGNAL RESONANCE</div>
                  <p className="text-sm leading-relaxed text-foreground/90">{expanded.node.xprimeRayAlignment}</p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {expanded.node.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 text-[10px] rounded bg-secondary/30 border border-border/30 font-mono text-muted-foreground/80">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* External links + credits */}
                {expanded.node.externalLinks && expanded.node.externalLinks.length > 0 && (
                  <div className="pt-2 border-t border-border/30">
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 mb-2">Resonance Echo — Kinship</div>
                    <div className="flex flex-wrap gap-2">
                      {expanded.node.externalLinks.map((link, i) => (
                        <a 
                          key={i}
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300"
                        >
                          {link.label} <ExternalLink className="h-3 w-3" />
                          {link.credit && <span className="text-[10px] text-muted-foreground/50">({link.credit})</span>}
                        </a>
                      ))}
                    </div>
                    <p className="mt-3 text-[10px] text-amber-600 dark:text-amber-400/60 italic">
                      Resonance Echo — Glitch Productions, The Amazing Digital Circus (and the Nobel curved-spacetime lineage). 
                      Framed as technical and perceptual kinship with xPRIMEray portals, traversal, and observer immersion.
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-border flex justify-end">
                <Button variant="outline" onClick={closeModal}>Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResonanceSpheresAtlas;
