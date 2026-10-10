import { useTheme } from "@/hooks/useTheme";

const BASE = import.meta.env.BASE_URL;

/**
 * Still of the Interactive Atlas Cenotaph.
 * Same GLB, same stone shader. Not a second scene.
 */
export function CenotaphMark() {
  const { theme } = useTheme();
  const src = `${BASE}assets/cenotaph/portrait-${theme === "light" ? "light" : "dark"}.webp`;
  return <img className="wf-cenotaph" src={src} alt="" width={1400} height={1600} decoding="async" />;
}
