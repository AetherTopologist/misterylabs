import { Link } from "react-router-dom";

interface DemoNavProps {
  next?: { label: string; to: string };
}

export function DemoNav({ next }: DemoNavProps) {
  return (
    <nav
      aria-label="Instrument navigation"
      className="flex items-center justify-between border-b border-border/40 px-5 py-2.5"
    >
      <Link
        to="/atlas"
        className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/70 transition-colors hover:text-muted-foreground"
      >
        ← Back to Atlas
      </Link>
      {next && (
        <Link
          to={next.to}
          className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/70 transition-colors hover:text-muted-foreground"
        >
          {next.label} →
        </Link>
      )}
    </nav>
  );
}
