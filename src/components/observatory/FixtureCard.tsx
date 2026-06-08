import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type FixtureStatus = "mature" | "public" | "research" | "experimental" | "placeholder";
export type Layer = 1 | 2 | 3;

export interface Fixture {
  id: string;
  title: string;
  layer: Layer;
  status: FixtureStatus;
  desc: string;
  tags: string[];
  image?: string;
  note?: string;
  isHero?: boolean;
}

const statusClass = (status: FixtureStatus) => {
  if (status === "mature") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (status === "public") return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
  if (status === "research") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  if (status === "experimental") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return "bg-secondary/40 text-muted-foreground border-border/40";
};

const layerLabel = (layer: Layer) => {
  if (layer === 1) return "Instrument Validation";
  if (layer === 2) return "Public Observatory";
  return "Performance (Gated)";
};

export function FixtureCard({ fixture, compact = false }: { fixture: Fixture; compact?: boolean }) {
  const { title, layer, status, desc, tags, image, note, isHero } = fixture;

  return (
    <Card className={`diagnostic-frame group overflow-hidden ${isHero ? "border-cyan-500/30" : "border-border/30"}`}>
      {image && (
        <div className="h-36 bg-card overflow-hidden border-b border-border/30">
          <img src={image} alt={title} className="w-full h-full object-cover opacity-75 group-hover:opacity-95 transition" />
        </div>
      )}
      <CardHeader className={compact ? "py-3" : undefined}>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight tracking-tight pr-2">{title}</CardTitle>
          <Badge className={statusClass(status)}>{status.toUpperCase()}</Badge>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground/70 tracking-widest mt-0.5">
          LAYER {layer} • {layerLabel(layer)}
        </div>
      </CardHeader>
      {!compact && (
        <CardContent>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{desc}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {tags.map((tag, i) => (
              <span key={i} className="text-[9px] px-1.5 py-px rounded bg-secondary/30 text-muted-foreground">{tag}</span>
            ))}
          </div>
          {note && <div className="mt-2 text-[10px] text-amber-400/80">{note}</div>}
          {isHero && <div className="mt-2 text-[10px] text-cyan-400/70">PUBLIC HERO — recommended entry point</div>}
        </CardContent>
      )}
    </Card>
  );
}
