import { Link, useSearchParams } from "react-router-dom";
import { H0Instrument } from "../../../baselines/ride-map-thought-path/hydrogen/ui/H0Instrument";
import "./hydrogen-instrument.css";

export default function HydrogenPage() {
  const [params] = useSearchParams();
  const fromWorld = params.get("from") === "interactive-atlas";
  return (
    <div className="hydrogen-instrument">
      {fromWorld ? (
        <Link to="/atlas/interactive" className="hydrogen-world-return">
          Return to Interactive Atlas
        </Link>
      ) : null}
      <H0Instrument />
    </div>
  );
}
