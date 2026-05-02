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

  useEffect(() => {
    const checkAuth = async () => {
      // Simulate validation delay for the splash screen
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const isLogged = sessionStorage.getItem("isLoggedIn");
      if (isLogged !== "true") {
        navigate({ to: "/login", replace: true });
      } else {
        setIsAuthenticated(true);
      }
      setIsAuthChecking(false);
    };

    checkAuth();
  }, [navigate]);

  if (isAuthChecking) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background text-foreground gradient-bg">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-electric/20 border border-electric/30 backdrop-blur-xl shadow-[0_0_40px_rgba(124,58,237,0.3)]">
            <PenLine className="h-12 w-12 text-electric" />
            <motion.div 
              className="absolute inset-0 rounded-3xl border-2 border-electric"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ borderTopColor: "transparent", borderRightColor: "transparent" }}
            />
          </div>
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">Papelaria<span className="text-electric">Pro</span></h1>
            <p className="text-sm text-muted-foreground animate-pulse">Verificando segurança...</p>
          </div>
        </motion.div>
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