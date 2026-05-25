import { useState, useEffect } from "react";

export type Theme = "dark" | "light";

// Reads from localStorage then system preference, with dark as fallback.
// Applies the active theme class to <html> on every change.
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem("myl-theme") as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    // Ensure dark is explicitly set when not light (the CSS already defaults dark,
    // but being explicit prevents any flash when toggling back)
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("myl-theme", theme);
  }, [theme]);

  const toggle = () => setTheme(t => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}
