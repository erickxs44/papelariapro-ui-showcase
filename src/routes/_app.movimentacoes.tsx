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

        {/* Table Container */}
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-elevated/5">
          <div className="overflow-x-auto max-h-[650px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border/60 bg-sidebar/95 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Data/Hora</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-electric/20 backdrop-blur-sm" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-48 rounded bg-electric/20 backdrop-blur-sm" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-20 rounded bg-electric/20 backdrop-blur-sm" /></td>
                      <td className="px-6 py-4 text-right"><div className="h-4 w-16 ml-auto rounded bg-electric/20 backdrop-blur-sm" /></td>
                    </tr>
                  ))
                ) : filteredData.length > 0 ? (
                  filteredData.map(m => (
                    <tr key={m.id} className="group transition-colors hover:bg-elevated/20">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground group-hover:text-aqua transition-colors" />
                          <span className="text-muted-foreground">{m.date.toLocaleDateString('pt-BR')} {m.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-foreground group-hover:text-aqua transition-colors">{m.description}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="rounded-lg bg-elevated/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-tighter text-muted-foreground group-hover:bg-aqua/10 group-hover:text-aqua transition-all">{m.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`flex items-center justify-end gap-1.5 font-black text-base ${m.category === 'Fiado' ? 'text-orange-400' : m.type === 'entrada' ? 'text-emerald-400' : 'text-red-500'}`}>
                          <span className="text-lg leading-none">{m.category === 'Fiado' ? '⏳' : m.type === 'entrada' ? '↑' : '↓'}</span>
                          <span>R$ {m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ArrowLeftRight className="h-10 w-10 text-muted-foreground/20" />
                        <p className="text-muted-foreground">Nenhuma movimentação encontrada para esta busca.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
