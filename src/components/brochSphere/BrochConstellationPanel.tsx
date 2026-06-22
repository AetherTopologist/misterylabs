import { Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BrochConstellation, ObserverStance } from "@/data/brochSphere/types";

interface BrochConstellationPanelProps {
  stance: ObserverStance;
  constellations: BrochConstellation[];
  activeConstellationId: string | null;
  onSelect: (constellationId: string | null) => void;
}

export function BrochConstellationPanel({
  stance,
  constellations,
  activeConstellationId,
  onSelect,
}: BrochConstellationPanelProps) {
  const visible = constellations.filter((constellation) => constellation.stanceId === stance.id);
  const active = visible.find((constellation) => constellation.id === activeConstellationId) ?? visible[0];

  return (
    <div className="rounded-lg border border-border/50 bg-card/85 p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <Network className="h-4 w-4 text-spectral-violet" />
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Constellations
        </p>
      </div>
      <div className="grid gap-2">
        {visible.map((constellation) => (
          <Button
            key={constellation.id}
            type="button"
            variant={constellation.id === activeConstellationId ? "secondary" : "outline"}
            className="h-auto justify-start rounded-lg px-3 py-2 text-left"
            onClick={() =>
              onSelect(constellation.id === activeConstellationId ? null : constellation.id)
            }
          >
            <span className="whitespace-normal text-sm">{constellation.name}</span>
          </Button>
        ))}
      </div>

      {active && (
        <div className="mt-4 rounded-md border border-violet-400/25 bg-violet-400/8 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-violet-400/40 bg-violet-400/10 text-violet-200">
              {active.name}
            </Badge>
            {active.transferEventIds?.map((id) => (
              <Badge key={id} variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300">
                {id.toUpperCase()}
              </Badge>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{active.reading}</p>
        </div>
      )}
    </div>
  );
}
