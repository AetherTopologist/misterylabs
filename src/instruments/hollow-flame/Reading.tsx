import { useEffect, useState } from "react";
import { flameNodes } from "@/instruments/hollow-flame/tree/graph.ts";
import { subscribeTreeFocus } from "@/instruments/hollow-flame/tree/focus.ts";
import { SOURCES } from "@/instruments/hollow-flame/tree/sources.ts";
import { userSetSubject } from "@/instruments/hollow-flame/sim";

export function Reading() {
  const [focus, setFocus] = useState("hollow-flame");
  useEffect(() => subscribeTreeFocus(setFocus), []);
  const node = flameNodes.find((item) => item.id === focus) ?? null;

  return (
    <section id="reading" className="scroll-mt-20 border-t border-line px-4 py-10">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header>
          <p className="font-mono text-xs tracking-widest text-ember uppercase">Reading</p>
          <h2 className="pt-2 font-display text-3xl text-paper sm:text-4xl">What maintains a form at all?</h2>
          <p className="pt-3 text-dust">
            A hollow system is not necessarily an empty system. Its interior, boundary, and exterior may form a continuously maintained physical organization. The flame is the experimentally grounded starting point. Plasmoids, cells, hollow materials, and atoms are comparisons, and their physics stays different.
          </p>
        </header>

        {node && node.id !== "hollow-flame" ? (
          <aside className="border border-line bg-surface p-4">
            <p className="font-mono text-xs tracking-widest text-ember uppercase">On the path</p>
            <h3 className="pt-1 font-display text-2xl text-paper">{node.title}</h3>
            <p className="pt-2 text-dust">{node.claim}</p>
            <a href="#tree" className="mt-2 inline-flex min-h-11 items-center font-mono text-xs tracking-widest text-ember uppercase">
              Back to the thought path
            </a>
          </aside>
        ) : null}

        <article className="flex flex-col gap-3">
          <h3 className="font-mono text-xs tracking-widest text-ember uppercase">Observed</h3>
          <p>
            Michael Faraday’s <em>Chemical History of a Candle</em> (1861) is still the clearest account. The dark center is unburned vapor. The yellow light is incandescent soot, not a photograph of the reaction. A blue region near the wick is hotter, cleaner combustion. This is a diffusion flame. It has no membrane.
          </p>
          <p className="text-dust">
            Burke and Schumann (1928) made that meeting place a transport problem: a sheet where fuel and oxidizer arrive in proportion. Extinction still has ordinary names. Starvation: not enough fuel. Quenching: not enough oxygen, or a surface that steals heat. Blow-off: flow that sweeps the reaction away faster than it can propagate. Blow across a candle hard enough and the sheet tears. It does not remember how to rebuild itself unless the same conditions are still there to relight.
          </p>
        </article>

        <article className="flex flex-col gap-3">
          <h3 className="font-mono text-xs tracking-widest text-ember uppercase">This simulation</h3>
          <p>
            Prometheus is not a fluid solver. There is no Navier–Stokes integration, no soot chemistry, and no radiation transport. An algebraic rate — fuel times oxygen, reduced by starvation, choke, and crossflow — drives a kinematic envelope. The motes illustrate transport. They are not streamlines. The temperatures are a teaching scale.
          </p>
          <p className="text-dust">
            The diffusion flux J = −D ∇c and the species balance ∂c/∂t + ∇·(cu) = −∇·J + R are the language of that picture. They are not what the ride numerically solves. The four views exist because the luminous flame is a poor map of where chemistry happens. Heat shows a broader field with a cooler core. Reaction shows the sheet. Section cuts that model on the axis. Orbit overhead in luminous view and the shell becomes a ring.
          </p>
        </article>

        <article className="flex flex-col gap-3">
          <h3 className="font-mono text-xs tracking-widest text-ember uppercase">Not a claim of life</h3>
          <p>
            Michael Levin’s bioelectric papers ask how non-neural tissues store anatomical information. The 2023 essay on bioelectric networks and the 2024 essay on the multiscale wisdom of the body are about living tissue. The 2022 TAME essay names basal cognition as problem-solving below the level of brains. Those claims are not observations of a flame.
          </p>
          <p className="text-dust">
            A flame maintains a boundary. It does not store a target form, correct toward an anatomical setpoint, or pass a pattern onward. When the gradients collapse, the organization is gone. That gap is the comparison. It is not evidence that combustion is cognition, and it is not a reason to call a flame alive.
          </p>
        </article>

        <article className="flex flex-col gap-3">
          <h3 className="font-mono text-xs tracking-widest text-ember uppercase">Why a plasmoid is on the bench</h3>
          <p>
            A plasmoid is not a flame with the colors changed. Ordinary flames are mostly neutral gas, organized by chemistry and buoyancy. A plasmoid is electrically conducting. Laboratory and space double layers — thin charge separations, in the record of Newman and coauthors (2001) — are electromagnetic boundaries with a potential drop. Confinement can be magnetic.
          </p>
          <p className="text-dust">
            Reports of ball lightning and similar atmospheric lights are observationally unsettled. This instrument does not model them. The plasmoid is a schematic so that “a bright self-contained ball” is not mistaken for combustion. An electrically driven plasma that melts steel is a different mechanism again.
          </p>
        </article>

        <article className="flex flex-col gap-3">
          <h3 className="font-mono text-xs tracking-widest text-ember uppercase">Hollow materials</h3>
          <p>
            Flame-spray and aerosol routes can freeze a hollow metal-oxide particle. Jossen and coauthors (2005) give criteria for shell-like oxides. Gürmen and Ebin (2010) report hollow iron-oxide spheres. Those are solids. They do not prove a monopole, a transmutation, or that a candle flame and a microsphere are the same kind of object.
          </p>
          <p className="text-dust">
            Speculative talks that point at hollow spheres stay in the frontier. They are allowed to resonate with other branches. They are not allowed to derive the trunk.
          </p>
        </article>

        <article className="flex flex-col gap-3">
          <h3 className="font-mono text-xs tracking-widest text-ember uppercase">Hollow manifold</h3>
          <p>
            The manifold draws the three systems with one convention: a boundary, a maintained gradient, an inside and an outside. Shared drawing is not a shared mechanism. The flame’s gradient is chemical and thermal, and it is open at the top. The plasmoid’s is electromagnetic. The cell’s is ionic and metabolic, wrapped in a membrane that is repaired, and coupled to information that outlives any single reaction.
          </p>
          <button
            type="button"
            className="mt-1 min-h-11 self-start border border-ember px-4 font-mono text-xs tracking-widest text-ember uppercase"
            onClick={() => {
              userSetSubject("manifold");
              document.getElementById("instrument")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            Open the hollow manifold
          </button>
        </article>

        <footer className="border-t border-line pt-6 text-sm text-dust">
          <p className="font-mono text-xs tracking-widest text-paper uppercase">Sources</p>
          <ul className="mt-3 flex flex-col gap-3">
            {SOURCES.map((item) => (
              <li key={item.id}>
                <a className="text-paper underline decoration-ember/50 underline-offset-4" href={item.url} target="_blank" rel="noreferrer">
                  {item.authors}
                  {item.year ? ` (${item.year})` : ""}. {item.title}
                </a>
                <span className="mt-1 block font-mono text-xs tracking-widest text-dust uppercase">{item.category} · {item.topic}</span>
              </li>
            ))}
          </ul>
          <p className="pt-4 font-mono text-xs tracking-widest text-dust uppercase">MISTERY LABS · Higher-Dimensional Observatory · HF–02 · Prometheus</p>
        </footer>
      </div>
    </section>
  );
}
