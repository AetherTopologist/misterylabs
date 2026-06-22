import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { brochConstellations } from "@/data/brochSphere/constellations";
import { brochEdges, brochJourneys } from "@/data/brochSphere/journeys";
import { brochNodes, brochNodesById } from "@/data/brochSphere/nodes";
import { observerStances, observerStancesById } from "@/data/brochSphere/observerStances";
import { brochTransferEventsById } from "@/data/brochSphere/transferEvents";
import type {
  BrochConstellation,
  BrochEdge,
  BrochNode,
  BrochTransferEvent,
  ObserverStanceId,
} from "@/data/brochSphere/types";
import { BrochConstellationPanel } from "./BrochConstellationPanel";
import { BrochJourneyPanel } from "./BrochJourneyPanel";
import { BrochNodeCard } from "./BrochNodeCard";
import { BrochStanceToggle } from "./BrochStanceToggle";
import { BrochTransferEventCard } from "./BrochTransferEventCard";

const WIDTH = 980;
const HEIGHT = 560;

const TRANSFER_POINTS: Record<string, { x: number; y: number }> = {
  "te-02": { x: 520, y: 150 },
  "te-03": { x: 395, y: 94 },
  "te-04": { x: 432, y: 206 },
};

type Selection =
  | { type: "node"; id: string; horizon?: boolean }
  | { type: "transfer"; id: string };

const KIND_FILL: Record<BrochNode["kind"], string> = {
  star: "hsl(var(--warning))",
  knowledge: "hsl(var(--spectral-cool))",
  story: "hsl(var(--spectral-magenta))",
  bridge: "hsl(var(--success))",
};

const KIND_STROKE: Record<BrochNode["kind"], string> = {
  star: "hsl(48 100% 82%)",
  knowledge: "hsl(188 100% 78%)",
  story: "hsl(322 100% 82%)",
  bridge: "hsl(145 95% 74%)",
};

