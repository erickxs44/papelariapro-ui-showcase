import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "./supabase";

export type Cat = "Todos" | "Escolar" | "Escritório" | "Arte" | "Informática" | "Serviço";

export type Item = {
  id?: string;
  name: string;
  cat: Exclude<Cat, "Todos">;
  costPrice: number;
  price: number;
  qty: number;
  level: "Cheio" | "Médio" | "Baixo" | "Indisponível";
};

type StoreContextType = {
  items: Item[];
  addStock: (item: Item) => void;
  checkout: (cart: { id?: string; name: string; qty: number; price: number }[]) => Promise<void>;
  xeroxCount: number;
  addExpense: (desc: string, value: number) => Promise<void>;
  expenses: { desc: string; value: number; date: Date }[];
  sales: { value: number; date: Date }[];
  closeCashier: (period: "Hoje" | "7D" | "30D") => Promise<void>;
};

export function calculateLevel(qty: number): Item["level"] {
  if (qty <= 0) return "Indisponível";
  if (qty <= 10) return "Baixo";
  if (qty <= 30) return "Médio";
  return "Cheio";
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [xeroxCount, setXeroxCount] = useState(0);
  const [expenses, setExpenses] = useState<{ desc: string; value: number; date: Date }[]>([]);
  const [sales, setSales] = useState<{ value: number; date: Date }[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('produtos').select('*');
      if (!error && data) {
        const loadedItems: Item[] = data.map((d: any) => ({
          id: d.id,
          name: d.nome,
          cat: "Escolar",
          costPrice: d.preco_custo,
          price: d.preco_venda,
          qty: d.estoque_atual,
          level: calculateLevel(d.estoque_atual)
        }));
        setItems(loadedItems);
      }
    };

    const fetchExpenses = async () => {
      const { data, error } = await supabase.from('despesas').select('*');
      if (!error && data) {
        setExpenses(data.map((d: any) => ({
          desc: d.descricao,
          value: d.valor,
          date: new Date(d.data_pagamento)
        })));
      }
    };

    const fetchSales = async () => {
      const { data, error } = await supabase.from('vendas').select('valor_total, data_venda');
      if (!error && data) {
        setSales(data.map((d: any) => ({
          value: d.valor_total,
          date: new Date(d.data_venda)
        })));
      }
    };

    fetchProducts();
    fetchExpenses();
    fetchSales();
  }, []);

  const addStock = async (item: Item) => {
    // Add optimistically without ID
    setItems((prev) => [item, ...prev]);

    const { data, error } = await supabase.from('produtos').insert({
      nome: item.name,
      preco_custo: item.costPrice,
      preco_venda: item.price,
      estoque_atual: item.qty,
      estoque_minimo: 5
    }).select();

    if (!error && data) {
      const newD = data[0];
      setItems((prev) => prev.map(i => i.name === item.name && !i.id ? { ...i, id: newD.id } : i));
    }
  };

  const checkout = async (cart: { id?: string; name: string; qty: number; price: number }[]) => {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

    setItems((prev) =>
      prev.map((item) => {
        const cartItem = cart.find((c) => c.name === item.name);
        if (cartItem) {
          const newQty = Math.max(0, item.qty - cartItem.qty);
          return { ...item, qty: newQty, level: calculateLevel(newQty) };
        }
        return item;
      })
    );
    // Optimistic sales append:
    setSales(prev => [{ value: total, date: new Date() }, ...prev]);

    const xeroxPAndB = cart.find(c => c.name === "Xerox P&B");
    const xeroxColor = cart.find(c => c.name === "Xerox Color");
    
    let addedXerox = 0;
    if (xeroxPAndB) addedXerox += xeroxPAndB.qty;
    if (xeroxColor) addedXerox += xeroxColor.qty;
    if (addedXerox > 0) setXeroxCount(prev => prev + addedXerox);

    const { data: vendaData, error: vendaError } = await supabase.from('vendas').insert({
      valor_total: total,
      metodo_pagamento: 'Dinheiro',
      data_venda: new Date().toISOString()
    }).select();

    if (!vendaError && vendaData && vendaData.length > 0) {
      const vendaId = vendaData[0].id;
      for (const cartItem of cart) {
        if (cartItem.id) {
          await supabase.from('itens_venda').insert({
            venda_id: vendaId,
            produto_id: cartItem.id,
            quantidade: cartItem.qty,
            preco_unitario: cartItem.price
          });

          // Stock update uses local state current items qty before deduction to calculate correct deduction, 
          // or just find by id.
          // Since we already optimistically reduced, we can find the item now:
          const itemNow = items.find(i => i.id === cartItem.id);
          const oldStock = itemNow ? itemNow.qty : cartItem.qty; // Note: items in state hasn't updated in closure if we use `items` here
          // Wait, supabase will just set it to the new quantity
        }
      }
      
      // Separate loop to update stock on supabase without depending on local closure state for accuracy:
      // Actually, it's safer to just fetch or use the quantity we knew:
      for (const cartItem of cart) {
        if (cartItem.id) {
            // we can do a raw SQL but supabase JS doesn't support decrement directly without RPC.
            // Let's just fetch current and subtract, or rely on our initial items.
            const itemInStore = items.find(i => i.id === cartItem.id);
            if (itemInStore) {
                const newStock = Math.max(0, itemInStore.qty - cartItem.qty);
                await supabase.from('produtos').update({ estoque_atual: newStock }).eq('id', cartItem.id);
            }
        }
      }
    }
  };

  const addExpense = async (desc: string, value: number) => {
    setExpenses(prev => [{ desc, value, date: new Date() }, ...prev]);
    await supabase.from('despesas').insert({
      descricao: desc,
      valor: value,
      categoria: 'Geral',
      data_pagamento: new Date().toISOString()
    });
  };

  const closeCashier = async (period: "Hoje" | "7D" | "30D") => {
    const now = new Date();
    let startDate = new Date();
    if (period === "Hoje") {
      startDate.setHours(0,0,0,0);
    } else if (period === "7D") {
      startDate.setDate(now.getDate() - 7);
    } else if (period === "30D") {
      startDate.setDate(now.getDate() - 30);
    }

    const { data: salesData } = await supabase.from('vendas').select('valor_total').gte('data_venda', startDate.toISOString());
    let currentSalesTotal = 0;
    if (salesData) {
      currentSalesTotal = salesData.reduce((sum: number, v: any) => sum + v.valor_total, 0);
    }

    const { data: expData } = await supabase.from('despesas').select('valor').gte('data_pagamento', startDate.toISOString());
    let currentExpensesTotal = 0;
    if (expData) {
      currentExpensesTotal = expData.reduce((sum: number, e: any) => sum + e.valor, 0);
    }

    const lucro = currentSalesTotal - currentExpensesTotal;
    
    const html = `
      <h1>Relatório de Fechamento de Caixa — PapelariaPro</h1>
      <p><strong>Período:</strong> ${period}</p>
      <p><strong>Gerado em:</strong> ${now.toLocaleString('pt-BR')}</p>
      <hr />
      <p><strong>Faturamento Total:</strong> R$ ${currentSalesTotal.toFixed(2)}</p>
      <p><strong>Despesas Totais:</strong> R$ ${currentExpensesTotal.toFixed(2)}</p>
      <p><strong>Lucro Real:</strong> R$ ${lucro.toFixed(2)}</p>
      <hr />
      <p><em>Relatório gerado automaticamente pelo sistema.</em></p>
    `;

    try {
      const res = await fetch('/api/resend', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer re_Z4Puye3f_JAyWq8NNt4gTNQwXhvtNKPjC',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: 'papelaria573@gmail.com',
          subject: `Fechamento de Caixa — ${new Date().toLocaleDateString('pt-BR')}`,
          html: html,
        })
      });
      if (!res.ok) {
        throw new Error("Erro ao disparar API de e-mail");
      }
    } catch (err) {
      console.error("Erro ao enviar e-mail:", err);
      throw err;
    }
  };

  return (
    <StoreContext.Provider value={{ items, addStock, checkout, xeroxCount, addExpense, expenses, sales, closeCashier }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
