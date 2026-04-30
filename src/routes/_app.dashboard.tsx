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
import { useState, useMemo } from "react";
import { useStore } from "../lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PapelariaPro" }] }),
  component: Dashboard,
});



const topProducts = [
  { name: "Caderno Universitário 200fls", sales: 142, icon: BookOpen, tone: "from-electric to-aqua" },
  { name: "Caneta Esferográfica Azul", sales: 128, icon: Pencil, tone: "from-aqua to-electric" },
  { name: "Lápis de Cor 24 cores", sales: 96, icon: Palette, tone: "from-electric to-purple-400" },
  { name: "Impressão A4 Color", sales: 84, icon: Printer, tone: "from-aqua to-emerald-400" },
];

function Dashboard() {
  const { sales, expenses, closeCashier } = useStore();
  const [period, setPeriod] = useState<"Hoje" | "7D" | "30D">("Hoje");
  const [showReportMenu, setShowReportMenu] = useState(false);
  
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

  const filteredSales = useMemo(() => sales.filter(s => new Date(s.date) >= startDate), [sales, startDate]);
  const filteredExpenses = useMemo(() => expenses.filter(e => new Date(e.date) >= startDate), [expenses, startDate]);

  const salesTotal = filteredSales.reduce((s, e) => s + e.value, 0);
  const expensesTotal = filteredExpenses.reduce((s, e) => s + e.value, 0);
  const lucroReal = salesTotal - expensesTotal;

  const chartData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredSales.forEach(s => {
      const d = new Date(s.date);
      let key = "";
      if (period === "Hoje") {
        key = d.getHours() + "h";
      } else if (period === "7D") {
        key = d.toLocaleDateString("pt-BR", { weekday: 'short' });
      } else {
        key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      }
      groups[key] = (groups[key] || 0) + s.value;
    });

    const data = [];
    const now = new Date();
    if (period === "Hoje") {
      for (let i = 8; i <= 20; i++) {
        const k = i + "h";
        data.push({ day: k, value: groups[k] || 0 });
      }
    } else if (period === "7D") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const k = d.toLocaleDateString("pt-BR", { weekday: 'short' });
        data.push({ day: k, value: groups[k] || 0 });
      }
    } else {
      for (let i = 29; i >= 0; i -= 5) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const k = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        data.push({ day: k, value: groups[k] || 0 });
      }
    }
    return data;
  }, [filteredSales, period]);

  const handleCloseCashier = async (selectedPeriod: "Hoje" | "7D" | "30D") => {
    toast.promise(
      async () => {
        await closeCashier(selectedPeriod);
      },
      {
        loading: 'Fechando caixa e enviando e-mail...',
        success: 'Caixa fechado! Relatório enviado.',
        error: 'Erro ao fechar caixa.',
      }
    );
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-aqua">Bem-vinda de volta, Ana 👋</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowReportMenu(!showReportMenu)}
              className="flex items-center gap-2 rounded-2xl bg-destructive px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-destructive/20 transition hover:bg-destructive/90"
            >
              <Lock className="h-4 w-4" />
              Fechar Relatório
            </button>
            {showReportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowReportMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border/50 bg-surface p-2 shadow-xl z-50 animate-in fade-in zoom-in-95">
                  <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Período do Relatório</p>
                  <button onClick={() => { setShowReportMenu(false); handleCloseCashier("Hoje"); }} className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-muted/50 transition">Hoje</button>
                  <button onClick={() => { setShowReportMenu(false); handleCloseCashier("7D"); }} className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-muted/50 transition">Últimos 7 dias</button>
                  <button onClick={() => { setShowReportMenu(false); handleCloseCashier("30D"); }} className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-muted/50 transition">Últimos 30 dias</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-5">
        
        {/* Card 1 — Chart */}
        <div className="rounded-3xl border border-border/60 bg-surface/70 p-6 card-inset">
          <div className="mb-6 flex flex-col gap-4 border-b border-border/40 pb-6 md:flex-row md:items-center md:justify-between">
            <div className="grid grid-cols-3 gap-4 md:gap-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Faturamento</p>
                <h2 className="mt-1 text-2xl font-bold text-aqua">R$ {salesTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h2>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Despesas</p>
                <h2 className="mt-1 text-2xl font-bold text-destructive">R$ {expensesTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h2>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lucro Real</p>
                <h2 className={`mt-1 text-2xl font-bold ${lucroReal >= 0 ? "text-electric" : "text-destructive"}`}>
                  R$ {lucroReal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </h2>
              </div>
            </div>
            
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
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.2 250)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.82 0.15 180)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.35 0.04 258)" vertical={false} />
                <XAxis dataKey="day" stroke="oklch(0.7 0.03 250)" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke="oklch(0.7 0.03 250)" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.27 0.04 258)",
                    border: "1px solid oklch(0.35 0.04 258)",
                    borderRadius: 16,
                    color: "white",
                  }}
                  formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Faturamento"]}
                />
                <Area type="monotone" dataKey="value" stroke="oklch(0.7 0.2 250)" strokeWidth={3} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>


        {/* Card 2 — Top vendidos */}
        <div className="rounded-3xl border border-border/60 bg-surface/70 p-6 card-inset">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mais vendidos</p>
              <h3 className="mt-1 text-xl font-bold">Top produtos da semana</h3>
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {topProducts.map((p) => (
              <li
                key={p.name}
                className="flex items-center gap-4 rounded-2xl border border-border/40 bg-elevated/60 p-3 transition hover:border-electric/40"
              >
                <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${p.tone} text-background`}>
                  <p.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sales} unidades vendidas</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-aqua">+{Math.round(p.sales * 0.6)}%</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}