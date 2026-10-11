import { Link, useSearchParams } from "react-router-dom";
import { PhotonJourney } from "@/photon/PhotonJourney";
import "./photon-instrument.css";

export default function PhotonJourneyPage() {
  const [params] = useSearchParams();
  const fromWorld = params.get("from") === "interactive-atlas";
  return (
    <div className="photon-instrument">
      {fromWorld ? (
        <Link to="/atlas/interactive" className="photon-world-return">
          Return to Interactive Atlas
        </Link>
      ) : null}
      <PhotonJourney />
    </div>
  );
}
