// AtlasPortalCard.tsx
// Drop-in component for the misterylabs React site (Atlas or homepage).
// Matches existing diagnostic-frame + amber/cyan aesthetic.

import React from 'react';

export function AtlasPortalCard() {
  return (
    <article className="diagnostic-frame rounded-sm border border-amber-500/20 bg-card/22 p-5 md:p-6 transition-base hover:border-amber-500/32">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-400/60">VISUAL ARTIFACT</span>
        <div className="h-px flex-1 bg-gradient-to-r from-amber-500/20 to-transparent" />
        <span className="font-mono text-[9px] text-cyan-400/50">xPRIMEray • holographic-portals-v0.1+</span>
      </div>

      <h3 className="text-[19px] md:text-[21px] font-semibold tracking-[-0.015em] text-foreground mb-2">
        Holographic Portals — Optical Transport Illusion
      </h3>

      <p className="text-sm text-muted-foreground/90 leading-snug mb-4">
        Fly through nested pockets. Watch light trap into event-horizon darkness, then bloom when you cross into the bulk.
        AdS/CFT toy model + live GRIN curved transport (RK4 witness orbs). UAP curved-propulsion intuition layer.
      </p>

      {/* Replace with real video or Godot Web export when ready */}
      <div className="relative aspect-video rounded bg-black/40 mb-4 overflow-hidden border border-white/10">
        <iframe
          src="https://www.youtube.com/embed/IhEaw3Kuhf0"
          title="Reference: optozorax Portal Explorer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <a 
          href="https://github.com/AetherTopologist/misterylabs/tree/main/demos/portals_pocket/optical_transport_illusion" 
          className="text-cyan-400 hover:text-cyan-300 transition-colors underline-offset-2 hover:underline"
        >
          → Godot 4 Demo (clone &amp; open folder)
        </a>
        <a 
          href="https://optozorax.github.io/portal/" 
          className="text-amber-400 hover:text-amber-300 transition-colors underline-offset-2 hover:underline"
        >
          Reference: optozorax Portal Explorer
        </a>
        <span className="text-muted-foreground/60">6 live RK4 orbs • SubViewport recursion • GRIN field</span>
      </div>
    </article>
  );
}
