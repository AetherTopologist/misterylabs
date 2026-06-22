import { GitBranch, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BrochTransferEvent } from "@/data/brochSphere/types";

interface BrochTransferEventCardProps {
  event: BrochTransferEvent;
}

export function BrochTransferEventCard({ event }: BrochTransferEventCardProps) {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/8 p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-amber-400" />
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-300">
              Transfer Event
            </p>
          </div>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">{event.id.toUpperCase()}</h3>
        </div>
        <Badge
          variant="outline"
          className={
            event.returnPathStatus === "unconfirmed"
              ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
              : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
          }
        >
          {event.returnPathStatus ?? "threshold"}
        </Badge>
      </div>

      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Direction</dt>
          <dd className="mt-1 text-foreground">{event.direction}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Catalyst</dt>
          <dd className="mt-1 text-foreground">{event.catalyst}</dd>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Latency</dt>
            <dd className="mt-1 text-foreground">{event.latency}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Yield</dt>
            <dd className="mt-1 text-foreground">{event.yield}</dd>
          </div>
        </div>
      </dl>

      <div className="mt-4 rounded-md border border-amber-500/25 bg-background/40 p-3">
        <div className="mb-2 flex items-center gap-2 text-amber-300">
          <HelpCircle className="h-4 w-4" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Question Opened</p>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">{event.question}</p>
      </div>
    </div>
  );
}
