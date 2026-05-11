import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Beaker, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export default function Auth() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [signingIn, setSigningIn] = useState(false);
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  if (!loading && session) {
    return <Navigate to={from} replace />;
  }

  const handleGoogle = async () => {
    setSigningIn(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Sign-in failed", { description: result.error.message });
      setSigningIn(false);
      return;
    }
    if (result.redirected) {
      // browser is navigating to Google
      return;
    }
    // tokens received, AuthProvider listener will pick up the session
    setSigningIn(false);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow shadow-glow">
            <Beaker className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary-foreground/20" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              xPRIME <span className="text-gradient">Lab</span>
            </h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Mission control · Sign in
            </p>
          </div>
        </div>

        <Card className="border-border/60">
          <CardHeader className="space-y-1.5">
            <CardTitle className="text-lg">Sign in to edit</CardTitle>
            <CardDescription className="text-xs">
              Sign in to access Mission Control, add evidence, and run GitHub repository scans.
              The public observatory is always open without an account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogle}
              disabled={signingIn || loading}
              className="w-full"
              size="lg"
            >
              <GoogleIcon className="mr-2 h-4 w-4" />
              {signingIn ? "Redirecting…" : "Continue with Google"}
            </Button>

            <div className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/30 p-3 text-[11px] text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary-glow" />
              <p>
                Your GitHub token is never exposed to the browser — repository scans run server-side
                and require an authenticated session.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.07-1.1-.16-1.6H12z"
      />
    </svg>
  );
}
