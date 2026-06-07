import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Atlas from "./pages/Atlas.tsx";
import Archive from "./pages/Archive.tsx";
import Research from "./pages/Research.tsx";
import Media from "./pages/Media.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Observatory from "./pages/Observatory.tsx";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/RequireAuth";

// Reads the sessionStorage destination written by Auth.tsx before the OAuth
// redirect and navigates there once a session is detected on return.
function AuthRedirectHandler() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && session) {
      const to = sessionStorage.getItem("auth:redirect_after");
      if (to) {
        sessionStorage.removeItem("auth:redirect_after");
        navigate(to, { replace: true });
      }
    }
  }, [loading, session, navigate]);
  return null;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/misterylabs">
        <AuthProvider>
          <AuthRedirectHandler />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Index />} />
            <Route path="/atlas" element={<Atlas />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/research" element={<Research />} />
            <Route path="/media" element={<Media />} />
            <Route path="/observatory" element={<Observatory />} />
            {/* /mission and /dashboard both render Mission Control */}
            <Route path="/mission" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/projects/:id" element={<RequireAuth><ProjectDetail /></RequireAuth>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
