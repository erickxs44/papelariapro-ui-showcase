import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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

const services = [
  { name: "Xerox P&B", price: 0.5, icon: Copy },
  { name: "Xerox Color", price: 1.5, icon: Palette },
  { name: "Impressão", price: 2.0, icon: Printer },
  { name: "Encadernação", price: 8.0, icon: BookOpen },
];

const quickProducts = [
  "Caderno Universitário 200fls",
  "Caneta BIC Azul",
  "Lápis HB",
  "Borracha Branca",
  "Régua 30cm",
  "Marca Texto",
  "Cola Bastão",
  "Tesoura Escolar",
];

const listasEscolares = [
  {
    name: "Lista Básica 1º Ano",
    items: ["Caderno Universitário 200fls", "Lápis HB", "Borracha Branca", "Tesoura Escolar"]
  },
  {
    name: "Kit Desenho",
    items: ["Lápis de Cor 24 cores", "Tinta Guache 6 cores", "Lápis HB"]
  }
];

type CartItem = { id?: string; name: string; price: number; qty: number };

function Pdv() {
  const { items, checkout, xeroxCount } = useStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [q, setQ] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Dinheiro" | "Cartão" | "Pix">("Dinheiro");

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
    toast.promise(
      async () => {
        await checkout(cart, paymentMethod);
        setCart([]);
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
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PDV</h1>
          <p className="text-sm text-muted-foreground">Venda rápida e fluida.</p>
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
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Serviços rápidos</p>
                <div className="rounded-full bg-electric/10 px-3 py-1 text-xs font-bold text-electric">
                  Xerox hoje: {xeroxCount}
                </div>
              </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {services.map((s) => (
              <button
                key={s.name}
                onClick={() => add(s.name, s.price)}
                className="group flex flex-col items-center justify-center gap-3 rounded-3xl border border-aqua/20 bg-surface/40 p-5 text-center transition hover:border-aqua/50 hover:bg-surface/60 hover:scale-[1.02] card-inset"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-aqua/10 text-aqua transition-colors group-hover:bg-aqua/20">
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground transition-colors group-hover:text-aqua">{s.name}</p>
                  <p className="text-[11px] font-black text-muted-foreground">R$ {s.price.toFixed(2)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

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
          {cart.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              Carrinho vazio
            </li>
          )}
          {cart.map((i) => (
            <li key={i.name} className="rounded-2xl bg-elevated/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{i.name}</p>
                  <p className="text-xs text-muted-foreground">R$ {i.price.toFixed(2)} un.</p>
                </div>
                <button onClick={() => remove(i.name)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1 rounded-full border border-border/60 bg-surface p-0.5">
                  <button onClick={() => dec(i.name)} className="grid h-7 w-7 place-items-center rounded-full hover:bg-elevated">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{i.qty}</span>
                  <button
                    onClick={() => {
                      const itemStock = items.find(stock => stock.name === i.name);
                      // Se for serviço (sem item no stock) ou tiver estoque, adiciona
                      add(i.name, i.price, itemStock?.qty, i.id);
                    }}
                    className="grid h-7 w-7 place-items-center rounded-full hover:bg-elevated"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-sm font-bold">R$ {(i.price * i.qty).toFixed(2)}</p>
              </div>
            </li>
          ))}
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
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "Dinheiro", icon: Wallet },
              { id: "Cartão", icon: CreditCard },
              { id: "Pix", icon: Smartphone }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setPaymentMethod(m.id as any)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border py-3 transition-all ${paymentMethod === m.id ? "border-aqua bg-aqua/10 text-aqua shadow-[0_0_15px_-5px_rgba(34,211,238,0.4)]" : "border-border/60 bg-elevated/40 text-muted-foreground hover:bg-elevated"}`}
              >
                <m.icon className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase">{m.id}</span>
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleCheckout} 
          disabled={cart.length === 0} 
          className="mt-6 flex w-full flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-r from-electric to-aqua py-3.5 shadow-[0_10px_30px_-10px] shadow-electric/60 transition hover:scale-[1.01] disabled:opacity-50 disabled:scale-100"
        >
          <div className="flex items-center gap-2 text-sm font-black text-background">
            <CreditCard className="h-4 w-4" />
            Finalizar Venda
          </div>
          <span className="text-[10px] font-bold uppercase opacity-80 text-background">Pagar com {paymentMethod}</span>
        </button>
      </aside>
    </div>
  );
}