import { HelpCircle, MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BrochNode, ObserverStance } from "@/data/brochSphere/types";

const KIND_LABELS: Record<BrochNode["kind"], string> = {
  star: "Star",
  knowledge: "Knowledge Lineage",
  story: "Story Lineage",
  bridge: "Bridge",
};

const KIND_CLASSES: Record<BrochNode["kind"], string> = {
  star: "border-yellow-400/40 bg-yellow-400/10 text-yellow-200",
  knowledge: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  story: "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-200",
  bridge: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
};

interface BrochNodeCardProps {
  node: BrochNode;
  stance: ObserverStance;
  horizon?: boolean;
}

export function BrochNodeCard({ node, stance, horizon }: BrochNodeCardProps) {
  const stanceReading = node.stanceReadings?.[stance.id];

  return (
    <div className="rounded-lg border border-border/50 bg-card/85 p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={KIND_CLASSES[node.kind]}>
              {KIND_LABELS[node.kind]}
            </Badge>
            {horizon && (
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300">
                visible, unreached
              </Badge>
            )}
            {node.uncertainty && (
              <Badge variant="outline" className="border-rose-400/40 bg-rose-400/10 text-rose-200">
                uncertain
              </Badge>
            )}
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">{node.label}</h2>
        </div>
        <div className="rounded-md border border-border/40 bg-secondary/30 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {node.id}
        </div>
      </div>

      {stanceReading && (
        <div className="mt-4 rounded-md border border-primary/25 bg-primary/8 p-3">
          <div className="mb-2 flex items-center gap-2 text-primary-glow">
            <MapPin className="h-4 w-4" />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]">{stance.name} Reading</p>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{stanceReading}</p>
        </div>
      )}

      {node.openQuestion && (
        <div className="mt-4 rounded-md border border-amber-500/25 bg-amber-500/8 p-3">
          <div className="mb-2 flex items-center gap-2 text-amber-300">
            <HelpCircle className="h-4 w-4" />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Open Question</p>
          </div>
          {node.uncertainty && (
            <p className="mb-2 flex items-center gap-2 text-xs text-rose-200">
              <Sparkles className="h-3.5 w-3.5" />
              {node.uncertainty}
            </p>
          )}
          <p className="text-sm leading-relaxed text-foreground/90">{node.openQuestion}</p>
        </div>
      )}

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <Info label="Latitude" value={`${node.latitude} deg`} />
        <Info label="Longitude" value={`${node.longitude} deg`} />
        <Info label="Sector" value={node.sector} />
        <Info label="Radius" value={`${node.influenceRadius} deg`} />
        <Info label="Heritage" value={node.heritageDepth} />
        <Info label="Influence" value={node.influenceDepth} />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/30 bg-secondary/25 px-3 py-2">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}
