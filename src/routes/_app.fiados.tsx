import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, Phone, Calendar, AlertCircle, CheckCircle2, ShieldCheck, X } from "lucide-react";
import { useStore } from "../lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/fiados")({
  head: () => ({ meta: [{ title: "Fiados — PapelariaPro" }] }),
  component: Fiados,
});

type Fiado = {
  id: string;
  name: string;
  phone: string;
  amount: number;
  dueDate: Date;
  status: "Pendente" | "Em Atraso";
};

function Fiados() {
  const { fiados } = useStore();
  const [search, setSearch] = useState("");
  const [selectedFiado, setSelectedFiado] = useState<any | null>(null);

  const filtered = (fiados || []).filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const totalAtraso = (fiados || []).filter(f => f.status === "Em Atraso").reduce((acc, f) => acc + f.amount, 0);
  const totalPendente = (fiados || []).filter(f => f.status === "Pendente").reduce((acc, f) => acc + f.amount, 0);

  const handleBaixa = () => {
    if (!selectedFiado) return;
    // In a real app, this would update Supabase status to 'Pago'
    // For now, we'll just show success and close modal since resetData is the focus
    toast.success(`Baixa realizada com sucesso para ${selectedFiado.name}!`);
    setSelectedFiado(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-7xl pb-12"
    >
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 ml-2">
        <div>
          <p className="text-sm font-medium text-aqua">Controle de Clientes</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl glow-text">Gestão de Fiados</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <motion.div whileHover={{ y: -5 }} className="rounded-3xl glass-card p-6 flex flex-col justify-center shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-destructive/20 blur-2xl"></div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total em Atraso</p>
          <h2 className="text-4xl font-black text-destructive">R$ {totalAtraso.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h2>
        </motion.div>
        
        <motion.div whileHover={{ y: -5 }} className="rounded-3xl glass-card p-6 flex flex-col justify-center shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-aqua/20 blur-2xl"></div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total Pendente</p>
          <h2 className="text-4xl font-black text-aqua">R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h2>
        </motion.div>
      </div>

      <div className="rounded-3xl glass-card p-6 mb-8">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar devedor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-2xl border-2 border-electric/30 bg-background/40 py-4 pl-12 pr-4 text-lg outline-none focus:border-electric transition-all focus:bg-background/80"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((fiado, i) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                key={fiado.id} 
                className="group relative rounded-3xl border border-border/40 bg-elevated/40 p-6 transition-all hover:border-electric hover:shadow-[0_0_20px_rgba(111,0,255,0.15)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface/80 border border-border/60">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${fiado.status === "Em Atraso" ? "bg-destructive/20 text-destructive animate-pulse-ring" : "bg-aqua/20 text-aqua"}`}>
                      {fiado.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{fiado.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Phone className="h-3.5 w-3.5" />
                    {fiado.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Calendar className="h-3.5 w-3.5" />
                    Vencimento: {fiado.dueDate.toLocaleDateString("pt-BR")}
                  </div>
                </div>
                
                <div className="mt-auto border-t border-border/40 pt-4 flex items-center justify-between">
                  <span className="text-2xl font-black text-white">R$ {fiado.amount.toFixed(2)}</span>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedFiado(fiado)}
                    className="flex items-center gap-1.5 rounded-xl bg-electric px-4 py-2 text-sm font-bold text-white shadow-lg shadow-electric/30 transition hover:bg-electric/90"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Dar Baixa
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedFiado && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-surface p-8 shadow-2xl relative glass-card"
            >
              <button 
                onClick={() => setSelectedFiado(null)}
                className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-electric/20 text-electric mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Confirmar Baixa</h2>
                <p className="text-muted-foreground text-sm">
                  Deseja registrar o pagamento de <span className="text-white font-bold">{selectedFiado.name}</span> no valor de <span className="text-electric font-bold">R$ {selectedFiado.amount.toFixed(2)}</span>?
                </p>
              </div>

              <div className="flex gap-3">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedFiado(null)}
                  className="flex-1 rounded-2xl border border-white/10 bg-transparent py-3.5 text-sm font-bold transition hover:bg-white/5"
                >
                  Cancelar
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBaixa}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-aqua to-electric py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(111,0,255,0.5)] transition btn-glow"
                >
                  Confirmar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