export function BrochSpherePrototype() {
  const [activeStanceId, setActiveStanceId] = useState<ObserverStanceId>("verifier");
  const [activeJourneyId, setActiveJourneyId] = useState("return-path");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activeConstellationId, setActiveConstellationId] = useState<string | null>("geometry-arc");
  const [showSingleQuestion, setShowSingleQuestion] = useState(false);
  const [selection, setSelection] = useState<Selection>({ type: "node", id: "k-einstein" });

  const stance = observerStancesById[activeStanceId];
  const activeJourney = brochJourneys.find((journey) => journey.id === activeJourneyId) ?? brochJourneys[0];
  const activeStep = activeJourney.steps[activeStepIndex];
  const activeConstellation =
    brochConstellations.find((constellation) => constellation.id === activeConstellationId) ?? null;

  useEffect(() => {
    setActiveConstellationId(activeStanceId === "verifier" ? "geometry-arc" : "story-arc");
  }, [activeStanceId]);

  useEffect(() => {
    setSelection(
      activeStep.type === "transfer"
        ? { type: "transfer", id: activeStep.id }
        : { type: "node", id: activeStep.id, horizon: activeStep.type === "horizon" },
    );
  }, [activeStep]);

  const reachedNodeIds = useMemo(() => {
    const reached = new Set<string>();
    activeJourney.steps.slice(0, activeStepIndex + 1).forEach((step) => {
      if (step.type === "node") reached.add(step.id);
    });
    return reached;
  }, [activeJourney.steps, activeStepIndex]);

  const horizonNodeId = activeStep.type === "horizon" ? activeStep.id : null;

  const visibleNodeIds = useMemo(() => {
    const visible = new Set(stance.visibleNodeIds);
    reachedNodeIds.forEach((id) => visible.add(id));
    if (horizonNodeId) visible.add(horizonNodeId);
    activeConstellation?.nodeIds.forEach((id) => visible.add(id));
    return visible;
  }, [activeConstellation, horizonNodeId, reachedNodeIds, stance.visibleNodeIds]);

  const selectedNode =
    selection.type === "node" ? brochNodesById[selection.id] : null;
  const selectedTransfer =
    selection.type === "transfer" ? brochTransferEventsById[selection.id] : null;

  const activeTransferIds = new Set<string>();
  if (activeStep.type === "transfer") activeTransferIds.add(activeStep.id);
  activeConstellation?.transferEventIds?.forEach((id) => activeTransferIds.add(id));

  const journeyPathNodeIds = activeJourney.steps
    .filter((step) => step.type === "node" || step.type === "horizon")
    .map((step) => step.id);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border/50 bg-card/80 p-4 shadow-elevated md:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
                22-node toy prototype
              </Badge>
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300">
                Return Path first
              </Badge>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
              Broch Sphere Prototype
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Start at Einstein, cross TE-03, reach Story, and stop with xPRIMEray visible but unreached.
            </p>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/40 p-3 text-sm text-muted-foreground">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Current stance
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">{stance.name}</p>
            <p className="mt-1 max-w-xs leading-relaxed">{stance.governingQuestion}</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <BrochGraph
              activeConstellation={activeConstellation}
              activeTransferIds={activeTransferIds}
              horizonNodeId={horizonNodeId}
              journeyPathNodeIds={journeyPathNodeIds}
              reachedNodeIds={reachedNodeIds}
              selected={selection}
              visibleNodeIds={visibleNodeIds}
              onSelect={setSelection}
            />
          </div>

          <div className="flex max-h-[580px] flex-col gap-4 overflow-y-auto">
            <BrochJourneyPanel
              journeys={brochJourneys}
              activeJourney={activeJourney}
              activeStepIndex={activeStepIndex}
              onJourneyChange={(journeyId) => {
                setActiveJourneyId(journeyId);
                setActiveStepIndex(0);
              }}
              onStepChange={setActiveStepIndex}
            />
            <BrochStanceToggle
              stances={observerStances}
              activeStanceId={activeStanceId}
              onChange={setActiveStanceId}
            />
            {selectedTransfer && <BrochTransferEventCard event={selectedTransfer} />}
            {selectedNode && (
              <BrochNodeCard
                node={selectedNode}
                stance={stance}
                horizon={selection.type === "node" && selection.horizon}
              />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <SingleQuestionPanel
            stanceId={activeStanceId}
            show={showSingleQuestion}
            onToggle={() => setShowSingleQuestion((show) => !show)}
          />
        </div>

        <div className="space-y-5">
          <BrochConstellationPanel
            stance={stance}
            constellations={brochConstellations}
            activeConstellationId={activeConstellationId}
            onSelect={setActiveConstellationId}
          />
          <BeaconPanel onSelect={setSelection} />
        </div>
      </section>
    </div>
  );
}

