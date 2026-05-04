import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  ArrowUpRight,
  Pencil,
  BookOpen,
  Palette,
  Printer,
  Sparkles,
  ArrowDownRight,
  DollarSign,
  Lock
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PapelariaPro" }] }),
  component: Dashboard,
});



// Dynamic types and calculation inside the component

function Dashboard() {
  const { sales, expenses, closeCashier, items, fiados } = useStore();
  const [period, setPeriod] = useState<"Hoje" | "7D" | "30D">("Hoje");
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [dbTopProducts, setDbTopProducts] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const { data: rawData } = await supabase.from('itens_venda').select('quantidade, preco_unitario, produto_id').limit(100);
        
        if (rawData) {
          const stats: Record<string, { qty: number; price: number; name: string }> = {};
          for (const row of rawData) {
            const prod = items.find(i => i.id === row.produto_id);
            const name = prod?.name || "Produto Desconhecido";
            if (!stats[name]) stats[name] = { qty: 0, price: row.preco_unitario ?? 0, name };
            stats[name].qty += row.quantidade ?? 0;
          }
          const sorted = Object.values(stats).sort((a, b) => b.qty - a.qty).slice(0, 10);
          setDbTopProducts(sorted);
        }
      } catch (e) {
        console.warn('Erro ao carregar top produtos:', e);
      }
    };
    fetchTopProducts();
  }, [items]);

  const recentMovements = useMemo(() => {
    const safeSales = Array.isArray(sales) ? sales : [];
    const safeExpenses = Array.isArray(expenses) ? expenses : [];

    const parseDate = (v: unknown) => {
      if (!v) return new Date();
      const d = new Date(v as string);
      return isNaN(d.getTime()) ? new Date() : d;
    };

    const mvs = [
      ...safeSales.map(s => ({ type: "venda" as const, title: (s?.description || '').trim() || "Venda realizada", value: s?.value ?? 0, date: parseDate(s?.date) })),
      ...safeExpenses.map(e => ({ type: "despesa" as const, title: (e?.desc || '').trim() || "Despesa", value: e?.value ?? 0, date: parseDate(e?.date) }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
    return mvs;
  }, [sales, expenses]);
  
  const startDate = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    if (period === "Hoje") {
      start.setHours(0,0,0,0);
    } else if (period === "7D") {
      start.setDate(now.getDate() - 7);
      start.setHours(0,0,0,0);
    } else if (period === "30D") {
      start.setDate(now.getDate() - 30);
      start.setHours(0,0,0,0);
    }
    return start;
  }, [period]);

  const filteredSales = useMemo(() => (Array.isArray(sales) ? sales : []).filter(s => new Date(s?.date || 0) >= startDate && s.type !== "Venda Fiada"), [sales, startDate]);
  const filteredExpenses = useMemo(() => (Array.isArray(expenses) ? expenses : []).filter(e => new Date(e?.date || 0) >= startDate), [expenses, startDate]);

  const salesTotal = filteredSales.reduce((s, e) => s + (e?.value ?? 0), 0);
  const expensesTotal = filteredExpenses.reduce((s, e) => s + (e?.value ?? 0), 0);
  const lucroReal = salesTotal - expensesTotal;
  
  const dividaClientes = useMemo(() => {
    return (Array.isArray(fiados) ? fiados : []).reduce((acc, f) => acc + (f?.amount ?? 0), 0);
  }, [fiados]);

  const chartData = useMemo(() => {
    const sGroups: Record<string, number> = {};
    const eGroups: Record<string, number> = {};

    const getKey = (date: Date) => {
      const d = new Date(date);
      if (period === "Hoje") return d.getHours() + "h";
      if (period === "7D") return d.toLocaleDateString("pt-BR", { weekday: 'short' });
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    };

    filteredSales.forEach(s => {
      const key = getKey(new Date(s?.date || Date.now()));
      sGroups[key] = (sGroups[key] || 0) + (s?.value ?? 0);
    });

    filteredExpenses.forEach(e => {
      const key = getKey(new Date(e?.date || Date.now()));
      eGroups[key] = (eGroups[key] || 0) + (e?.value ?? 0);
    });

    const data = [];
    const now = new Date();
    if (period === "Hoje") {
      for (let i = 8; i <= 20; i++) {
        const k = i + "h";
        data.push({ day: k, value: sGroups[k] || 0, expense: eGroups[k] || 0 });
      }
    } else if (period === "7D") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const k = d.toLocaleDateString("pt-BR", { weekday: 'short' });
        data.push({ day: k, value: sGroups[k] || 0, expense: eGroups[k] || 0 });
      }
    } else {
      for (let i = 29; i >= 0; i -= 5) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const k = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        data.push({ day: k, value: sGroups[k] || 0, expense: eGroups[k] || 0 });
      }
    }
    return data;
  }, [filteredSales, filteredExpenses, period]);

  const handleCloseCashier = async (selectedPeriod: "Hoje" | "7D" | "30D") => {
    toast.loading('Fechando caixa e enviando e-mail...', { id: 'close-cashier' });
    try {
      await closeCashier(selectedPeriod);
      toast.success('Caixa fechado! Relatório enviado.', { id: 'close-cashier' });
    } catch (e) {
      console.warn('Erro ao fechar caixa:', e);
      toast.error('Erro ao fechar caixa.', { id: 'close-cashier' });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto max-w-7xl pb-12"
    >
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-aqua">Bem-vinda de volta, Ana 👋</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight lg:text-4xl glow-text">Resumo Financeiro</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowReportMenu(!showReportMenu)}
              className="flex items-center gap-2 rounded-2xl bg-destructive px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] transition hover:bg-destructive/90"
            >
              <Lock className="h-4 w-4" />
              Fechar Relatório
            </motion.button>
            {showReportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowReportMenu(false)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-48 rounded-xl border border-border/50 glass-card p-2 shadow-xl z-50"
                >
                  <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Período do Relatório</p>
                  <button onClick={() => { setShowReportMenu(false); handleCloseCashier("Hoje"); }} className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-white/10 transition">Hoje</button>
                  <button onClick={() => { setShowReportMenu(false); handleCloseCashier("7D"); }} className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-white/10 transition">Últimos 7 dias</button>
                  <button onClick={() => { setShowReportMenu(false); handleCloseCashier("30D"); }} className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-white/10 transition">Últimos 30 dias</button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <motion.div 
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="rounded-3xl glass-card p-5 lg:p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vendas</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-white">R$ {salesTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h2>
          <p className="text-xs text-muted-foreground mt-1">{filteredSales.length} transações</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="rounded-3xl glass-card p-5 lg:p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Despesas</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-destructive">- R$ {expensesTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h2>
          <p className="text-xs text-muted-foreground mt-1">{filteredExpenses.length} lançamentos</p>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="rounded-3xl glass-neon p-5 lg:p-6 flex flex-col relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-aqua opacity-30 blur-2xl"></div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-aqua relative z-10">Lucro Real</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-aqua/10 text-aqua relative z-10">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-aqua relative z-10">R$ {lucroReal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h2>
          <p className="text-xs text-aqua/60 mt-1 relative z-10">Vendas − Despesas</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="rounded-3xl glass-card p-5 lg:p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dívida de Clientes</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-amber-400">R$ {dividaClientes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h2>
          <p className="text-xs text-muted-foreground mt-1">Saldo pendente em Fiados</p>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Card 1 — Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="rounded-3xl glass-card p-6"
        >
          <div className="mb-6 flex flex-col gap-4 pb-4 md:flex-row md:items-center md:justify-end">
            <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-background/50 p-1">
              <button 
                onClick={() => setPeriod("Hoje")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${period === "Hoje" ? "bg-surface shadow text-aqua" : "text-muted-foreground hover:text-foreground"}`}
              >
                Hoje
              </button>
              <button 
                onClick={() => setPeriod("7D")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${period === "7D" ? "bg-surface shadow text-aqua" : "text-muted-foreground hover:text-foreground"}`}
              >
                7D
              </button>
              <button 
                onClick={() => setPeriod("30D")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${period === "30D" ? "bg-surface shadow text-aqua" : "text-muted-foreground hover:text-foreground"}`}
              >
                30D
              </button>
            </div>
          </div>
          
          <div className="h-[255px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--electric)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--electric)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10, 10, 10, 0.8)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: 20,
                    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)"
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="value" name="Vendas" stroke="var(--electric)" strokeWidth={4} fill="url(#rev)" animationDuration={1500} />
                <Area type="monotone" dataKey="expense" name="Despesas" stroke="#f43f5e" strokeWidth={3} fill="url(#exp)" animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>


        {/* Bottom Section: Top Products & Recent Movements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Column 1: Produtos Mais Vendidos */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="rounded-3xl glass-card p-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Performance</p>
                <h3 className="text-xl font-bold">Produtos Mais Vendidos</h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-aqua/10 text-aqua">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-3">
              {dbTopProducts.map((p, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (idx * 0.05) }}
                  key={p.name} 
                  className="group relative flex items-center gap-4 rounded-2xl border border-border/40 bg-elevated/40 p-4 transition-all hover:border-aqua/40 hover:bg-elevated/60"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/50 font-bold text-muted-foreground">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold">{p.name}</p>
                      {idx < 3 && <Sparkles className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
                    </div>
                    <p className="text-xs text-muted-foreground">R$ {p.price.toFixed(2)} unit. • {p.qty} vendidos</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background/50">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (p.qty / (dbTopProducts[0]?.qty || 1)) * 100)}%` }}
                        transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                        className="h-full rounded-full bg-gradient-to-r from-aqua to-electric transition-all" 
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">R$ {(p.qty * p.price).toLocaleString("pt-BR")}</p>
                  </div>
                </motion.div>
              ))}
              {dbTopProducts.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma venda registrada no período.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Column 2: Movimentações Recentes */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="rounded-3xl glass-card p-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tempo Real</p>
                <h3 className="text-xl font-bold">Movimentações Recentes</h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-electric/10 text-electric">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-3">
              {recentMovements.map((m, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (idx * 0.05) }}
                  key={idx} 
                  className="flex items-center gap-4 rounded-2xl border border-border/40 bg-elevated/40 p-4 transition-all hover:border-electric/20"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.type === 'venda' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                    {m.type === 'venda' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.date.toLocaleDateString('pt-BR')} às {m.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${m.type === 'venda' ? 'text-emerald-400' : 'text-red-500'}`}>
                      {m.type === 'venda' ? '+' : '-'} R$ {m.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </motion.div>
              ))}
              {recentMovements.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma movimentação recente.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}