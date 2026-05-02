import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plus, Filter, X, Minus } from "lucide-react";
import { useStore, Cat, calculateLevel } from "../lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/estoque")({
  head: () => ({ meta: [{ title: "Estoque — PapelariaPro" }] }),
  component: Estoque,
});

const tone: Record<string, string> = {
  Cheio: "bg-aqua/20 text-aqua border-aqua/40",
  Médio: "bg-amber-400/15 text-amber-300 border-amber-400/40",
  Baixo: "bg-destructive/20 text-destructive border-destructive/40",
  Indisponível: "bg-slate-500/20 text-slate-400 border-slate-500/40",
};

function Estoque() {
  const { items, addStock } = useStore();
  const [cat, setCat] = useState<Cat | "Todos">("Todos");
  const [q, setQ] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // States for new product
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newQty, setNewQty] = useState("");

  // States for discount modal
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountItemId, setDiscountItemId] = useState<string | null>(null);
  const [discountItemName, setDiscountItemName] = useState<string>("");
  const [discountQty, setDiscountQty] = useState("");
  const [isConfirmingIntegration, setIsConfirmingIntegration] = useState(false);
  const { discountStock, addStockSale } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = items.filter(
    (i) => (cat === "Todos" || i.cat === cat) && i.name.toLowerCase().includes(q.toLowerCase()),
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice || !newQty) return;
    setIsSubmitting(true);
    try {
      const qtyNum = parseInt(newQty, 10);
      const item = {
        name: newName,
        cat: "Escolar",
        costPrice: 0, // removed from UI
        price: parseFloat(newPrice.replace(",", ".")),
        qty: qtyNum,
        level: calculateLevel(qtyNum)
      };
      await addStock(item as any);
      setIsModalOpen(false);
      setNewName("");
      setNewPrice("");
      setNewQty("");
      toast.success("Produto cadastrado!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDiscountModal = (id: string, name: string) => {
    if (!id) {
      toast.error("Produto não possui ID no banco ainda.");
      return;
    }
    setDiscountItemId(id);
    setDiscountItemName(name);
    setDiscountQty("");
    setIsConfirmingIntegration(false);
    setIsDiscountModalOpen(true);
  };

  const handleDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountItemId || !discountQty) return;
    const qtyNum = parseInt(discountQty, 10);
    if (qtyNum <= 0) return;
    
    setIsConfirmingIntegration(true);
  };

  const finalizeDiscount = async (integrate: boolean) => {
    if (!discountItemId || !discountQty) return;
    setIsSubmitting(true);
    try {
      const qtyNum = parseInt(discountQty, 10);
      
      await discountStock(discountItemId, qtyNum);
      
      if (integrate) {
        const item = items.find(i => i.id === discountItemId);
        if (item) {
          const totalValue = item.price * qtyNum;
          await addStockSale(item.name, totalValue);
        }
      }
      
      setIsConfirmingIntegration(false);
      setIsDiscountModalOpen(false);
      toast.success(`${qtyNum} unidades descontadas de ${discountItemName}!`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-sm text-muted-foreground">{items.length} produtos cadastrados</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-electric to-aqua px-4 py-2.5 text-sm font-semibold text-background">
          <Plus className="h-4 w-4" /> Novo produto
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full rounded-2xl border border-border/60 bg-surface/70 py-2.5 pl-9 pr-3 text-sm focus:border-electric/60 focus:outline-none focus:ring-2 focus:ring-electric/30"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-border/60 bg-surface/70 p-1">
          <Filter className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          {["Todos", "Escolar", "Escritório", "Arte", "Informática"].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c as any)}
              className={
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition " +
                (cat === c ? "bg-electric/20 text-electric" : "text-muted-foreground hover:text-foreground")
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden md:block overflow-hidden rounded-3xl border border-border/60 bg-surface/70 card-inset">
        <table className="w-full text-sm">
          <thead className="bg-elevated/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-4 text-left font-semibold">Produto</th>
              <th className="px-5 py-4 text-left font-semibold">Categoria</th>
              <th className="px-5 py-4 text-right font-semibold">Preço Venda</th>
              <th className="px-5 py-4 text-right font-semibold">Qtd</th>
              <th className="px-5 py-4 text-left font-semibold">Estoque</th>
              <th className="px-5 py-4 text-center font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id || i.name} className="border-t border-border/40 transition hover:bg-elevated/40">
                <td className="px-5 py-5 font-medium">{i.name}</td>
                <td className="px-5 py-5 text-muted-foreground">{i.cat}</td>
                <td className="px-5 py-5 text-right font-semibold text-electric">R$ {i.price.toFixed(2)}</td>
                <td className="px-5 py-5 text-right">{i.qty}</td>
                <td className="px-5 py-5">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone[i.level]}`}>
                    {i.level}
                  </span>
                </td>
                <td className="px-5 py-5 text-center">
                  <button 
                    onClick={() => openDiscountModal(i.id as string, i.name)}
                    className="inline-flex items-center justify-center p-3 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-colors"
                    title="Descontar Produto"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2.5">
        {filtered.map((i) => (
          <div key={i.id || i.name} className="rounded-2xl border border-border/60 bg-surface/70 p-3.5 shadow-sm flex flex-col gap-2 hover:bg-elevated/40 transition-colors">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base leading-tight truncate text-foreground">{i.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[11px] text-muted-foreground">{i.cat}</p>
                  <span className="text-[11px] font-black text-electric bg-electric/10 px-1.5 py-0.5 rounded-md">Qtd: {i.qty}</span>
                </div>
              </div>
              <span className={`shrink-0 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone[i.level]}`}>
                {i.level}
              </span>
            </div>
            
            <div className="flex items-center justify-between pt-2.5 border-t border-border/30">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Preço Unitário</p>
                  <p className="font-bold text-electric text-sm leading-tight">R$ {i.price.toFixed(2)}</p>
                </div>
              </div>
              <button 
                onClick={() => openDiscountModal(i.id as string, i.name)}
                className="inline-flex items-center justify-center p-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors active:scale-95"
                title="Descontar Produto"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground border border-border/60 rounded-2xl bg-surface/40">
            Nenhum produto encontrado.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border/60 bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Novo Produto</h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-elevated text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Nome do Produto</label>
                <input required value={newName} onChange={e => setNewName(e.target.value)} className="mt-1 w-full rounded-xl border border-border/60 bg-elevated px-4 py-2 focus:ring-2 focus:ring-electric/50 outline-none" placeholder="Ex: Lápis de Cor..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-muted-foreground">Preço Venda (R$)</label>
                  <input required value={newPrice} onChange={e => setNewPrice(e.target.value)} type="text" placeholder="0.00" className="mt-1 w-full rounded-xl border border-border/60 bg-elevated px-4 py-2 focus:ring-2 focus:ring-electric/50 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Quantidade Inicial</label>
                <input required value={newQty} onChange={e => setNewQty(e.target.value)} type="number" placeholder="10" className="mt-1 w-full rounded-xl border border-border/60 bg-elevated px-4 py-2 focus:ring-2 focus:ring-electric/50 outline-none" />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="mt-2 w-full rounded-xl bg-electric py-3 text-sm font-bold text-white shadow-lg shadow-electric/20 hover:bg-electric/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Processando...
                  </>
                ) : (
                  "Adicionar ao Estoque"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border/60 bg-surface p-6 shadow-2xl glass-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Descontar Produto</h2>
              <button onClick={() => setIsDiscountModalOpen(false)} className="rounded-full p-2 hover:bg-elevated text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {!isConfirmingIntegration ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Descontar manualmente o item: <strong className="text-white">{discountItemName}</strong>
                </p>
                <form onSubmit={handleDiscount} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Quantidade a ser subtraída</label>
                    <input required min="1" value={discountQty} onChange={e => setDiscountQty(e.target.value)} type="number" placeholder="Ex: 1" className="mt-1 w-full rounded-xl border border-border/60 bg-elevated px-4 py-2 focus:ring-2 focus:ring-electric/50 outline-none" />
                  </div>
                  <button type="submit" className="mt-2 w-full rounded-xl bg-destructive py-3 text-sm font-bold text-white shadow-lg shadow-destructive/20 hover:bg-destructive/90 transition-colors">
                    Continuar
                  </button>
                </form>
              </>
            ) : (
              <div className="space-y-6">
                <p className="text-center font-medium text-lg text-white">
                  Deseja transferir o valor desta venda para a Dashboard e Movimentações?
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => finalizeDiscount(false)}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl border border-border/60 bg-elevated py-3 text-sm font-bold hover:bg-elevated/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Não
                  </button>
                  <button 
                    onClick={() => finalizeDiscount(true)}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-aqua/20 text-aqua border border-aqua/40 py-3 text-sm font-bold hover:bg-aqua/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-aqua/30 border-t-aqua" />
                        Processando...
                      </>
                    ) : (
                      "Sim"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}