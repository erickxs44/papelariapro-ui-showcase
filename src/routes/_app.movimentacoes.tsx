import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  ArrowLeftRight,
  Clock,
  Tag,
  DollarSign,
  Trash2,
  X
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useStore } from "../lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/movimentacoes")({
  head: () => ({ meta: [{ title: "Movimentações — PapelariaPro" }] }),
  component: Movimentacoes,
});

type Movement = {
  id: string;
  type: "entrada" | "saida";
  date: Date;
  description: string;
  category: string;
  value: number;
};

function Movimentacoes() {
  const { items, sales, expenses, estornarMovimentacao } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"Todas" | "Entradas" | "Saídas">("Todas");

  // States for estorno modal (replacing window.confirm)
  const [isEstornoModalOpen, setIsEstornoModalOpen] = useState(false);
  const [movementToEstorno, setMovementToEstorno] = useState<Movement | null>(null);
  const [estornoStep, setEstornoStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const movements = useMemo(() => {
    const safeSales = Array.isArray(sales) ? sales : [];
    const safeExpenses = Array.isArray(expenses) ? expenses : [];

    const parseDate = (v: unknown) => {
      if (!v) return new Date();
      const d = new Date(v as string);
      return isNaN(d.getTime()) ? new Date() : d;
    };

    const mSales: Movement[] = safeSales.map(s => {
      let typeVal: "entrada" | "saida" = "entrada";
      let category = "Venda";
      let desc = (s?.description || '').trim() || 'Venda';

      if (s?.type === "Venda Fiada") {
        category = "Fiado";
        typeVal = "saida";
      } else if (s?.type === "Pagamento de Fiado") {
        category = "Fiado Pagamento";
        typeVal = "entrada";
      }

      // Check for legacy description flags
      if (desc.startsWith("Fiado:")) {
         desc = `Venda ${desc.replace("Fiado: ", "")} - Pendente`;
         category = "Fiado";
         typeVal = "saida";
      } else if (desc === "Fiado PDV") {
         desc = "Venda PDV (Fiado) - Pendente";
         category = "Fiado";
         typeVal = "saida";
      } else if (desc.startsWith("Baixa Fiado:")) {
         desc = `Recebimento de Fiado: ${desc.replace("Baixa Fiado: ", "")}`;
         category = "Fiado Pagamento";
         typeVal = "entrada";
      } else if (desc.startsWith("Estoque: ")) {
         desc = `Venda (Estoque): ${desc.replace("Estoque: ", "")}`;
         category = "Venda";
         typeVal = "entrada";
      }

      return {
        id: s?.id || `temp-${Math.random()}`,
        type: typeVal,
        date: parseDate(s?.date),
        description: desc,
        category: category,
        value: s?.value ?? 0
      };
    });

    const mExps: Movement[] = safeExpenses.map((e, idx) => ({
      id: e?.id || `e-${idx}`,
      type: "saida" as const,
      date: parseDate(e?.date),
      description: (e?.desc || '').trim() || 'Despesa',
      category: "Geral",
      value: e?.value ?? 0
    }));

    return [...mSales, ...mExps].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [sales, expenses]);

  const filteredData = useMemo(() => {
    return (Array.isArray(movements) ? movements : []).filter(m => {
      const matchSearch = (m?.description || '').toLowerCase().includes(search.toLowerCase()) || 
                          (m?.category || '').toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "Todas" || 
                          (filter === "Entradas" && m?.type === "entrada") ||
                          (filter === "Saídas" && m?.type === "saida");
      return matchSearch && matchFilter;
    });
  }, [movements, search, filter]);

  const openEstornoModal = (m: Movement) => {
    setMovementToEstorno(m);
    setEstornoStep(1);
    setIsEstornoModalOpen(true);
  };

  const handleEstornar = async () => {
    if (!movementToEstorno) return;
    const m = movementToEstorno;
    
    // Se for uma despesa genérica, tratamos como despesa. Caso contrário, como venda.
    const isDespesa = m.category === "Geral" && m.type === "saida";
    const typeArgs = isDespesa ? "despesa" : "venda";

    setIsSubmitting(true);
    try {
      await estornarMovimentacao(m.id, typeArgs === "despesa");
      toast.success("Movimentação estornada com sucesso.");
      setIsEstornoModalOpen(false);
      setMovementToEstorno(null);
    } catch (e: any) {
      toast.error(e.message || "Erro ao estornar movimentação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 ml-2 animate-in fade-in slide-in-from-left-4">
        <div>
          <p className="text-sm font-medium text-aqua">Histórico financeiro completo</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">Movimentações</h1>
        </div>
      </div>

      <div className="rounded-3xl border border-border/60 bg-surface/70 p-6 card-inset backdrop-blur-md shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por descrição ou categoria..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border/50 bg-background/40 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-aqua/50 transition-all focus:ring-1 focus:ring-aqua/20"
            />
          </div>
          
          <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-background/40 p-1">
            {(["Todas", "Entradas", "Saídas"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-5 py-1.5 text-xs font-bold transition-all ${filter === f ? "bg-surface shadow-lg text-aqua scale-105" : "text-muted-foreground hover:text-foreground"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List Header */}
        <div className="flex items-center px-2 pb-3 mb-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 border-b border-border/10">
          <div className="w-11">Data</div>
          <div className="flex-1 ml-11">Descrição</div>
          <div className="text-right">Valor</div>
        </div>

        {/* Unified Clean List */}
        <div className="space-y-0 max-h-[650px] overflow-y-auto custom-scrollbar pr-2">
          {movements.length === 0 && sales.length === 0 && expenses.length === 0 ? (
             Array.from({ length: 8 }).map((_, i) => (
               <div key={i} className="animate-pulse flex items-center px-2 py-4 border-b border-border/10">
                  <div className="w-11 flex-shrink-0"><div className="h-3 w-8 rounded bg-white/5" /></div>
                  <div className="flex-1 flex items-center gap-2.5 ml-1">
                    <div className="h-8 w-8 rounded-full bg-white/5" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-3/4 rounded bg-white/5" />
                      <div className="h-2.5 w-1/4 rounded bg-white/5" />
                    </div>
                  </div>
                  <div className="h-4 w-16 rounded bg-white/5 ml-2" />
               </div>
             ))
          ) : filteredData.length > 0 ? (
             filteredData.map(m => {
               const isEntrada = m.type === 'entrada';
               const isPendente = m.category === 'Fiado';
               
               let iconBg = isPendente ? 'bg-orange-500/10 text-orange-400' : isEntrada ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-muted-foreground';
               let IconCmp = isPendente ? Clock : isEntrada ? ArrowUpRight : ArrowDownRight;
               
               let valueColor = isPendente ? 'text-orange-400' : isEntrada ? 'text-emerald-400' : 'text-muted-foreground';
               let valuePrefix = isPendente ? '' : isEntrada ? '+' : '-';

               return (
                 <div key={m.id} className="grid grid-cols-[44px_1fr_auto] items-start px-2 py-4 border-b border-border/10 hover:bg-white/[0.02] transition-colors gap-1">
                   {/* Left: Date */}
                   <div className="text-[11px] font-medium text-muted-foreground pt-1.5">
                     {m.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                   </div>
                   
                   {/* Center: Icon + Description */}
                   <div className="flex items-start gap-3 min-w-0">
                     <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5 ${iconBg}`}>
                       <IconCmp className="h-4 w-4" />
                     </div>
                     <div className="flex flex-col min-w-0">
                       <span className="font-bold text-sm text-foreground whitespace-normal break-words overflow-visible leading-tight">
                         {m.description}
                       </span>
                       <span className="text-[10px] text-muted-foreground mt-0.5">{m.category}</span>
                     </div>
                   </div>
                   
                   {/* Right: Value & Actions */}
                   <div className="flex flex-col items-end gap-2 ml-2 pt-1">
                     <div className={`font-bold text-sm text-right ${valueColor}`}>
                       {valuePrefix}R$ {m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                     </div>
                     <button
                       onClick={() => openEstornoModal(m)}
                       className="p-1 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                       title="Estornar / Excluir"
                     >
                       <Trash2 className="h-3.5 w-3.5" />
                     </button>
                   </div>
                 </div>
               );
             })
          ) : (
             <div className="py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <ArrowLeftRight className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground">Nenhuma movimentação encontrada.</p>
                </div>
             </div>
          )}
        </div>
        
        {/* Footer Info */}
        <div className="mt-6 flex items-center justify-between text-[11px] font-medium text-muted-foreground px-2">
          <div className="flex items-center gap-4">
            <p className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {movements.filter(m => m.type === 'entrada').length} Entradas</p>
            <p className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> {movements.filter(m => m.type === 'saida').length} Saídas</p>
          </div>
          <p className="italic">Exibindo os últimos 100 registros do banco de dados</p>
        </div>
      </div>

      {/* Estorno Modal (Double Confirm) */}
      {isEstornoModalOpen && movementToEstorno && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl border border-destructive/20 bg-surface p-8 shadow-2xl glass-card relative">
            <button 
              onClick={() => setIsEstornoModalOpen(false)}
              disabled={isSubmitting}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20 text-destructive mx-auto">
              <Trash2 className="h-8 w-8" />
            </div>
            
            {estornoStep === 1 ? (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Estornar Movimentação</h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    Deseja remover a movimentação <span className="text-white font-bold">"{movementToEstorno.description}"</span>?
                  </p>
                  <div className="bg-white/5 border border-border/30 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold">
                      <span className={movementToEstorno.type === 'entrada' ? 'text-emerald-400' : 'text-muted-foreground'}>
                        {movementToEstorno.type === 'entrada' ? '+' : '-'}R$ {movementToEstorno.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsEstornoModalOpen(false)}
                    className="flex-1 rounded-2xl border border-white/10 bg-transparent py-3.5 text-sm font-bold transition hover:bg-white/5"
                  >
                    Não
                  </button>
                  <button 
                    onClick={() => setEstornoStep(2)}
                    className="flex-1 rounded-2xl bg-destructive py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] transition hover:bg-destructive/90"
                  >
                    Sim
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Confirmar Estorno</h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    Você tem certeza absoluta? Esta ação é irreversível.
                  </p>
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-left">
                    <p className="text-xs text-destructive flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      O valor será revertido do Dashboard e o registro removido permanentemente.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsEstornoModalOpen(false)}
                    className="flex-1 rounded-2xl border border-white/10 bg-transparent py-3.5 text-sm font-bold transition hover:bg-white/5"
                  >
                    Não
                  </button>
                  <button 
                    onClick={handleEstornar}
                    disabled={isSubmitting}
                    className="flex-1 rounded-2xl bg-destructive py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] transition hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Aguarde...
                      </>
                    ) : (
                      "Confirmar Estorno"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