function BrochGraph({
  activeConstellation,
  activeTransferIds,
  horizonNodeId,
  journeyPathNodeIds,
  reachedNodeIds,
  selected,
  visibleNodeIds,
  onSelect,
}: {
  activeConstellation: BrochConstellation | null;
  activeTransferIds: Set<string>;
  horizonNodeId: string | null;
  journeyPathNodeIds: string[];
  reachedNodeIds: Set<string>;
  selected: Selection;
  visibleNodeIds: Set<string>;
  onSelect: (selection: Selection) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/50 bg-[hsl(var(--layer-diagram))] shadow-card">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Broch Sphere 2D prototype graph"
        className="h-[420px] w-full min-w-[720px] lg:h-[520px]"
      >
        <defs>
          <radialGradient id="brochGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--accent) / 0.45)" />
            <stop offset="100%" stopColor="hsl(var(--accent) / 0)" />
          </radialGradient>
          <filter id="nodeGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="hsl(var(--layer-diagram))" />
        <g opacity="0.52">
          {[0, 60, 120, 180, 240, 300, 360].map((lon) => {
            const x = (lon / 360) * WIDTH;
            return (
              <line
                key={lon}
                x1={x}
                x2={x}
                y1="0"
                y2={HEIGHT}
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
            );
          })}
          {[-60, -30, 0, 30, 60, 90].map((lat) => {
            const y = latToY(lat);
            return (
              <line
                key={lat}
                x1="0"
                x2={WIDTH}
                y1={y}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
            );
          })}
        </g>

        <g>
          {["FORMAL", "PHYSICAL", "ENGINEERING", "HISTORICAL", "CULTURAL", "PERSONAL"].map(
            (sector, index) => {
              const sx = index * (WIDTH / 6) + 18;
              const sy = HEIGHT - 18;
              return (
                <g key={sector}>
                  <rect
                    x={sx - 4}
                    y={sy - 11}
                    width={sector.length * 6.5 + 14}
                    height={14}
                    rx="2"
                    fill="hsl(var(--layer-panel) / 0.80)"
                  />
                  <text
                    x={sx}
                    y={sy}
                    fill="hsl(var(--muted-foreground) / 0.72)"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    letterSpacing="2"
                  >
                    {sector}
                  </text>
                </g>
              );
            },
          )}
        </g>

        <g>
          {brochEdges.map((edge) => (
            <GraphEdge
              key={edge.id}
              edge={edge}
              active={
                activeTransferIds.has(edge.transferEventId ?? "") ||
                edgeConnectsJourney(edge, journeyPathNodeIds)
              }
            />
          ))}
        </g>

        {activeConstellation && (
          <g>
            {activeConstellation.nodeIds.slice(0, -1).map((fromId, index) => (
              <GraphLine
                key={`${fromId}-${activeConstellation.nodeIds[index + 1]}`}
                from={brochNodesById[fromId]}
                to={brochNodesById[activeConstellation.nodeIds[index + 1]]}
                color="hsl(var(--spectral-violet))"
                width={4}
                opacity={0.82}
              />
            ))}
          </g>
        )}

        <g>
          {Object.entries(TRANSFER_POINTS).map(([id, point]) => (
            <TransferGlyph
              key={id}
              id={id}
              point={point}
              active={activeTransferIds.has(id) || selected.type === "transfer" && selected.id === id}
              onSelect={() => onSelect({ type: "transfer", id })}
            />
          ))}
        </g>

        <g>
          {brochNodes.map((node) => {
            const point = nodeToPoint(node);
            const visible = visibleNodeIds.has(node.id);
            const reached = reachedNodeIds.has(node.id);
            const selectedNode = selected.type === "node" && selected.id === node.id;
            const horizon = horizonNodeId === node.id;
            const constellation = activeConstellation?.nodeIds.includes(node.id) ?? false;

            return (
              <NodeGlyph
                key={node.id}
                node={node}
                point={point}
                visible={visible}
                reached={reached}
                selected={selectedNode}
                horizon={horizon}
                constellation={constellation}
                onSelect={() => onSelect({ type: "node", id: node.id, horizon })}
              />
            );
          })}
        </g>
      </svg>
      <div className="flex flex-wrap items-center gap-3 border-t border-border/40 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="relative h-4 w-4">
            <span className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-yellow-300/70" />
            <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-yellow-300/70" />
            <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300" />
          </span>
          Star
        </span>
        <LegendDot className="bg-cyan-300" label="Knowledge" />
        <LegendDot className="bg-fuchsia-300" label="Story" />
        <LegendDot className="bg-emerald-300" label="Bridge" />
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rotate-45 border border-amber-300 bg-amber-300/20" />
          Threshold
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full border border-dashed border-amber-300" />
          Beacon
        </span>
      </div>
    </div>
  );
}

function GraphEdge({ edge, active }: { edge: BrochEdge; active: boolean }) {
  const from = brochNodesById[edge.from];
  const to = brochNodesById[edge.to];
  const color =
    edge.kind === "te-crossing"
      ? "hsl(var(--warning))"
      : edge.kind === "beacon"
        ? "hsl(var(--destructive))"
        : "hsl(var(--instrument-line))";

  // When the transfer event this edge belongs to is active, the crossing
  // becomes solid — the strand boundary is live, not latent.
  const dashed = (edge.kind === "te-crossing" || edge.kind === "beacon") && !active;

  return (
    <GraphLine
      from={from}
      to={to}
      color={color}
      width={active ? 3 : 1.3}
      opacity={active ? 0.88 : 0.18}
      dashed={dashed}
    />
  );
}

