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
            <h2 id="wf-instruments" className="wf-kicker">
              Open instruments
            </h2>
            <ol>
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
              The Dimensional Pavilion is one collection: cube unfolding, tesseract projection,
              hollow mask, spinning dancer, and{" "}
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
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
