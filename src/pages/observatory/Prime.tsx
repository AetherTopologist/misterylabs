import { useSearchParams } from "react-router-dom";
import { PrimeRide } from "@/instruments/prime/PrimeRide";

export default function PrimePage() {
  const [params] = useSearchParams();
  const fromWorld = params.get("from") === "interactive-atlas";
  return <PrimeRide fromWorld={fromWorld} />;
}