function GraphLine({
  from,
  to,
  color,
  width,
  opacity,
  dashed,
}: {
  from: BrochNode;
  to: BrochNode;
  color: string;
  width: number;
  opacity: number;
  dashed?: boolean;
}) {
  const a = nodeToPoint(from);
  const b = nodeToPoint(to);
  return (
    <line
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={dashed ? "8 8" : undefined}
      opacity={opacity}
    />
  );
}

function TransferGlyph({
  id,
  point,
  active,
  onSelect,
}: {
  id: string;
  point: { x: number; y: number };
  active: boolean;
  onSelect: () => void;
}) {
  const half = active ? 16 : 12;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Select ${id}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
      className="cursor-pointer outline-none"
    >
      {active && (
        <circle
          cx={point.x}
          cy={point.y}
          r="28"
          fill="hsl(var(--warning) / 0.08)"
          stroke="hsl(var(--warning) / 0.28)"
          strokeWidth="1"
        />
      )}
      <rect
        x={point.x - half}
        y={point.y - half}
        width={half * 2}
        height={half * 2}
        transform={`rotate(45 ${point.x} ${point.y})`}
        fill={active ? "hsl(var(--warning) / 0.45)" : "hsl(var(--warning) / 0.18)"}
        stroke={active ? "hsl(48 100% 78%)" : "hsl(var(--warning) / 0.6)"}
        strokeWidth={active ? 2.5 : 1.5}
      />
      <text
        x={point.x}
        y={point.y - (active ? 25 : 19)}
        textAnchor="middle"
        fill="hsl(var(--warning))"
        fontSize={active ? "12" : "10"}
        fontFamily="JetBrains Mono, monospace"
        fontWeight="600"
      >
        {id.toUpperCase()}
      </text>
    </g>
  );
}

function NodeGlyph({
  node,
  point,
  visible,
  reached,
  selected,
  horizon,
  constellation,
  onSelect,
}: {
  node: BrochNode;
  point: { x: number; y: number };
  visible: boolean;
  reached: boolean;
  selected: boolean;
  horizon: boolean;
  constellation: boolean;
  onSelect: () => void;
}) {
  const radius = node.kind === "star" ? 8 : node.kind === "bridge" ? 7 : 6;
  const emphasis = selected || reached || horizon || constellation;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Select ${node.label}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
      className="cursor-pointer outline-none"
      opacity={visible ? 1 : 0.26}
    >
      {(selected || horizon || node.openQuestion) && (
        <circle
          cx={point.x}
          cy={point.y}
          r={node.influenceRadius * 0.92}
          fill={horizon ? "url(#brochGlow)" : `${KIND_FILL[node.kind]}22`}
          opacity={horizon ? 0.75 : 0.3}
        />
      )}
      {node.openQuestion && (
        <circle
          cx={point.x}
          cy={point.y}
          r={radius + 10}
          fill="none"
          stroke="hsl(var(--warning) / 0.74)"
          strokeWidth="1.6"
          strokeDasharray="3 5"
        />
      )}
      {horizon && (
        <circle
          cx={point.x}
          cy={point.y}
          r={node.influenceRadius * 1.18}
          fill="none"
          stroke="hsl(var(--warning) / 0.65)"
          strokeWidth="2"
          strokeDasharray="5 7"
        />
      )}
      {node.kind === "star" && (
        <g stroke="hsl(48 100% 82% / 0.82)" strokeLinecap="round" strokeWidth="1.5">
          <line x1={point.x - 13} y1={point.y} x2={point.x - 8} y2={point.y} />
          <line x1={point.x + 8} y1={point.y} x2={point.x + 13} y2={point.y} />
          <line x1={point.x} y1={point.y - 13} x2={point.x} y2={point.y - 8} />
          <line x1={point.x} y1={point.y + 8} x2={point.x} y2={point.y + 13} />
          <line x1={point.x - 9} y1={point.y - 9} x2={point.x - 6} y2={point.y - 6} />
          <line x1={point.x + 6} y1={point.y + 6} x2={point.x + 9} y2={point.y + 9} />
          <line x1={point.x + 6} y1={point.y - 6} x2={point.x + 9} y2={point.y - 9} />
          <line x1={point.x - 9} y1={point.y + 9} x2={point.x - 6} y2={point.y + 6} />
        </g>
      )}
      <circle
        cx={point.x}
        cy={point.y}
        r={radius + (selected ? 3 : constellation ? 2 : 0)}
        fill={KIND_FILL[node.kind]}
        stroke={KIND_STROKE[node.kind]}
        strokeWidth={selected ? 3 : reached || constellation ? 2 : 1}
        filter={emphasis ? "url(#nodeGlow)" : undefined}
      />
      {node.uncertainty && (
        <path
          d={`M ${point.x - radius - 8} ${point.y - radius - 8} l 8 0 l -4 8 z`}
          fill="hsl(var(--destructive))"
        />
      )}
      <rect
        x={point.x + 9}
        y={point.y - 9}
        width={node.label.length * (selected ? 7.5 : 6.5) + 10}
        height={selected ? 18 : 15}
        rx="2"
        className="broch-node-label-bg"
        strokeWidth="0.5"
      />
      <text
        x={point.x + 12}
        y={point.y + 4}
        fill={visible ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))"}
        fontSize={selected ? "13" : "11"}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={selected ? 700 : 500}
      >
        {node.label}
      </text>
    </g>
  );
}

