import { useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL;

function currentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  const root = document.documentElement;
  if (root.classList.contains("light")) return "light";
  if (root.classList.contains("dark")) return "dark";
  const stored = localStorage.getItem("myl-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/**
 * Still of the Interactive Atlas Cenotaph.
 * Same GLB, same stone shader. Not a second scene.
 * Follows the html theme class the header already toggles.
 */
export function CenotaphMark() {
  const [theme, setTheme] = useState<"light" | "dark">(currentTheme);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setTheme(currentTheme());
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const src = `${BASE}assets/cenotaph/portrait-${theme}.webp`;
  return <img className="wf-cenotaph" src={src} alt="" width={1400} height={1600} decoding="async" />;
}
