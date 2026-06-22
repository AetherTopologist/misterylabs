import { Eye, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ObserverStance, ObserverStanceId } from "@/data/brochSphere/types";

interface BrochStanceToggleProps {
  stances: ObserverStance[];
  activeStanceId: ObserverStanceId;
  onChange: (stanceId: ObserverStanceId) => void;
}

export function BrochStanceToggle({ stances, activeStanceId, onChange }: BrochStanceToggleProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/80 p-3 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            Observer Stance
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Shared nodes change meaning, not just visibility.
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {stances.map((stance) => {
          const active = stance.id === activeStanceId;
          const Icon = stance.id === "verifier" ? Eye : Radio;
          return (
            <Button
              key={stance.id}
              type="button"
              variant={active ? "default" : "outline"}
              className="h-auto justify-start rounded-lg px-3 py-3 text-left"
              onClick={() => onChange(stance.id)}
            >
              <Icon className="h-4 w-4" />
              <span className="min-w-0">
                <span className="block text-sm">{stance.name}</span>
                <span className="mt-1 block whitespace-normal text-[11px] font-normal leading-snug opacity-75">
                  {stance.governingQuestion}
                </span>
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
