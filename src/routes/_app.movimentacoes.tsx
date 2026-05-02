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
  DollarSign
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useStore } from "../lib/store";

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
  const { items, sales, expenses } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"Todas" | "Entradas" | "Saídas">("Todas");
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Fetch Sales with items
      const { data: salesData } = await supabase
        .from('vendas')
        .select(`
          id,
          valor_total,
          data_venda,
          metodo_pagamento,
          itens_venda (
            quantidade,
            produto_id
          )
        `)
        .order('data_venda', { ascending: false })
        .limit(100);

      // 2. Fetch Expenses
      const { data: expData } = await supabase
        .from('despesas')
        .select('*')
        .order('data_pagamento', { ascending: false })
        .limit(100);

      const mSales: Movement[] = (salesData || []).map(s => {
        const itemIds = (s.itens_venda as any[] || []).map(iv => iv.produto_id);
        const itemNames = itemIds.map(id => items.find(i => i.id === id)?.name).filter(Boolean);
        
        let desc = itemNames.length > 0 
          ? `Venda: ${itemNames.slice(0, 2).join(", ")}${itemNames.length > 2 ? "..." : ""}`
          : "Venda PDV";
          
        let typeVal: "entrada" | "saida" = "entrada";
        let category = "Venda";

        if (s.metodo_pagamento && s.metodo_pagamento.startsWith("Fiado:")) {
          desc = `Venda ${s.metodo_pagamento.replace("Fiado: ", "")} - Pendente`;
          category = "Fiado";
          typeVal = "saida"; // To make it orange in the UI logic we can use a special type or just keep it entrada and change color logic. Let's use "entrada" but add a special flag, or handle color in UI. Wait, we can't change type easily without changing Movement. Let's add a `isPending` or `metodo` to Movement.
        } else if (s.metodo_pagamento === "Fiado PDV") {
          desc = "Venda PDV (Fiado) - Pendente";
          category = "Fiado";
          typeVal = "saida"; // we'll use a specific logic for color based on category/type
        } else if (s.metodo_pagamento && s.metodo_pagamento.startsWith("Baixa Fiado:")) {
          desc = `Recebimento de Fiado: ${s.metodo_pagamento.replace("Baixa Fiado: ", "")}`;
          category = "Fiado Pagamento";
          typeVal = "entrada";
        } else if (s.metodo_pagamento && s.metodo_pagamento.startsWith("Estoque: ")) {
          desc = `Venda (Estoque): ${s.metodo_pagamento.replace("Estoque: ", "")}`;
          category = "Venda";
          typeVal = "entrada";
        }
          
        return {
          id: `v-${s.id}`,
          type: typeVal,
          date: new Date(s.data_venda),
          description: desc,
          category: category,
          value: s.valor_total
        };
      });

      const mExps: Movement[] = (expData || []).map(e => ({
        id: `e-${e.id}`,
        type: "saida",
        date: new Date(e.data_pagamento),
        description: e.descricao,
        category: e.categoria || "Geral",
        value: e.valor
      }));

      const combined = [...mSales, ...mExps].sort((a, b) => b.date.getTime() - a.date.getTime());
      setMovements(combined);
      setLoading(false);
    };

    fetchData();
  }, [items, sales, expenses]);

  const filteredData = useMemo(() => {
    return movements.filter(m => {
      const matchSearch = m.description.toLowerCase().includes(search.toLowerCase()) || 
                          m.category.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "Todas" || 
                          (filter === "Entradas" && m.type === "entrada") ||
                          (filter === "Saídas" && m.type === "saida");
      return matchSearch && matchFilter;
    });
  }, [movements, search, filter]);

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
        <div className="flex items-center px-2 pb-3 mb-2 text-xs font-semibold text-muted-foreground border-b border-border/20">
          <div className="w-16">Data</div>
          <div className="flex-1">Descrição</div>
          <div className="text-right">Valor</div>
        </div>

        {/* Unified Clean List */}
        <div className="space-y-0 max-h-[650px] overflow-y-auto custom-scrollbar pr-2">
          {loading ? (
             Array.from({ length: 8 }).map((_, i) => (
               <div key={i} className="animate-pulse flex items-center p-4 border-b border-border/10">
                  <div className="w-16"><div className="h-4 w-10 rounded bg-white/5" /></div>
                  <div className="flex-1 flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-white/5" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 rounded bg-white/5" />
                      <div className="h-3 w-16 rounded bg-white/5" />
                    </div>
                  </div>
                  <div className="h-4 w-20 rounded bg-white/5" />
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
                 <div key={m.id} className="flex items-center p-4 border-b border-border/10 hover:bg-white/[0.02] transition-colors gap-3">
                   {/* Left: Date */}
                   <div className="w-16 flex-shrink-0 text-sm font-medium text-muted-foreground">
                     {m.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                   </div>
                   
                   {/* Center: Icon + Description */}
                   <div className="flex-1 min-w-0 flex items-center gap-3">
                     <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                       <IconCmp className="h-4 w-4" />
                     </div>
                     <div className="flex flex-col min-w-0">
                       <span className="font-bold text-sm text-foreground truncate">{m.description}</span>
                       <span className="text-[11px] text-muted-foreground truncate">{m.category}</span>
                     </div>
                   </div>
                   
                   {/* Right: Value */}
                   <div className={`flex-shrink-0 font-bold text-sm md:text-base text-right ${valueColor}`}>
                     {valuePrefix}R$ {m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
    </div>
  );
}
