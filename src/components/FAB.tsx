import { useState } from "react";
import { Plus, ShoppingCart, Receipt, X, Check, Lock, Loader2 } from "lucide-react";
import { useStore } from "../lib/store";
import { toast } from "sonner";
import { useNavigate, useLocation } from "@tanstack/react-router";

const despesasRapidas = [
  { icon: "💧", name: "Água" },
  { icon: "⚡", name: "Luz" },
  { icon: "🏠", name: "Aluguel" },
  { icon: "🛠️", name: "Manut. Xerox" },
  { icon: "📦", name: "Reposição Estoque" },
  { icon: "🍎", name: "Copa/Limpeza" },
];

export function FAB() {
  const [open, setOpen] = useState(false);
  const [modalType, setModalType] = useState<"venda" | "despesa" | null>(null);
  
  const { addExpense, addQuickSale } = useStore();
  const [desc, setDesc] = useState("");
  const [val, setVal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericValue = parseFloat(val.replace(",", "."));
    if (isNaN(numericValue) || numericValue <= 0) {
      toast.error("Por favor, insira um valor válido.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalType === "venda") {
        await addQuickSale(desc || "Vendas", numericValue);
        toast.success("Venda registrada com sucesso!");
      } else {
        await addExpense(desc, numericValue);
        toast.success("Despesa registrada com sucesso!");
      }

      setModalType(null);
      setDesc("");
      setVal("");
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (type: "venda" | "despesa") => {
    setModalType(type);
    setDesc(""); // Always start empty — user's input is the source of truth
    setVal("");
    setOpen(false);
  };

  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm transition-all" 
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {open && (
          <div className="flex flex-col items-end gap-3 animate-in slide-in-from-bottom-4">
            <button
              onClick={() => openModal("despesa")}
              className="group flex items-center gap-3 rounded-full bg-surface px-5 py-3.5 shadow-xl hover:bg-elevated border border-border/60 transition-all hover:scale-105 active:scale-95"
            >
              <span className="text-sm font-bold tracking-tight">Nova Despesa</span>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-white transition-colors">
                <Receipt className="h-5 w-5" />
              </div>
            </button>
            <button
              onClick={() => openModal("venda")}
              className="group flex items-center gap-3 rounded-full bg-surface px-5 py-3.5 shadow-xl hover:bg-elevated border border-border/60 transition-all hover:scale-105 active:scale-95"
            >
              <span className="text-sm font-bold tracking-tight">Nova Venda</span>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-aqua/10 text-aqua group-hover:bg-aqua group-hover:text-white transition-colors">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </button>
          </div>
        )}

        <button
          onClick={() => setOpen(!open)}
          className={`grid h-16 w-16 place-items-center rounded-full bg-gradient-to-tr from-electric via-electric to-aqua text-white shadow-[0_15px_40px_-10px] shadow-electric/50 transition-all duration-300 hover:scale-110 active:scale-90 ${open ? "rotate-45" : ""}`}
        >
          <Plus className={`h-8 w-8 transition-transform duration-300`} />
        </button>
      </div>

      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-[2.5rem] border border-border/40 bg-surface/80 p-8 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${modalType === 'venda' ? 'bg-aqua/10 text-aqua' : 'bg-destructive/10 text-destructive'}`}>
                  {modalType === 'venda' ? <ShoppingCart className="w-6 h-6" /> : <Receipt className="w-6 h-6" />}
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {modalType === 'venda' ? 'Registrar Venda' : 'Lançar Despesa'}
                </h2>
              </div>
              <button onClick={() => setModalType(null)} className="rounded-full p-2 hover:bg-elevated text-muted-foreground transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Descrição</label>
                <input 
                  required 
                  autoFocus
                  value={desc} 
                  onChange={e => setDesc(e.target.value)} 
                  className="w-full rounded-2xl border border-border/40 bg-elevated/50 px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-electric/50 transition-all" 
                  placeholder={modalType === 'venda' ? "Ex: impressões, canetas..." : "Ex: Papel A4, Internet..."} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Valor (R$)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">R$</span>
                  <input 
                    required 
                    value={val} 
                    onChange={e => setVal(e.target.value)} 
                    type="text" 
                    placeholder="0,00" 
                    className="w-full rounded-2xl border border-border/40 bg-elevated/50 pl-14 pr-5 py-4 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-electric/50 transition-all" 
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`mt-4 w-full rounded-2xl py-5 text-lg font-black text-white shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${modalType === 'venda' ? 'bg-aqua shadow-aqua/20' : 'bg-destructive shadow-destructive/20'}`}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Check className="w-6 h-6" /> 
                    {modalType === 'venda' ? 'Confirmar Venda' : 'Confirmar Saída'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
