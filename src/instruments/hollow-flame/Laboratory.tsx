import { useSim } from "@/instruments/hollow-flame/sim";

const CARDS = [
  {
    id: "flame",
    title: "Flame",
    kicker: "Chemical",
    boundary: "An open reaction sheet. No membrane.",
    energy: "Enthalpy of the wax, spent as heat and light.",
    memory: "None. Relighting builds a new shell from whatever the room is doing now.",
    recovery: "Small bends only. Blow-off is often final.",
  },
  {
    id: "plasmoid",
    title: "Plasmoid",
    kicker: "Electromagnetic",
    boundary: "A double layer: a thin potential drop in a plasma, not a flame front.",
    energy: "Electrical or magnetic free energy. Not wax.",
    memory: "None in this schematic. The shape is the instantaneous field.",
    recovery: "May reform if the driver is still on. That is not homeostasis.",
  },
  {
    id: "cell",
    title: "Cell",
    kicker: "Living",
    boundary: "A membrane that is built, sealed, and repaired.",
    energy: "Metabolism, throttled rather than runaway.",
    memory: "A genome, and — in Levin’s hypothesis — bioelectric pattern that can store an anatomical target.",
    recovery: "Insults are corrected unless the membrane is already failing.",
  },
] as const;

const DIMENSIONS = [
  {
    title: "Energy throughput",
    gloss: "How much free energy has to stream through just to keep the boundary.",
    flame: 78,
    plasmoid: 70,
    cell: 42,
  },
  {
    title: "Boundary maintenance",
    gloss: "Whether something actively holds an inside apart from an outside.",
    flame: 46,
    plasmoid: 58,
    cell: 90,
  },
  {
    title: "Feedback",
    gloss: "Loops that correct the structure, rather than only local chemistry.",
    flame: 28,
    plasmoid: 44,
    cell: 92,
  },
  {
    title: "Perturbation recovery",
    gloss: "Use Gust on each system. The ranks below are the claim, not a live score.",
    flame: 34,
    plasmoid: 40,
    cell: 88,
  },
  {
    title: "Information inheritance",
    gloss: "Whether any pattern survives the event that produced it.",
    flame: 4,
    plasmoid: 8,
    cell: 96,
  },
];

function Bar({ value, tone, active }: { value: number; tone: "ember" | "frost" | "paper"; active: boolean }) {
  const fill = tone === "ember" ? "bg-ember" : tone === "frost" ? "bg-frost" : "bg-paper";
  return (
    <div className={active ? "opacity-100" : "opacity-70"}>
      <div className="meter" aria-hidden="true">
        <span className={fill} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function Laboratory() {
  const snap = useSim();
  const active = snap.subject === "manifold" ? "flame" : snap.subject;
  return (
    <section id="laboratory" className="scroll-mt-20 border-t border-line px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="max-w-2xl">
          <p className="font-mono text-xs tracking-widest text-ember uppercase">Comparative laboratory</p>
          <h2 className="pt-2 font-display text-3xl text-paper sm:text-4xl">Three boundaries, not one phenomenon</h2>
          <p className="pt-3 text-dust">
            A bright, self-contained shape is not a flame, and a flame is not a cell. The bars are conceptual ranks for teaching. They are not measurements.
          </p>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          {CARDS.map((card) => {
            const on = active === card.id;
            return (
              <article key={card.id} className={on ? "border border-ember bg-surface p-4" : "border border-line bg-raised p-4"}>
                <p className="font-mono text-xs tracking-widest text-dust uppercase">{card.kicker}</p>
                <h3 className="pt-1 font-display text-2xl text-paper">{card.title}</h3>
                <dl className="mt-3 flex flex-col gap-3 text-sm">
                  <div>
                    <dt className="font-mono text-xs tracking-widest text-dust uppercase">Boundary</dt>
                    <dd className="text-paper">{card.boundary}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs tracking-widest text-dust uppercase">Energy</dt>
                    <dd className="text-paper">{card.energy}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs tracking-widest text-dust uppercase">Memory</dt>
                    <dd className="text-paper">{card.memory}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs tracking-widest text-dust uppercase">After a hit</dt>
                    <dd className="text-paper">{card.recovery}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>

        <div className="flex flex-col gap-6">
          {DIMENSIONS.map((row) => (
            <div key={row.title} className="grid gap-3 border-t border-line pt-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
              <div>
                <h3 className="font-display text-xl text-paper">{row.title}</h3>
                <p className="pt-1 text-sm text-dust">{row.gloss}</p>
              </div>
              <div className="flex flex-col gap-2">
                {(
                  [
                    ["Flame", row.flame, "ember"],
                    ["Plasmoid", row.plasmoid, "frost"],
                    ["Cell", row.cell, "paper"],
                  ] as const
                ).map(([name, value, tone]) => {
                  const id = name.toLowerCase();
                  return (
                    <div key={name} className="grid grid-cols-[5.5rem_minmax(0,1fr)_2.5rem] items-center gap-3">
                      <span className="font-mono text-xs tracking-wider text-dust uppercase">{name}</span>
                      <Bar value={value} tone={tone} active={active === id} />
                      <span className="text-right font-mono text-xs text-paper tabular-nums">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="max-w-2xl text-dust">
          Inheritance is the split that matters. A flame keeps no pattern a successor could read. A cell does. The plasmoid is here so a second non-living boundary is not quietly mistaken for either of the others.
        </p>
      </div>
    </section>
  );
}