function SingleQuestionPanel({
  stanceId,
  show,
  onToggle,
}: {
  stanceId: ObserverStanceId;
  show: boolean;
  onToggle: () => void;
}) {
  const stance = observerStancesById[stanceId];

  return (
    <div className="rounded-lg border border-border/50 bg-card/85 p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-amber-500/15 text-amber-300">
            <HelpCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Single Question
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              There is a question The Verifier cannot ask from where they stand.
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onToggle}>
          {show ? "Hide" : "Reveal"}
        </Button>
      </div>
      {show && (
        <div className="mt-4 rounded-md border border-amber-500/25 bg-amber-500/8 p-3">
          <p className="text-sm leading-relaxed text-foreground/90">{stance.cannotAsk}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Watch Sagan, Interstellar, and xPRIMEray when you shift stance. They are the same nodes,
            but the question they carry changes.
          </p>
        </div>
      )}
    </div>
  );
}

function BeaconPanel({ onSelect }: { onSelect: (selection: Selection) => void }) {
  const beacons = [
    { id: "te-04", label: "When does TE-04 return?", type: "transfer" as const },
    { id: "k-xprimery", label: "xPRIMEray: instrument or heir?", type: "node" as const },
    { id: "b-tolkien", label: "Where does Tolkien actually sit?", type: "node" as const },
    { id: "s-interstellar", label: "Did Interstellar move northward?", type: "node" as const },
  ];

  return (
    <div className="rounded-lg border border-amber-500/25 bg-amber-500/8 p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-300" />
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-300">
          Open Questions / Beacons
        </p>
      </div>
      <div className="grid gap-2">
        {beacons.map((beacon) => (
          <Button
            key={beacon.id}
            type="button"
            variant="outline"
            className="h-auto justify-start rounded-lg border-amber-500/25 bg-background/30 px-3 py-2 text-left"
            onClick={() =>
              onSelect(
                beacon.type === "transfer"
                  ? { type: "transfer", id: beacon.id }
                  : { type: "node", id: beacon.id, horizon: beacon.id === "k-xprimery" },
              )
            }
          >
            <span className="whitespace-normal text-sm">{beacon.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function edgeConnectsJourney(edge: BrochEdge, journeyPathNodeIds: string[]) {
  const fromIndex = journeyPathNodeIds.indexOf(edge.from);
  const toIndex = journeyPathNodeIds.indexOf(edge.to);
  return fromIndex !== -1 && toIndex !== -1 && Math.abs(fromIndex - toIndex) === 1;
}

function nodeToPoint(node: BrochNode) {
  return {
    x: (node.longitude / 360) * WIDTH,
    y: latToY(node.latitude),
  };
}

function latToY(latitude: number) {
  return ((90 - latitude) / 180) * HEIGHT;
}
