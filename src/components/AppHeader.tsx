import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, ExternalLink, Menu, X, Sun, Moon } from "lucide-react";

const BASE = import.meta.env.BASE_URL;
import { Button } from "@/components/ui/button";
import { QuickCreateDialog } from "./QuickCreateDialog";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

const NAV_LINKS = [
  { to: "/", label: "Home", exact: true },
  { to: "/atlas", label: "Atlas" },
  { to: "/observatory", label: "Observatory" },
  { to: "/archive", label: "Archive" },
  { to: "/media", label: "Media" },
] as const;

export function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const isActive = (to: string, exact: boolean) =>
    exact
      ? pathname === to
      : pathname.startsWith(to) || (to === "/mission" && pathname === "/dashboard");

  const initial = user?.email?.[0]?.toUpperCase() ?? "?";

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          {/* Logo — official xPRIMEray mark + MisterY Labs wordmark */}
          <Link to="/" className="group flex items-center gap-3" onClick={closeMobile}>
            <img
              src={`${BASE}assets/xPRIMEray_Logo_Official_256.png`}
              alt="xPRIMEray"
              className="h-8 w-auto opacity-90 transition-opacity group-hover:opacity-100 md:h-9"
            />
            <div className="hidden leading-none sm:block">
              <div className="text-sm font-bold tracking-tight">
                MisterY <span className="text-gradient">Labs</span>
              </div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Gateway Observatory
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <HeaderLink
                key={link.to}
                to={link.to}
                current={isActive(link.to, "exact" in link ? link.exact : false)}
              >
                {link.label}
              </HeaderLink>
            ))}
            <a
              href="https://xprimeray.github.io/GD_xPRIMEray/"
              target="_blank"
              rel="noreferrer"
              title="Curved Transport Observatory"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-base hover:bg-secondary/60 hover:text-foreground"
            >
              <img src={`${import.meta.env.BASE_URL}assets/xprimeray-icon.svg`} alt="" aria-hidden className="h-3.5 w-3.5 opacity-30" />
              xPRIMEray <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://github.com/AetherTopologist/GD_xPRIMEray"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-base hover:bg-secondary/60 hover:text-foreground"
            >
              GitHub <ExternalLink className="h-3 w-3" />
            </a>
          </nav>

          {/* Right side: auth + mobile toggle */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <QuickCreateDialog />
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
              </>
            ) : (
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground md:inline-flex"
              >
                <Link to="/auth">Sign in</Link>
              </Button>
            )}

            {/* Theme toggle */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark"
                ? <Sun className="h-4 w-4" />
                : <Moon className="h-4 w-4" />
              }
            </Button>

            {/* Hamburger — mobile only */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 md:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile nav panel */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-16 z-30 border-b border-border/60 bg-background/95 backdrop-blur-xl md:hidden">
          <nav className="container flex flex-col gap-px py-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMobile}
                className={
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-base " +
                  (isActive(link.to, "exact" in link ? link.exact : false)
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground")
                }
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://xprimeray.github.io/GD_xPRIMEray/"
              target="_blank"
              rel="noreferrer"
              onClick={closeMobile}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-base hover:bg-secondary/60 hover:text-foreground"
            >
              <img src={`${import.meta.env.BASE_URL}assets/xprimeray-icon.svg`} alt="" aria-hidden className="h-3.5 w-3.5 opacity-30" />
              xPRIMEray <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://github.com/AetherTopologist/GD_xPRIMEray"
              target="_blank"
              rel="noreferrer"
              onClick={closeMobile}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-base hover:bg-secondary/60 hover:text-foreground"
            >
              GitHub <ExternalLink className="h-3 w-3" />
            </a>
            {!user && (
              <Link
                to="/auth"
                onClick={closeMobile}
                className="mt-1 rounded-lg border border-border/50 px-3 py-2.5 text-center text-sm font-medium text-muted-foreground transition-base hover:bg-secondary/60 hover:text-foreground"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  );
}

function HeaderLink({
  to,
  current,
  children,
}: {
  to: string;
  current: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-base " +
        (current
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground")
      }
    >
      {children}
    </Link>
  );
}
