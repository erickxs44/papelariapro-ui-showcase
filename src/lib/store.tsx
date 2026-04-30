import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "./supabase";
import { toast } from "sonner";

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
  checkout: (cart: { id?: string; name: string; qty: number; price: number }[], paymentMethod?: string) => Promise<void>;
  xeroxCount: number;
  addExpense: (desc: string, value: number) => Promise<void>;
  expenses: { desc: string; value: number; date: Date }[];
  sales: { value: number; date: Date }[];
  closeCashier: (period: "Hoje" | "7D" | "30D") => Promise<void>;
  resetData: () => Promise<void>;
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

  const checkout = async (cart: { id?: string; name: string; qty: number; price: number }[], paymentMethod: string = "Dinheiro") => {
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
      metodo_pagamento: paymentMethod,
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

    const { data: salesData } = await supabase.from('vendas').select('valor_total, metodo_pagamento').gte('data_venda', startDate.toISOString());
    let currentSalesTotal = 0;
    const salesByMethod = { Pix: 0, Cartão: 0, Dinheiro: 0 };
    
    if (salesData) {
      currentSalesTotal = salesData.reduce((sum: number, v: any) => sum + v.valor_total, 0);
      salesData.forEach((v: any) => {
        if (v.metodo_pagamento === "Pix") salesByMethod.Pix += v.valor_total;
        else if (v.metodo_pagamento === "Cartão") salesByMethod.Cartão += v.valor_total;
        else if (v.metodo_pagamento === "Dinheiro") salesByMethod.Dinheiro += v.valor_total;
      });
    }

    const { data: expData } = await supabase.from('despesas').select('valor').gte('data_pagamento', startDate.toISOString());
    let currentExpensesTotal = 0;
    if (expData) {
      currentExpensesTotal = expData.reduce((sum: number, e: any) => sum + e.valor, 0);
    }

    const lucro = currentSalesTotal - currentExpensesTotal;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#0A0A0A" style="background-color: #0A0A0A;">
              <tr>
                  <td align="center" style="padding: 40px 20px;">
                      <!-- Main Container Card -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#1E1E1E" style="max-width: 600px; background-color: #1E1E1E; border-radius: 16px; border: 1px solid #333333; overflow: hidden; text-align: left;">
                          <tr>
                              <td style="padding: 40px 30px;">
                                  
                                  <!-- Header -->
                                  <h1 style="color: #8b8bff; font-size: 28px; font-weight: 700; margin: 0 0 10px 0; line-height: 1.2;">Relatório de Fechamento</h1>
                                  <div style="font-size: 16px; color: #E0E0E0; margin-bottom: 25px;">
                                      <strong>Data:</strong> ${period === 'Hoje' ? 'Hoje' : `Últimos ${period === '7D' ? '7' : '30'} dias`}
                                  </div>

                                  <div style="height: 1px; background-color: #333333; margin: 0 0 25px 0; width: 100%;"></div>

                                  <!-- Resumo de Vendas -->
                                  <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 20px 0; color: #FFFFFF;">Resumo de Vendas:</h2>

                                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 35px;">
                                      <tr>
                                          <td style="padding-bottom: 15px; font-size: 18px; color: #FFFFFF;">
                                              <span style="display: inline-block; width: 30px; font-size: 20px;">🟩</span> <strong>PIX:</strong>
                                          </td>
                                          <td align="right" style="padding-bottom: 15px; font-size: 18px; color: #FFFFFF; font-weight: bold;">
                                              R$ ${salesByMethod.Pix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </td>
                                      </tr>
                                      <tr>
                                          <td style="padding-bottom: 15px; font-size: 18px; color: #FFFFFF;">
                                              <span style="display: inline-block; width: 30px; font-size: 20px;">💳</span> <strong>Cartão:</strong>
                                          </td>
                                          <td align="right" style="padding-bottom: 15px; font-size: 18px; color: #FFFFFF; font-weight: bold;">
                                              R$ ${salesByMethod.Cartão.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </td>
                                      </tr>
                                      <tr>
                                          <td style="font-size: 18px; color: #FFFFFF;">
                                              <span style="display: inline-block; width: 30px; font-size: 20px;">💵</span> <strong>Dinheiro:</strong>
                                          </td>
                                          <td align="right" style="font-size: 18px; color: #FFFFFF; font-weight: bold;">
                                              R$ ${salesByMethod.Dinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </td>
                                      </tr>
                                  </table>

                                  <!-- Box de Resumo Financeiro -->
                                  <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#2A2A2A" style="background-color: #2A2A2A; border-radius: 12px; border: 1px solid #404040;">
                                      <tr>
                                          <td style="padding: 25px;">
                                              
                                              <div style="font-size: 18px; font-weight: 700; color: #FFFFFF; margin-bottom: 15px;">
                                                  Total em Vendas: R$ ${currentSalesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                              </div>
                                              
                                              <div style="font-size: 18px; font-weight: 700; color: #f87171; margin-bottom: 25px;">
                                                  Total de Despesas: R$ ${currentExpensesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                              </div>
                                              
                                              <div>
                                                  <div style="font-size: 16px; font-weight: 700; color: #4ade80; margin-bottom: 8px;">
                                                      Lucro (Vendas - Despesas):
                                                    </div>
                                                  <div style="font-size: 26px; font-weight: 800; color: #4ade80;">
                                                      R$ ${lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                  </div>
                                              </div>

                                          </td>
                                      </tr>
                                  </table>
                                  
                                  <div style="text-align: center; margin-top: 35px; color: #888888; font-size: 12px; line-height: 1.5;">
                                      Relatório gerado automaticamente pelo sistema PapelariaPro.
                                  </div>

                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      </html>
    `;

    try {
      const res = await fetch('/api/resend', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer re_Z4Puye3f_JAyWq8NNt4gTNQwXhvtNKPjC',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Papelaria Cash <onboarding@resend.dev>',
          to: 'papelaria573@gmail.com',
          subject: `Fechamento de Caixa — ${new Date().toLocaleDateString('pt-BR')}`,
          html: html,
        })
      });
      if (!res.ok) {
        throw new Error("Erro ao disparar API de e-mail");
      }
      toast.success("Relatório de fechamento de caixa enviado por e-mail");
    } catch (err) {
      console.error("Erro ao enviar e-mail:", err);
      throw err;
    }
  };

  const resetData = async () => {
    // Deletar em ordem para evitar erros de FK
    await supabase.from('itens_venda').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('vendas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('despesas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('produtos').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    setItems([]);
    setExpenses([]);
    setSales([]);
    setXeroxCount(0);
  };

  return (
    <StoreContext.Provider value={{ items, addStock, checkout, xeroxCount, addExpense, expenses, sales, closeCashier, resetData }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
