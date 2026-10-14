import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DemoNav } from "@/components/observatory/DemoNav";
import { ResonanceModule } from "@/components/field-resonance/resonance-module";
import "./field-resonance.css";

export default function FieldResonancePage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <DemoNav next={{ label: "Observatory", to: "/observatory" }} />
      <section className="field-resonance border-t border-fr-rule bg-fr-ink text-fr-paper">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <header className="mb-5 max-w-2xl">
            <p className="font-mono text-xs tracking-widest text-fr-copper uppercase">
              NASA-TM-80961 · JSC-16073 · August 1979
            </p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight text-fr-paper sm:text-4xl">
              Field resonance
            </h1>
            <p className="mt-2 text-base text-fr-mute">
              One module of Alan Holt’s memo. Opposing fields merge, the merge site snaps
              from side to side, and a matched harmonic relocates the vehicle without a trajectory.
            </p>
            <p className="mt-2 font-mono text-xs text-fr-mute">
              Schematic of Holt, NASA-TM-80961 (1979). Not an MHD solver.
            </p>
          </header>

          <ResonanceModule />

          <section className="mt-10 grid gap-8 border-t border-fr-rule pt-8 lg:grid-cols-2">
            <div>
              <h2 className="text-lg font-medium text-fr-paper">What the snap is</h2>
              <p className="mt-2 text-sm leading-relaxed text-fr-mute">
                Ashton Forbes says “mega Gauss,” not a gas. He is reading Holt’s line that a
                craft would generate megagauss fields pointed against each other. Those lines
                break and reconnect. That snap is magnetic reconnection — Holt’s name for it
                is field-line merging, his Figure 1, the Petschek picture with slow shocks.
              </p>
              <blockquote className="mt-4 border-l-2 border-fr-copper pl-4 text-sm text-fr-paper">
                “These oppositely directed field lines will merge and re-connect expelling
                magnetic fields and plasma out to the sides.”
              </blockquote>
              <blockquote className="mt-3 border-l-2 border-fr-snap pl-4 text-sm text-fr-paper">
                “By alternately pulsing adjacent laser sets, the location of the merging
                processes can be made to oscillate back and forth at a desired rate.”
              </blockquote>
              <p className="mt-3 font-mono text-xs text-fr-mute">
                B = B₀ (y, ε x), null walked by x → x − A sin(2π f t). Teaching scale. Not an MHD code.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-medium text-fr-paper">Paper, then the orbs</h2>
              <ol className="mt-3 space-y-3 text-sm leading-relaxed text-fr-mute">
                <li>
                  <span className="text-fr-paper">1 · Merge. </span>
                  Antiparallel field. Geometry matters more than raw strength — Holt’s point
                  about flares at 2–3 thousand gauss. One megagauss is 1,000 kilogauss, about
                  330–500 times a 2–3 kG sunspot field, not a million times. The craft in the
                  memo is the megagauss case.
                </li>
                <li>
                  <span className="text-fr-paper">2 · Reconnect. </span>
                  The lines break, join the other way, and throw plasma and field out the sides. ε opens. That is the snap.
                </li>
                <li>
                  <span className="text-fr-paper">3 · Pulse. </span>
                  Lasers make the megagauss field (he cites the ∇T × ∇n work). Alternate adjacent sets and the merge walks. Power, wavelength, and pulse rate tune the waveform to a distant point’s harmonic.
                </li>
                <li>
                  <span className="text-fr-paper">4 · Relocate. </span>
                  Holt’s conjecture, not a result: a matched pattern is out of harmony with the local projection, and the vehicle is put at the distant point. It is not flown there. His foreword says the work was private and unofficial, and that NASA is not involved in UFO research.
                </li>
              </ol>
              <p className="mt-4 text-sm leading-relaxed text-fr-mute">
                Forbes maps the glowing spheres onto step 3. Spinning them stands in for the alternating lasers. The fourth sphere, he says, decides where the body ends up — the outer marker on the orb setting. The frozen pattern and the enhanced Casimir boundary are his ending. They are not in TM-80961.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-fr-mute">
                Solar flare is Holt’s observed 2–3 kG case. Magnetopause and harmonics VII, XII, and XVIII are teaching marks on the same dial, not measured destinations.
              </p>
            </div>
          </section>

          <footer className="mt-8 space-y-4 border-t border-fr-rule pt-6 font-mono text-xs leading-relaxed text-fr-mute">
            <p>
              <span className="text-fr-copper">Primary source. </span>
              A. C. Holt, Field Resonance Propulsion Concept, NASA Technical Memorandum
              NASA-TM-80961 / JSC-16073, August 1979.{" "}
              <a
                className="text-fr-copper underline decoration-fr-rule underline-offset-2"
                href="https://ntrs.nasa.gov/citations/19800010907"
              >
                NTRS 19800010907
              </a>
              . Presented at the AIAA/SAE/ASME 15th Joint Propulsion Conference, session
              “Propulsion Concepts for Galactic Spacecraft.” Speculative, unofficial research.
              NASA is not a UFO program.
            </p>
            <p>
              <span className="text-fr-snap">Contemporary interpretation. </span>
              Ashton Forbes, “The Orbs Are Mega Gauss Fusion Reactors, Here Is the Proof.”{" "}
              <a
                className="text-fr-copper underline decoration-fr-rule underline-offset-2"
                href="https://www.youtube.com/watch?v=a6iiVE8HY6I"
              >
                youtu.be/a6iiVE8HY6I
              </a>
              . A later cultural reading of the memo. Not equivalent evidence. The orbs,
              the fourth-sphere destination, and the Casimir collapse are his, not Holt’s.
            </p>
          </footer>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
