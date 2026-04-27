import { useState } from "react";
import { Plus, ShoppingCart, Receipt, X, Check } from "lucide-react";
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
  const [modalOpen, setModalOpen] = useState(false);
  
  const { addExpense } = useStore();
  const [desc, setDesc] = useState("");
  const [val, setVal] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleDespesa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !val) return;
    addExpense(desc, parseFloat(val.replace(",", ".")));
    toast.success("Despesa registrada com sucesso!");
    setModalOpen(false);
    setDesc("");
    setVal("");
    setOpen(false);
  };

  const novaVenda = () => {
    setOpen(false);
    if (location.pathname !== "/pdv") {
      navigate({ to: "/pdv" });
    }
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
              onClick={() => { setModalOpen(true); setOpen(false); }}
              className="flex items-center gap-3 rounded-full bg-surface px-4 py-3 shadow-xl hover:bg-elevated border border-border/60"
            >
              <span className="text-sm font-semibold">Registrar Despesa</span>
              <div className="grid h-8 w-8 place-items-center rounded-full bg-destructive/10 text-destructive">
                <Receipt className="h-4 w-4" />
              </div>
            </button>
            <button
              onClick={novaVenda}
              className="flex items-center gap-3 rounded-full bg-surface px-4 py-3 shadow-xl hover:bg-elevated border border-border/60"
            >
              <span className="text-sm font-semibold">Nova Venda</span>
              <div className="grid h-8 w-8 place-items-center rounded-full bg-aqua/10 text-aqua">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </button>
          </div>
        )}

        <button
          onClick={() => setOpen(!open)}
          className={`grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r from-electric to-aqua text-white shadow-[0_10px_30px_-10px] shadow-electric/60 transition-transform hover:scale-105 ${open ? "rotate-45" : ""}`}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border/60 bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Receipt className="w-5 h-5 text-destructive" /> Lançar Saída de Caixa</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-full p-2 hover:bg-elevated text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Atalhos de Despesas</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {despesasRapidas.map(d => (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => setDesc(d.name)}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left transition ${desc === d.name ? "border-electric bg-electric/10 text-electric" : "border-border/60 bg-elevated/40 hover:bg-elevated"}`}
                >
                  <span className="text-lg">{d.icon}</span>
                  <span className="text-sm font-semibold">{d.name}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleDespesa} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Descrição</label>
                <input required value={desc} onChange={e => setDesc(e.target.value)} className="mt-1 w-full rounded-xl border border-border/60 bg-elevated px-4 py-2" placeholder="Ex: Conta de Luz..." />
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Valor (R$)</label>
                <input required value={val} onChange={e => setVal(e.target.value)} type="text" placeholder="0.00" className="mt-1 w-full rounded-xl border border-border/60 bg-elevated px-4 py-2" />
              </div>
              <button type="submit" className="mt-2 w-full rounded-xl bg-destructive py-3 text-sm font-bold text-white shadow-lg shadow-destructive/20 hover:bg-destructive/90 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Confirmar Saída
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
