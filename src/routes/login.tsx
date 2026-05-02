import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Eye, EyeOff, LogIn, PenLine } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const isLogged = localStorage.getItem("isLoggedIn");
    if (isLogged === "true") {
      navigate({ to: "/dashboard" });
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate delay
    setTimeout(() => {
      if (username === "admin" && password === "papelaria123") {
        localStorage.setItem("isLoggedIn", "true");
        toast.success("Bem-vindo de volta! 👋");
        // Force redirect to ensure layout reads the session correctly
        window.location.href = "/dashboard";
      } else {
        toast.error("Usuário ou senha incorretos! ❌", {
          className: "bg-destructive text-white border-none",
        });
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden gradient-animated">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(15,23,42,0.7)_80%)]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-8"
      >
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-electric/20 border border-electric/30 backdrop-blur-xl">
            <PenLine className="h-8 w-8 text-electric" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Acesso ao Sistema</h1>
          <p className="text-sm text-muted-foreground mt-2">Entre com suas credenciais</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 rounded-3xl border border-white/10 bg-surface/30 p-8 backdrop-blur-2xl card-inset shadow-2xl">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground ml-1 flex items-center gap-2">
              <User className="h-3.5 w-3.5" /> Usuário
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-4 pr-4 text-white outline-none focus:border-electric/50 focus:bg-white/10 transition-all"
                placeholder="Digite seu usuário"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground ml-1 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" /> Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-4 pr-12 text-white outline-none focus:border-electric/50 focus:bg-white/10 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-electric py-4 text-sm font-bold text-white shadow-lg shadow-electric/30 hover:bg-electric/90 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <LogIn className="h-4 w-4" /> Entrar
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
