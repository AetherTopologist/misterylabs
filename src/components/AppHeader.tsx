import { Link, useLocation, useNavigate } from "react-router-dom";
import { Beaker, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickCreateDialog } from "./QuickCreateDialog";
import { useAuth } from "@/hooks/useAuth";

export function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const initial = user?.email?.[0]?.toUpperCase() ?? "?";

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
          {user && (
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/40 py-1 pl-1 pr-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/15 text-[11px] font-semibold text-primary">
                {initial}
              </span>
              <span className="hidden max-w-[140px] truncate text-xs text-muted-foreground sm:inline">
                {user.email}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleSignOut}
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
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
