import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Copy,
  Printer,
  Palette,
  BookOpen,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  PackageX,
  GraduationCap,
  ReceiptText,
  Lock,
  Wallet,
  Smartphone
} from "lucide-react";
import { useStore } from "../lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pdv")({
  head: () => ({ meta: [{ title: "PDV — PapelariaPro" }] }),
  component: Pdv,
});

const iconMap: Record<string, any> = {
  Copy,
  Palette,
  Printer,
  BookOpen
};

type CartItem = { id?: string; name: string; price: number; qty: number };

function Pdv() {
  const { items, checkout, xeroxCount, services, quickProducts, listasEscolares, addService, fiados } = useStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [q, setQ] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Dinheiro" | "Cartão" | "Pix" | "Fiado">("Dinheiro");

  const [isFiadoModalOpen, setIsFiadoModalOpen] = useState(false);
  const [selectedFiadoClient, setSelectedFiadoClient] = useState("");

  // Novo Produto/Serviço modal
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");

  const handleAddNewService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice) return;
    addService({
      name: newServiceName,
      price: parseFloat(newServicePrice.replace(",", ".")),
      icon: "Copy" // Default icon
    });
    setIsNewServiceModalOpen(false);
    setNewServiceName("");
    setNewServicePrice("");
    toast.success("Serviço adicionado com sucesso!");
  };

  const add = (name: string, price: number, stockQty?: number, id?: string) => {
    if (stockQty !== undefined && stockQty <= 0) {
      toast.error("Produto indisponível no estoque!");
      return;
    }
    setCart((c) => {
      const found = c.find((i) => i.name === name);
      if (found) {
        if (stockQty !== undefined && found.qty >= stockQty) {
          toast.warning(`Apenas ${stockQty} unidades em estoque!`);
          return c;
        }
        return c.map((i) => (i.name === name ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...c, { id, name, price, qty: 1 }];
    });
  };

  const addList = (listaName: string, productNames: string[]) => {
    let addedCount = 0;
    productNames.forEach(pName => {
      const item = items.find(i => i.name === pName);
      if (item && item.qty > 0) {
        add(item.name, item.price, item.qty, item.id);
        addedCount++;
      }
    });
    if (addedCount > 0) toast.success(`Itens da ${listaName} adicionados!`);
  };

  const dec = (name: string) =>
    setCart((c) => c.flatMap((i) => (i.name === name ? (i.qty > 1 ? [{ ...i, qty: i.qty - 1 }] : []) : [i])));
  const remove = (name: string) => setCart((c) => c.filter((i) => i.name !== name));

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === "Fiado") {
      setIsFiadoModalOpen(true);
      return;
    }
    await processCheckout(paymentMethod);
  };

  const processCheckout = async (method: string, fiadoId?: string) => {
    toast.promise(
      async () => {
        await checkout(cart, method, fiadoId);
        setCart([]);
        if (fiadoId) setIsFiadoModalOpen(false);
      },
      {
        loading: 'Salvando venda...',
        success: 'Venda realizada com sucesso!',
        error: 'Erro ao salvar venda.',
      }
    );
  };



  const searchResults = useMemo(() => {
    if (!q) return [];
    return items.filter(i => i.name.toLowerCase().includes(q.toLowerCase()));
  }, [items, q]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchResults.length > 0) {
      const p = searchResults[0];
      if (p.qty > 0) {
        add(p.name, p.price, p.qty, p.id);
        setQ("");
        toast.success(`${p.name} adicionado!`);
      } else {
        toast.error("Produto sem estoque!");
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_380px]"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight glow-text">PDV</h1>
            <p className="text-sm text-muted-foreground">Venda rápida e fluida.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsNewServiceModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-electric to-aqua px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(34,211,238,0.4)] transition hover:opacity-90 w-fit"
          >
            <Plus className="h-4 w-4" />
            Adicionar Produto/Serviço
          </motion.button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder="Digite o nome do produto..."
            className="w-full rounded-3xl border-2 border-electric/30 bg-surface/80 py-6 pl-14 pr-5 text-xl placeholder:text-muted-foreground focus:border-electric focus:outline-none focus:ring-4 focus:ring-electric/20 card-inset shadow-lg transition-all"
          />
          {q && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-surface border border-border/60 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
              {searchResults.map((p, idx) => (
                <button
                  key={p.id || p.name}
                  disabled={p.qty <= 0}
                  onClick={() => { add(p.name, p.price, p.qty, p.id); setQ(""); }}
                  className={`w-full flex items-center justify-between p-5 transition border-b border-border/40 last:border-0 disabled:opacity-50 disabled:cursor-not-allowed ${idx === 0 ? "bg-electric/5" : "hover:bg-elevated"}`}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-bold text-lg">{p.name}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.qty > 0 ? "bg-aqua/10 text-aqua" : "bg-destructive/10 text-destructive"}`}>
                      {p.qty > 0 ? `${p.qty} em estoque` : "Esgotado"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-electric">R$ {p.price.toFixed(2)}</span>
                    {idx === 0 && <span className="block text-[10px] uppercase font-bold text-muted-foreground mt-1">Pressione Enter para adicionar</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {!q && (
          <>
            {services.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Serviços rápidos</p>
                  <div className="rounded-full bg-electric/10 px-3 py-1 text-xs font-bold text-electric">
                    Xerox hoje: {xeroxCount}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {services.map((s) => {
                    const Icon = iconMap[s.icon] || Copy;
                    return (
                      <button
                        key={s.name}
                        onClick={() => add(s.name, s.price)}
                        className="group flex flex-col items-center justify-center gap-3 rounded-3xl border border-aqua/20 bg-surface/40 p-5 text-center transition hover:border-aqua/50 hover:bg-surface/60 hover:scale-[1.02] card-inset"
                      >
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-aqua/10 text-aqua transition-colors group-hover:bg-aqua/20">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground transition-colors group-hover:text-aqua">{s.name}</p>
                          <p className="text-[11px] font-black text-muted-foreground">R$ {s.price.toFixed(2)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {listasEscolares.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Listas Escolares</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {listasEscolares.map((lista) => (
                    <button
                      key={lista.name}
                      onClick={() => addList(lista.name, lista.items)}
                      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface/70 p-4 transition hover:border-amber-400/50 hover:bg-elevated card-inset"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-400/20 text-amber-500">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold">{lista.name}</p>
                        <p className="text-xs text-muted-foreground">{lista.items.length} itens inclusos</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quickProducts.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Produtos populares</p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {quickProducts.map((pName) => {
                    const p = items.find(i => i.name === pName);
                    if (!p) return null;
                    return (
                      <button
                        key={p.name}
                        disabled={p.qty <= 0}
                        onClick={() => add(p.name, p.price, p.qty, p.id)}
                        className="rounded-2xl border border-border/60 bg-surface/70 p-4 text-left transition hover:border-electric/50 hover:bg-elevated card-inset disabled:opacity-50 disabled:cursor-not-allowed group relative"
                      >
                        <p className="text-sm font-semibold truncate">{p.name}</p>
                        <p className="mt-1 text-xs text-aqua">R$ {p.price.toFixed(2)}</p>
                        {p.qty <= 0 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-2xl backdrop-blur-[1px]">
                            <span className="flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-full"><PackageX className="w-3 h-3"/> Indisponível</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart */}
      <aside className="lg:sticky lg:top-20 h-fit rounded-3xl border border-border/60 bg-surface/80 p-6 card-inset">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Carrinho</h2>
          <span className="rounded-full bg-electric/20 px-2.5 py-0.5 text-xs font-semibold text-electric">
            {cart.reduce((s, i) => s + i.qty, 0)} itens
          </span>
        </div>

        <ul className="max-h-[42vh] space-y-2 overflow-y-auto pr-1">
          <AnimatePresence>
            {cart.length === 0 && (
              <motion.li 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground"
              >
                Carrinho vazio
              </motion.li>
            )}
            {cart.map((i) => (
              <motion.li 
                key={i.name} 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="rounded-2xl glass p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{i.name}</p>
                    <p className="text-xs text-muted-foreground">R$ {i.price.toFixed(2)} un.</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => remove(i.name)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-full border border-border/60 bg-surface/50 p-0.5">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => dec(i.name)} className="grid h-7 w-7 place-items-center rounded-full hover:bg-elevated">
                      <Minus className="h-3.5 w-3.5" />
                    </motion.button>
                    <span className="w-6 text-center text-sm font-semibold">{i.qty}</span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        const itemStock = items.find(stock => stock.name === i.name);
                        add(i.name, i.price, itemStock?.qty, i.id);
                      }}
                      className="grid h-7 w-7 place-items-center rounded-full hover:bg-elevated"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </motion.button>
                  </div>
                  <p className="text-sm font-bold text-aqua">R$ {(i.price * i.qty).toFixed(2)}</p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <div className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Desconto</span>
            <span>R$ 0,00</span>
          </div>
          <div className="flex items-end justify-between pt-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Total</span>
            <span className="text-2xl font-extrabold">R$ {subtotal.toFixed(2)}</span>
          </div>
        </div>


        <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Forma de Pagamento</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "Dinheiro", icon: Wallet },
              { id: "Cartão", icon: CreditCard },
              { id: "Pix", icon: Smartphone },
              { id: "Fiado", icon: ReceiptText }
            ].map(m => (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                key={m.id}
                onClick={() => setPaymentMethod(m.id as any)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border py-3 transition-all ${paymentMethod === m.id ? "border-aqua bg-aqua/10 text-aqua shadow-[0_0_15px_-5px_rgba(34,211,238,0.4)]" : "border-border/60 bg-elevated/40 text-muted-foreground hover:bg-elevated"}`}
              >
                <m.icon className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase">{m.id}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCheckout} 
          disabled={cart.length === 0} 
          className="mt-6 flex w-full flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-r from-electric to-aqua py-3.5 shadow-[0_10px_30px_-10px] shadow-electric/60 transition disabled:opacity-50 btn-glow"
        >
          <div className="flex items-center gap-2 text-sm font-black text-background">
            <CreditCard className="h-4 w-4" />
            Finalizar Venda
          </div>
          <span className="text-[10px] font-bold uppercase opacity-80 text-background">Pagar com {paymentMethod}</span>
        </motion.button>
      </aside>

      {/* Modal Adicionar Produto/Serviço */}
      <AnimatePresence>
        {isNewServiceModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-surface p-6 shadow-2xl relative glass-card"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Novo Serviço/Produto</h2>
                <button 
                  onClick={() => setIsNewServiceModalOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition"
                >
                  <PackageX className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddNewService} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-muted-foreground">Nome do Produto/Serviço</label>
                  <input
                    type="text"
                    required
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-elevated p-3 focus:border-electric focus:outline-none transition"
                    placeholder="Ex: Plastificação"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-muted-foreground">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-elevated p-3 focus:border-electric focus:outline-none transition"
                    placeholder="Ex: 5,00"
                  />
                </div>
                <div className="mt-6 flex justify-end">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="rounded-2xl bg-electric px-6 py-3 font-bold text-white shadow-lg shadow-electric/30 transition hover:bg-electric/90 w-full"
                  >
                    Salvar novo produto
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Selecionar Cliente Fiado */}
      <AnimatePresence>
        {isFiadoModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-surface p-6 shadow-2xl relative glass-card"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Venda no Fiado</h2>
                <button 
                  onClick={() => setIsFiadoModalOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition"
                >
                  <PackageX className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-muted-foreground">Selecione o Cliente</label>
                  <select
                    value={selectedFiadoClient}
                    onChange={(e) => setSelectedFiadoClient(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-elevated p-3 focus:border-electric focus:outline-none transition"
                  >
                    <option value="" disabled>Selecione um cliente...</option>
                    {fiados?.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-6 flex justify-end">
                  <motion.button 
                    whileHover={selectedFiadoClient ? { scale: 1.02 } : {}}
                    whileTap={selectedFiadoClient ? { scale: 0.95 } : {}}
                    onClick={() => processCheckout("Fiado PDV", selectedFiadoClient)}
                    disabled={!selectedFiadoClient}
                    className="rounded-2xl bg-electric px-6 py-3 font-bold text-white shadow-lg shadow-electric/30 transition hover:bg-electric/90 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirmar Venda
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}