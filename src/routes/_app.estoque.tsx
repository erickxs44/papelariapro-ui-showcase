import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plus, Filter, X, Minus, Trash2 } from "lucide-react";
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
  const { items, addStock, registrarMovimentacao, reporEstoque, discountStock, addStockSale, deleteProduct } = useStore();
  const [cat, setCat] = useState<Cat | "Todos">("Todos");
  const [q, setQ] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // States for new product
  const [newName, setNewName] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newQty, setNewQty] = useState("");

  // States for discount modal
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountItemId, setDiscountItemId] = useState<string | null>(null);
  const [discountItemName, setDiscountItemName] = useState<string>("");
  const [discountQty, setDiscountQty] = useState("");
  const [isConfirmingIntegration, setIsConfirmingIntegration] = useState(false);
  
  // States for restock modal
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockItemId, setRestockItemId] = useState<string | null>(null);
  const [restockItemName, setRestockItemName] = useState<string>("");
  const [restockCost, setRestockCost] = useState("");
  const [restockPrice, setRestockPrice] = useState("");
  const [restockQty, setRestockQty] = useState("");

  // States for financial confirmation modals
  const [isFinancialConfirmOpen, setIsFinancialConfirmOpen] = useState(false);
  // 'new' = confirming for new product, 'restock' = confirming for restock
  const [financialConfirmContext, setFinancialConfirmContext] = useState<'new' | 'restock' | null>(null);

  // Staged data waiting for financial confirmation
  const [stagedNewProduct, setStagedNewProduct] = useState<{
    item: any;
    parsedCost: number;
    qtyNum: number;
  } | null>(null);
  const [stagedRestock, setStagedRestock] = useState<{
    itemId: string;
    parsedCost: number;
    parsedPrice: number;
    qtyNum: number;
    itemName: string;
  } | null>(null);

  // States for product deletion modal (double confirm)
  const [isDeleteProductModalOpen, setIsDeleteProductModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteProductStep, setDeleteProductStep] = useState<1 | 2>(1);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = items.filter(
    (i) => (cat === "Todos" || i.cat === cat) && i.name.toLowerCase().includes(q.toLowerCase()),
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice || !newQty || !newCostPrice) return;

    const qtyNum = parseInt(newQty, 10);
    const parsedCost = parseFloat(newCostPrice.replace(",", "."));
    const item = {
      name: newName,
      cat: "Escolar",
      costPrice: parsedCost,
      price: parseFloat(newPrice.replace(",", ".")),
      qty: qtyNum,
      level: calculateLevel(qtyNum),
    };

    // Stage the data and open financial confirmation modal
    setStagedNewProduct({ item, parsedCost, qtyNum });
    setFinancialConfirmContext('new');
    setIsFinancialConfirmOpen(true);
  };

  const finalizeNewProduct = async (sendToFinancial: boolean) => {
    if (!stagedNewProduct) return;
    setIsSubmitting(true);
    try {
      const { item, parsedCost, qtyNum } = stagedNewProduct;
      await addStock(item as any);

      if (sendToFinancial) {
        const totalCost = parsedCost * qtyNum;
        if (totalCost > 0) {
          await registrarMovimentacao(new Date(), `Estoque: ${item.name}`, totalCost, "Saída", { categoria: "Estoque" });
        }
      }

      setIsFinancialConfirmOpen(false);
      setIsModalOpen(false);
      setStagedNewProduct(null);
      setFinancialConfirmContext(null);
      setNewName("");
      setNewCostPrice("");
      setNewPrice("");
      setNewQty("");
      toast.success(sendToFinancial ? "Produto cadastrado e despesa registrada!" : "Produto cadastrado no estoque!");
    } catch (e) {
      console.warn("Erro ao adicionar produto:", e);
      toast.error("Erro ao cadastrar produto.");
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

  const openRestockModal = (id: string, name: string, costPrice: number, price: number) => {
    if (!id) {
      toast.error("Produto não possui ID no banco ainda.");
      return;
    }
    setRestockItemId(id);
    setRestockItemName(name);
    setRestockCost(costPrice.toFixed(2).replace('.', ','));
    setRestockPrice(price.toFixed(2).replace('.', ','));
    setRestockQty("");
    setIsRestockModalOpen(true);
  };

  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItemId || !restockQty || !restockCost || !restockPrice) return;

    const qtyNum = parseInt(restockQty, 10);
    const parsedCost = parseFloat(restockCost.replace(",", "."));
    const parsedPrice = parseFloat(restockPrice.replace(",", "."));

    // Stage the data and open financial confirmation modal
    setStagedRestock({ itemId: restockItemId, parsedCost, parsedPrice, qtyNum, itemName: restockItemName });
    setFinancialConfirmContext('restock');
    setIsFinancialConfirmOpen(true);
  };

  const finalizeRestock = async (sendToFinancial: boolean) => {
    if (!stagedRestock) return;
    setIsSubmitting(true);
    try {
      const { itemId, parsedCost, parsedPrice, qtyNum, itemName } = stagedRestock;
      await reporEstoque(itemId, parsedCost, parsedPrice, qtyNum);

      if (sendToFinancial) {
        const totalCost = parsedCost * qtyNum;
        if (totalCost > 0) {
          await registrarMovimentacao(new Date(), `Reposição: ${itemName}`, totalCost, "Saída", { categoria: "Estoque" });
        }
      }

      setIsFinancialConfirmOpen(false);
      setIsRestockModalOpen(false);
      setStagedRestock(null);
      setFinancialConfirmContext(null);
      toast.success(sendToFinancial
        ? `${qtyNum} unidades repostas e despesa registrada!`
        : `${qtyNum} unidades repostas com sucesso!`);
    } catch (e) {
      console.warn("Erro ao repor estoque:", e);
      toast.error("Erro ao repor estoque.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinancialConfirm = (sendToFinancial: boolean) => {
    if (financialConfirmContext === 'new') {
      finalizeNewProduct(sendToFinancial);
    } else if (financialConfirmContext === 'restock') {
      finalizeRestock(sendToFinancial);
    }
  };

  const closeFinancialConfirm = () => {
    if (isSubmitting) return;
    setIsFinancialConfirmOpen(false);
    setStagedNewProduct(null);
    setStagedRestock(null);
    setFinancialConfirmContext(null);
  };

  const openDeleteProductModal = (id: string, name: string) => {
    if (!id) {
      toast.error("Produto não possui ID no banco ainda.");
      return;
    }
    setProductToDelete({ id, name });
    setDeleteProductStep(1);
    setIsDeleteProductModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteProduct(productToDelete.id);
      toast.success(`Produto "${productToDelete.name}" excluído e impacto financeiro revertido!`);
      setIsDeleteProductModalOpen(false);
      setProductToDelete(null);
    } catch (e) {
      console.warn("Erro ao excluir produto:", e);
      toast.error("Erro ao excluir produto. Verifique sua conexão.");
    } finally {
      setIsSubmitting(false);
    }
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
          await addStockSale(item.name, totalValue, discountItemId, qtyNum);
        }
      }
      
      setIsConfirmingIntegration(false);
      setIsDiscountModalOpen(false);
      toast.success(`${qtyNum} unidades descontadas de ${discountItemName}!`);
    } catch (e) {
      console.warn("Erro ao descontar estoque:", e);
      toast.error("Erro ao descontar estoque.");
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
              <th className="px-5 py-4 text-right font-semibold">Custo</th>
              <th className="px-5 py-4 text-right font-semibold">Venda</th>
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
                <td className="px-5 py-5 text-right font-semibold text-muted-foreground">R$ {(i?.costPrice ?? 0).toFixed(2)}</td>
                <td className="px-5 py-5 text-right font-semibold text-electric">R$ {(i?.price ?? 0).toFixed(2)}</td>
                <td className="px-5 py-5 text-right">{i.qty}</td>
                <td className="px-5 py-5">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone[i.level]}`}>
                    {i.level}
                  </span>
                </td>
                <td className="px-5 py-5">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => openRestockModal(i.id as string, i.name, i.costPrice, i.price)}
                      className="inline-flex items-center justify-center p-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500/20 transition-colors"
                      title="Repor Estoque"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => openDiscountModal(i.id as string, i.name)}
                      className="inline-flex items-center justify-center p-3 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-colors"
                      title="Descontar Produto"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => openDeleteProductModal(i.id as string, i.name)}
                      className="inline-flex items-center justify-center p-3 bg-red-900/20 text-red-400 rounded-xl hover:bg-red-900/40 transition-colors"
                      title="Excluir Produto (Lixeira)"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
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
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Custo</p>
                  <p className="font-bold text-muted-foreground text-sm leading-tight">R$ {(i?.costPrice ?? 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Venda</p>
                  <p className="font-bold text-electric text-sm leading-tight">R$ {(i?.price ?? 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openRestockModal(i.id as string, i.name, i.costPrice, i.price)}
                  className="inline-flex items-center justify-center p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors active:scale-95"
                  title="Repor Estoque"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => openDiscountModal(i.id as string, i.name)}
                  className="inline-flex items-center justify-center p-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors active:scale-95"
                  title="Descontar Produto"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => openDeleteProductModal(i.id as string, i.name)}
                  className="inline-flex items-center justify-center p-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors active:scale-95"
                  title="Excluir Produto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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
                <div className="col-span-1">
                  <label className="text-sm font-semibold text-muted-foreground">Preço de Compra (R$)</label>
                  <input required value={newCostPrice} onChange={e => setNewCostPrice(e.target.value)} type="text" placeholder="0.00" className="mt-1 w-full rounded-xl border border-border/60 bg-elevated px-4 py-2 focus:ring-2 focus:ring-electric/50 outline-none" />
                </div>
                <div className="col-span-1">
                  <label className="text-sm font-semibold text-muted-foreground">Preço de Venda (R$)</label>
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

      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl border border-border/60 bg-surface p-6 shadow-2xl glass-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Repor Estoque</h2>
              <button onClick={() => setIsRestockModalOpen(false)} className="rounded-full p-2 hover:bg-elevated text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Repor o item: <strong className="text-white">{restockItemName}</strong>
            </p>
            <form onSubmit={handleRestock} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="text-sm font-semibold text-muted-foreground">Novo Custo (R$)</label>
                  <input required value={restockCost} onChange={e => setRestockCost(e.target.value)} type="text" placeholder="0.00" className="mt-1 w-full rounded-xl border border-border/60 bg-elevated px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                </div>
                <div className="col-span-1">
                  <label className="text-sm font-semibold text-muted-foreground">Preço Venda (R$)</label>
                  <input required value={restockPrice} onChange={e => setRestockPrice(e.target.value)} type="text" placeholder="0.00" className="mt-1 w-full rounded-xl border border-border/60 bg-elevated px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Quantidade a Adicionar</label>
                <input required min="1" value={restockQty} onChange={e => setRestockQty(e.target.value)} type="number" placeholder="Ex: 10" className="mt-1 w-full rounded-xl border border-border/60 bg-elevated px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none" />
              </div>
              <button disabled={isSubmitting} type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Processando...
                  </>
                ) : (
                  "Confirmar Reposição"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Financial Confirmation Modal */}
      {isFinancialConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-3xl border border-border/60 bg-surface p-7 shadow-2xl glass-card">
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="h-14 w-14 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <p className="text-center text-base font-semibold text-foreground leading-snug mb-7">
              Você deseja passar o valor desses produtos para a dashboard de movimentações?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => handleFinancialConfirm(false)}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border border-border/60 bg-elevated py-3 text-sm font-bold hover:bg-elevated/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Não
              </button>
              <button
                onClick={() => handleFinancialConfirm(true)}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-electric/20 text-electric border border-electric/40 py-3 text-sm font-bold hover:bg-electric/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-electric/30 border-t-electric" />
                    Processando...
                  </>
                ) : (
                  "Sim"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Modal (Double Confirm) */}
      {isDeleteProductModalOpen && productToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl border border-destructive/20 bg-surface p-8 shadow-2xl glass-card">
            <button 
              onClick={() => setIsDeleteProductModalOpen(false)}
              disabled={isSubmitting}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20 text-destructive mx-auto">
              <Trash2 className="h-8 w-8" />
            </div>
            
            {deleteProductStep === 1 ? (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Excluir Produto</h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    Deseja excluir o produto <span className="text-white font-bold">{productToDelete.name}</span>?
                  </p>
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-left">
                    <p className="text-xs text-destructive flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Atenção: Todas as vendas, despesas de reposição e registros financeiros vinculados a este produto serão revertidos e removidos do Dashboard.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsDeleteProductModalOpen(false)}
                    className="flex-1 rounded-2xl border border-white/10 bg-transparent py-3.5 text-sm font-bold transition hover:bg-white/5"
                  >
                    Não
                  </button>
                  <button 
                    onClick={() => setDeleteProductStep(2)}
                    className="flex-1 rounded-2xl bg-destructive py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] transition hover:bg-destructive/90"
                  >
                    Sim
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Confirmar Exclusão</h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    Você tem certeza absoluta? Esta ação é irreversível.
                  </p>
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-left">
                    <p className="text-xs text-destructive flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      O produto e todo o seu impacto financeiro serão permanentemente removidos do sistema.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsDeleteProductModalOpen(false)}
                    className="flex-1 rounded-2xl border border-white/10 bg-transparent py-3.5 text-sm font-bold transition hover:bg-white/5"
                  >
                    Não
                  </button>
                  <button 
                    onClick={handleDeleteProduct}
                    disabled={isSubmitting}
                    className="flex-1 rounded-2xl bg-destructive py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] transition hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Aguarde...
                      </>
                    ) : (
                      "Confirmar Exclusão"
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