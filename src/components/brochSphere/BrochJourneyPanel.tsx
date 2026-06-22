import { ArrowLeft, ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BrochJourney } from "@/data/brochSphere/types";

interface BrochJourneyPanelProps {
  journeys: BrochJourney[];
  activeJourney: BrochJourney;
  activeStepIndex: number;
  onJourneyChange: (journeyId: string) => void;
  onStepChange: (index: number) => void;
}

export function BrochJourneyPanel({
  journeys,
  activeJourney,
  activeStepIndex,
  onJourneyChange,
  onStepChange,
}: BrochJourneyPanelProps) {
  const activeStep = activeJourney.steps[activeStepIndex];
  const canGoBack = activeStepIndex > 0;
  const canGoForward = activeStepIndex < activeJourney.steps.length - 1;

  return (
    <div className="rounded-lg border border-border/50 bg-card/85 p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/15 text-primary-glow">
          <Compass className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Journey</p>
            {activeJourney.primary && (
              <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
                default arrival
              </Badge>
            )}
          </div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">{activeJourney.name}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{activeJourney.subtitle}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {journeys.map((journey) => (
          <Button
            key={journey.id}
            type="button"
            variant={journey.id === activeJourney.id ? "secondary" : "outline"}
            className="h-auto justify-start rounded-lg px-3 py-2 text-left"
            onClick={() => onJourneyChange(journey.id)}
          >
            <span className="whitespace-normal text-xs">{journey.name}</span>
          </Button>
        ))}
      </div>

      <div className="mt-4 rounded-md border border-border/40 bg-background/35 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Step {activeStepIndex + 1} / {activeJourney.steps.length}
          </p>
          <Badge variant="outline" className="border-border/50 text-muted-foreground">
            {activeStep.type}
          </Badge>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">{activeStep.caption}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canGoBack}
          onClick={() => onStepChange(activeStepIndex - 1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!canGoForward}
          onClick={() => onStepChange(activeStepIndex + 1)}
        >
          Forward
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
