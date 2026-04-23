import { Link, useLocation } from "react-router-dom";
import { Beaker } from "lucide-react";
import { QuickCreateDialog } from "./QuickCreateDialog";

export function AppHeader() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-glow">
            <Beaker className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.5} />
            <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-primary-foreground/20" />
          </span>
          <div className="leading-none">
            <div className="text-sm font-bold tracking-tight">
              xPRIME <span className="text-gradient">Lab</span>
            </div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Mission control
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <HeaderLink to="/" current={pathname === "/"}>Dashboard</HeaderLink>
        </nav>

        <div className="flex items-center gap-2">
          <QuickCreateDialog />
        </div>
      </div>
    </header>
  );
}

function HeaderLink({ to, current, children }: { to: string; current: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-base " +
        (current ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground")
      }
    >
      {children}
    </Link>
  );
}
