import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PenLine } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setProgress((p) => Math.min(100, p + 4)), 80);
    
    const nav = setTimeout(() => {
      const isLogged = sessionStorage.getItem("isLoggedIn");
      if (isLogged === "true") {
        navigate({ to: "/dashboard" });
      } else {
        navigate({ to: "/login" });
      }
    }, 2400);

    return () => {
      clearInterval(t);
      clearTimeout(nav);
    };
  }, [navigate]);

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
      </div>
    </div>
  );
}
