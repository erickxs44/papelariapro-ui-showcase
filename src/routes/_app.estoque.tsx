import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plus, Filter, X } from "lucide-react";
import { useStore, Cat, calculateLevel } from "../lib/store";

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
  const [newCat, setNewCat] = useState<Cat>("Escolar");
  const [newPrice, setNewPrice] = useState("");
  const [newQty, setNewQty] = useState("");

  const filtered = items.filter(
    (i) => (cat === "Todos" || i.cat === cat) && i.name.toLowerCase().includes(q.toLowerCase()),
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice || !newQty) return;
    const qtyNum = parseInt(newQty, 10);
    const item = {
      code: "NOVO-" + Math.floor(Math.random() * 1000),
      name: newName,
      cat: newCat as Exclude<Cat, "Todos" | "Serviço">,
      price: parseFloat(newPrice.replace(",", ".")),
      qty: qtyNum,
      level: calculateLevel(qtyNum)
    };
    addStock(item as any);
    setIsModalOpen(false);
    setNewName("");
    setNewPrice("");
    setNewQty("");
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

      <div className="overflow-hidden rounded-3xl border border-border/60 bg-surface/70 card-inset">
        <table className="w-full text-sm">
          <thead className="bg-elevated/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left font-semibold">Código</th>
              <th className="px-5 py-3 text-left font-semibold">Produto</th>
              <th className="px-5 py-3 text-left font-semibold">Categoria</th>
              <th className="px-5 py-3 text-right font-semibold">Preço</th>
              <th className="px-5 py-3 text-right font-semibold">Qtd</th>
              <th className="px-5 py-3 text-left font-semibold">Estoque</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.code} className="border-t border-border/40 transition hover:bg-elevated/40">
                <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{i.code}</td>
                <td className="px-5 py-4 font-medium">{i.name}</td>
                <td className="px-5 py-4 text-muted-foreground">{i.cat}</td>
                <td className="px-5 py-4 text-right font-semibold">R$ {i.price.toFixed(2)}</td>
                <td className="px-5 py-4 text-right">{i.qty}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone[i.level]}`}>
                    {i.level}
                  </span>
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
                <input required value={newName} onChange={e => setNewName(e.target.value)} className="mt-1 w-full rounded-xl border border-border/60 bg-elevated px-4 py-2" placeholder="Ex: Lápis de Cor..." />
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Categoria</label>
                <select value={newCat} onChange={e => setNewCat(e.target.value as any)} className="mt-1 w-full rounded-xl border border-border/60 bg-elevated px-4 py-2">
                  <option value="Escolar">Escolar</option>
                  <option value="Escritório">Escritório</option>
                  <option value="Arte">Arte</option>
                  <option value="Informática">Informática</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Preço (R$)</label>
                  <input required value={newPrice} onChange={e => setNewPrice(e.target.value)} type="text" placeholder="0.00" className="mt-1 w-full rounded-xl border border-border/60 bg-elevated px-4 py-2" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Quantidade</label>
                  <input required value={newQty} onChange={e => setNewQty(e.target.value)} type="number" placeholder="10" className="mt-1 w-full rounded-xl border border-border/60 bg-elevated px-4 py-2" />
                </div>
              </div>
              <button type="submit" className="mt-2 w-full rounded-xl bg-electric py-3 text-sm font-bold text-white shadow-lg shadow-electric/20 hover:bg-electric/90">
                Adicionar ao Estoque
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}