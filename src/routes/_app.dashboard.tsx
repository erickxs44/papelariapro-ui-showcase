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
import { useStore } from "../lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PapelariaPro" }] }),
  component: Dashboard,
});

const revenue = [
  { day: "Seg", value: 1240 },
  { day: "Ter", value: 1820 },
  { day: "Qua", value: 1560 },
  { day: "Qui", value: 2240 },
  { day: "Sex", value: 2980 },
  { day: "Sáb", value: 3460 },
  { day: "Dom", value: 1980 },
];

const topProducts = [
  { name: "Caderno Universitário 200fls", sales: 142, icon: BookOpen, tone: "from-electric to-aqua" },
  { name: "Caneta Esferográfica Azul", sales: 128, icon: Pencil, tone: "from-aqua to-electric" },
  { name: "Lápis de Cor 24 cores", sales: 96, icon: Palette, tone: "from-electric to-purple-400" },
  { name: "Impressão A4 Color", sales: 84, icon: Printer, tone: "from-aqua to-emerald-400" },
];

function Dashboard() {
  const { salesTotal, expenses, items, closeCashier } = useStore();
  
  const expensesTotal = expenses.reduce((s, e) => s + e.value, 0);
  const lucroReal = salesTotal - expensesTotal;
  const estoqueCriticoCount = items.filter(i => i.level === "Baixo" || i.level === "Indisponível").length;

  const handleCloseCashier = async () => {
    toast.promise(
      async () => {
        await closeCashier();
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
          <button
            onClick={handleCloseCashier}
            className="flex items-center gap-2 rounded-2xl bg-destructive px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-destructive/20 transition hover:bg-destructive/90"
          >
            <Lock className="h-4 w-4" />
            Fechar Relatório
          </button>
          <div className="hidden items-center gap-2 rounded-2xl border border-border/60 bg-surface/60 px-4 py-2 text-xs text-muted-foreground xl:flex">
            <Sparkles className="h-3.5 w-3.5 text-aqua" />
            Sincronizado
          </div>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-6 md:grid-rows-[auto_auto]">
        {/* Card 1 — wide chart */}
        <div className="md:col-span-4 md:row-span-2 rounded-3xl border border-border/60 bg-surface/70 p-6 card-inset">
          <div className="mb-6 grid grid-cols-3 gap-4 border-b border-border/40 pb-4">
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
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
        </div>

        {/* Card 3 — Estoque crítico */}
        <div className="md:col-span-2 rounded-3xl border border-border/60 bg-gradient-to-br from-destructive/15 to-surface p-6 card-inset">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Estoque crítico</p>
              <h3 className="mt-1 text-3xl font-bold">{estoqueCriticoCount} itens</h3>
              <p className="mt-1 text-xs text-muted-foreground">Precisam de atenção imediata</p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-destructive/20 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <Link
            to="/estoque"
            className="mt-5 inline-flex items-center gap-1 rounded-xl bg-destructive/20 px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/30"
          >
            Ver itens <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Card 4 — Atalho PDV */}
        <Link
          to="/pdv"
          className="group md:col-span-2 rounded-3xl border border-border/60 bg-gradient-to-br from-electric/25 via-aqua/15 to-surface p-6 card-inset transition hover:scale-[1.01]"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-aqua">Acesso rápido</p>
              <h3 className="mt-1 text-2xl font-bold">Abrir PDV</h3>
              <p className="mt-1 text-xs text-muted-foreground">Iniciar nova venda agora</p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-electric/30 text-electric transition group-hover:rotate-6">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-foreground">
            Ir para o caixa <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </Link>

        {/* Card 2 — Top vendidos */}
        <div className="md:col-span-6 rounded-3xl border border-border/60 bg-surface/70 p-6 card-inset">
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