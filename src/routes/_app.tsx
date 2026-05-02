import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar } from "../components/app-sidebar";
import { Topbar } from "../components/topbar";
import { FAB } from "../components/FAB";
import { motion } from "framer-motion";
import { PenLine } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animação de progresso idêntica ao design original
    const t = setInterval(() => setProgress((p) => Math.min(100, p + 4)), 50);

    const checkAuth = async () => {
      // Mantém o splash screen visível por um tempo mínimo para evitar "flashes"
      // e respeitar o desejo de visualização do carregamento original.
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const isLogged = sessionStorage.getItem("isLoggedIn");
      if (isLogged !== "true") {
        navigate({ to: "/login", replace: true });
      } else {
        setIsAuthenticated(true);
      }
      setIsAuthChecking(false);
    };

    checkAuth();
    return () => clearInterval(t);
  }, [navigate]);

  if (isAuthChecking) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden gradient-animated">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(15,23,42,0.7)_80%)]" />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-electric/30 blur-2xl animate-pulse-ring" />
            <div className="relative grid h-32 w-32 place-items-center rounded-full border border-white/10 bg-surface/40 backdrop-blur-xl card-inset">
              <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke="url(#g)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="draw-circle"
                />
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.2 250)" />
                    <stop offset="100%" stopColor="oklch(0.82 0.15 180)" />
                  </linearGradient>
                </defs>
              </svg>
              <PenLine className="h-12 w-12 text-electric drop-shadow-[0_0_20px_rgba(96,165,250,0.7)]" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-foreground glow-text">
              PapelariaPro
            </h1>
            <p className="mt-3 text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Gestão inteligente para sua papelaria
            </p>
          </div>
          <div className="h-1 w-56 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-electric to-aqua transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-electric/60 animate-pulse font-bold">
            Verificando Segurança
          </p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderiza nada da dashboard
  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground gradient-bg">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
      <FAB />
    </div>
  );
}