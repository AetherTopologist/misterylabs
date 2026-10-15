import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CenotaphMark } from "@/components/home/CenotaphMark";
import "./home-threshold.css";

const DOORS = [
  {
    n: "01",
    name: "Hydrogen",
    q: "Why doesn’t it collapse?",
    to: "/observatory/hydrogen",
  },
  {
    n: "02",
    name: "Apple of the Eye",
    q: "Where does the ray actually go?",
    to: "/observatory/polar-grin",
  },
  {
    n: "03",
    name: "Triad",
    q: "What would this maneuver demand?",
    to: "/observatory/triad",
  },
  {
    n: "04",
    name: "Dimensional Pavilion",
    q: "What changes when we change dimensions?",
    to: "/observatory/higher-dimensional",
  },
  {
    n: "05",
    name: "Photon Journey",
    q: "Why can a phone photograph the Moon?",
    to: "/observatory/photon-journey",
  },
] as const;

const Index = () => {
  return (
    <div className="wf-threshold min-h-screen">
      <AppHeader />
      <main>
        <section className="wf-stage" aria-label="Threshold">
          <div className="wf-scene">
            <CenotaphMark />
          </div>
          <div className="wf-copy">
            <p className="wf-kicker">Newton’s Cenotaph</p>
            <h1 className="wf-title">There is always another why.</h1>
            <p className="wf-secondary">Change one thing. Look again.</p>
            <Link className="wf-enter" to="/atlas/interactive">
              Enter the Atlas
            </Link>
          </div>
        </section>

        <section className="wf-register" aria-labelledby="wf-instruments">
          <div className="container">
            <p className="wf-founding">
              We don’t build monuments to what we know. We build instruments for what we don’t yet
              understand.
            </p>
            <p className="wf-invite">
              Wonder comes before explanation. A world can feel complete while the evidence is not.
              Step inside a question, change it, and find where a worldview stops working.
            </p>
            <p className="wf-progress">
              <span className="sr-only">Wonder, observe, model, interpret, question again.</span>
              <span aria-hidden="true">
                Wonder → Observe → Model → Interpret → Question again
              </span>
            </p>
            <ol className="wf-layers">
              <li>
                <span>Observation</span>
                <span>What is actually measured.</span>
              </li>
              <li>
                <span>Model</span>
                <span>A representation, and the assumptions it makes.</span>
              </li>
              <li>
                <span>Interpretation</span>
                <span>A meaning drawn from the model.</span>
              </li>
              <li>
                <span>Open question</span>
                <span>What is still untested, or only imagined.</span>
              </li>
            </ol>
            <p className="wf-humility">
              An observation is not an explanation. A model is not the world. An analogy is not
              evidence.
            </p>
            <h2 id="wf-instruments" className="wf-kicker">
              Open instruments
            </h2>
            <ol className="wf-doors">
              {DOORS.map((door) => (
                <li key={door.to}>
                  <Link className="wf-door" to={door.to}>
                    <span className="wf-num">{door.n}</span>
                    <span className="wf-name">{door.name}</span>
                    <span className="wf-q">{door.q}</span>
                  </Link>
                </li>
              ))}
            </ol>
            <p className="wf-rooms">
              The Dimensional Pavilion keeps the original instruments and adds three rides:{" "}
              <Link to="/observatory/higher-dimensional/hollow-genius">Hollow Genius</Link>,{" "}
              <Link to="/observatory/higher-dimensional/ambiguous-dancer">Ambiguous Dancer</Link>, and{" "}
              <Link to="/observatory/higher-dimensional/inside-out">Inside-Out Universe</Link>,
              plus{" "}
              <Link to="/observatory/quaternion">quaternion rotation</Link>.
            </p>
            <p className="wf-satellite">
              <Link to="/observatory/poisson-dot">
                <span className="wf-kicker">Satellite</span>
                <span>Poisson’s Dot</span>
              </Link>
            </p>
            <p className="wf-horizon">On the horizon, not yet open — Bell and xPRIMEray.</p>
            <p className="wf-note">Atmosphere is not evidence.</p>
            <p className="wf-close">
              How much of what we experience is the world itself, and how much is the model through
              which we perceive it?
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
