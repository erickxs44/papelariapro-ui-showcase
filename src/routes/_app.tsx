import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar } from "../components/app-sidebar";
import { Topbar } from "../components/topbar";
import { FAB } from "../components/FAB";
import { PenLine, AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Per-route error boundary — catches crashes inside child pages (PDV, Estoque, etc.)
 * and shows a discrete inline message INSTEAD of nuking the entire screen.
 */
function InlineErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center gap-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
        <AlertTriangle className="h-8 w-8 text-amber-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Ops, algo deu errado nesta aba</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Essa seção encontrou um erro, mas o restante do sistema continua funcionando. Tente recarregar a aba ou volte ao Dashboard.
        </p>
        {import.meta.env.DEV && error?.message && (
          <pre className="mt-4 max-h-32 overflow-auto rounded-xl bg-muted p-3 text-left font-mono text-xs text-destructive mx-auto max-w-lg">
            {error.message}
          </pre>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => { try { reset(); } catch { window.location.reload(); } }}
          className="inline-flex items-center gap-2 rounded-2xl bg-electric px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-electric/30 transition hover:bg-electric/90"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-surface px-5 py-2.5 text-sm font-bold text-foreground transition hover:bg-elevated"
        >
          Ir ao Dashboard
        </a>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_app")({
  component: AppLayout,
  errorComponent: InlineErrorFallback,
});

function AppLayout() {
  const [status, setStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check auth synchronously first to avoid flashing
    const isLogged = sessionStorage.getItem("isLoggedIn");
    
    if (isLogged === "true") {
      // User is logged in — show a quick branded splash, then proceed
      const t = setInterval(() => setProgress((p) => Math.min(100, p + 5)), 40);
      const timer = setTimeout(() => {
        setStatus("authenticated");
        clearInterval(t);
      }, 800);

      // SAFETY: Hard timeout — never freeze on splash screen for more than 3s
      const safetyTimer = setTimeout(() => {
        setStatus((prev) => prev === "checking" ? "authenticated" : prev);
        clearInterval(t);
      }, 3000);

      return () => { clearInterval(t); clearTimeout(timer); clearTimeout(safetyTimer); };
    } else {
      // Not logged in — redirect immediately via hard navigation
      // Using window.location prevents React unmounting crashes
      window.location.replace("/login");
      setStatus("unauthenticated");
    }
  }, []);

  // While checking or unauthenticated, show splash screen
  if (status !== "authenticated") {
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