import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Beaker, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Auth() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [signingIn, setSigningIn] = useState(false);
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  if (!loading && session) {
    return <Navigate to={from} replace />;
  }

  const handleGitHub = async () => {
    setSigningIn(true);
    // Redirect back to SPA root — GitHub Pages always serves it, no 404 risk.
    // Supabase detectSessionInUrl picks up the ?code= param wherever we land.
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo },
    });
    if (error) {
      toast.error("Sign-in failed", { description: error.message });
      setSigningIn(false);
    }
    // On success the browser navigates away; no cleanup needed.
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo + title */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow shadow-glow">
            <Beaker className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary-foreground/20" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              MisterY <span className="text-gradient">Labs</span>
            </h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Observatory · Sign in
            </p>
          </div>
        </div>

        <Card className="border-border/60">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Sign in to edit</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Required for Mission Control, adding evidence, and running repository scans.
              The public observatory is always open without an account.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* GitHub — primary, direct Supabase OAuth */}
            <Button
              onClick={handleGitHub}
              disabled={signingIn || loading}
              className="w-full bg-[#24292e] text-white hover:bg-[#2f3439] border-0"
              size="lg"
            >
              <GitHubIcon className="mr-2 h-4 w-4 shrink-0" />
              {signingIn ? "Redirecting…" : "Continue with GitHub"}
            </Button>

            {/* Google — disabled, coming soon */}
            <div className="relative">
              <Button
                disabled
                variant="outline"
                className="w-full border-border/40 bg-white/5 text-muted-foreground/50 cursor-not-allowed"
                size="lg"
              >
                <GoogleIcon className="mr-2 h-4 w-4 shrink-0 opacity-40" />
                Continue with Google
              </Button>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-border/50 bg-muted px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">
                Soon
              </span>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-border/50 bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
              <p>
                GitHub tokens are never stored in the browser — repository scans run server-side
                and require an authenticated session.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
