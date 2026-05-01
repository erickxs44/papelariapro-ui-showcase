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
  addQuickSale: (desc: string, value: number) => Promise<void>;
  expenses: { desc: string; value: number; date: Date }[];
  sales: { value: number; date: Date }[];
  fiados: any[];
  closeCashier: (period: "Hoje" | "7D" | "30D") => Promise<void>;
  resetData: () => Promise<void>;
  addFiado: (fiado: any) => Promise<void>;
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
  const [fiados, setFiados] = useState<any[]>([]);

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

    const fetchFiados = async () => {
      const { data, error } = await supabase.from('fiados').select('*');
      if (!error && data) {
        setFiados(data.map((d: any) => ({
          id: d.id,
          name: d.nome,
          phone: d.telefone,
          amount: d.valor,
          dueDate: new Date(d.data_vencimento),
          status: d.status
        })));
      }
    };

    fetchProducts();
    fetchExpenses();
    fetchSales();
    fetchFiados();
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

  const addQuickSale = async (desc: string, value: number) => {
    setSales(prev => [...prev, { value, date: new Date() }]);
    await supabase.from('vendas').insert({
      valor_total: value,
      metodo_pagamento: 'Dinheiro',
      data_venda: new Date().toISOString()
    });
  };

  const addFiado = async (fiado: any) => {
    setFiados(prev => [fiado, ...prev]);
    await supabase.from('fiados').insert({
      nome: fiado.name,
      telefone: fiado.phone,
      valor: fiado.amount,
      data_vencimento: fiado.dueDate.toISOString(),
      status: fiado.status
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

    const { data: expData } = await supabase.from('despesas').select('descricao, valor').gte('data_pagamento', startDate.toISOString());
    let currentExpensesTotal = 0;
    let topExpenses: { descricao: string; valor: number }[] = [];
    if (expData) {
      currentExpensesTotal = expData.reduce((sum: number, e: any) => sum + e.valor, 0);
      topExpenses = [...expData].sort((a, b) => b.valor - a.valor).slice(0, 3);
    }

    const lucro = currentSalesTotal - currentExpensesTotal;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @keyframes pulse {
              0% { text-shadow: 0 0 10px rgba(74, 222, 128, 0.5); }
              50% { text-shadow: 0 0 25px rgba(74, 222, 128, 0.9), 0 0 40px rgba(74, 222, 128, 0.4); }
              100% { text-shadow: 0 0 10px rgba(74, 222, 128, 0.5); }
            }
          </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#0f172a">
              <tr>
                  <td align="center" style="padding: 40px 20px;">
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #1e293b; border-radius: 24px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                          <tr>
                              <td style="padding: 40px 30px; text-align: center;">
                                  <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 30px 0; letter-spacing: -0.025em;">🚀 RESUMO DO DIA FINALIZADO 🚀</h1>
                                  
                                  <!-- Performance Cards -->
                                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                                      <tr>
                                          <td style="padding-bottom: 15px;">
                                              <div style="background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 16px; padding: 20px; text-align: center;">
                                                  <div style="font-size: 13px; font-weight: 700; color: #4ade80; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px;">💰 ENTRADAS TOTAIS</div>
                                                  <div style="font-size: 28px; font-weight: 800; color: #ffffff;">R$ ${currentSalesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                              </div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td style="padding-bottom: 15px;">
                                              <div style="background-color: rgba(153, 27, 27, 0.1); border: 1px solid rgba(153, 27, 27, 0.2); border-radius: 16px; padding: 20px; text-align: center;">
                                                  <div style="font-size: 13px; font-weight: 700; color: #f87171; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px;">💸 DESPESAS (SAÍDAS)</div>
                                                  <div style="font-size: 28px; font-weight: 800; color: #ffffff;">R$ ${currentExpensesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                              </div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td>
                                              <div style="background: linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%); border: 2px solid #4ade80; border-radius: 20px; padding: 25px; text-align: center; box-shadow: 0 0 30px rgba(74, 222, 128, 0.1);">
                                                  <div style="font-size: 14px; font-weight: 800; color: #4ade80; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 10px;">📈 SALDO LÍQUIDO</div>
                                                  <div style="font-size: 42px; font-weight: 900; color: #4ade80; text-shadow: 0 0 20px rgba(74, 222, 128, 0.4);">R$ ${lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                              </div>
                                          </td>
                                      </tr>
                                  </table>

                                  <!-- Payment Methods -->
                                  <div style="text-align: left; background-color: #0f172a; border-radius: 20px; padding: 25px; margin-bottom: 30px;">
                                      <h3 style="font-size: 16px; font-weight: 700; color: #94a3b8; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 0.05em;">💳 Meios de Pagamento</h3>
                                      <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                          <tr>
                                              <td style="padding-bottom: 12px; font-size: 16px; color: #e2e8f0;">💠 Pix</td>
                                              <td align="right" style="padding-bottom: 12px; font-size: 16px; font-weight: 700; color: #ffffff;">R$ ${salesByMethod.Pix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                          </tr>
                                          <tr>
                                              <td style="padding-bottom: 12px; font-size: 16px; color: #e2e8f0;">💵 Espécie</td>
                                              <td align="right" style="padding-bottom: 12px; font-size: 16px; font-weight: 700; color: #ffffff;">R$ ${salesByMethod.Dinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                          </tr>
                                          <tr>
                                              <td style="font-size: 16px; color: #e2e8f0;">💳 Cartão</td>
                                              <td align="right" style="font-size: 16px; font-weight: 700; color: #ffffff;">R$ ${salesByMethod.Cartão.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                          </tr>
                                      </table>
                                  </div>

                                  <!-- Top Expenses -->
                                  ${topExpenses.length > 0 ? `
                                  <div style="text-align: left; margin-bottom: 40px;">
                                      <h3 style="font-size: 16px; font-weight: 700; color: #94a3b8; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.05em;">🔥 Top Despesas do Dia</h3>
                                      <div style="background-color: rgba(248, 113, 113, 0.05); border-radius: 16px; padding: 10px;">
                                          ${topExpenses.map(e => `
                                          <div style="display: flex; justify-content: space-between; padding: 12px 15px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                              <span style="color: #cbd5e1; font-size: 14px;">📍 ${e.descricao}</span>
                                              <span style="color: #f87171; font-size: 14px; font-weight: 700;">R$ ${e.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                          </div>
                                          `).join('')}
                                      </div>
                                  </div>
                                  ` : ''}

                                  <div style="margin-top: 40px; border-top: 1px solid #334155; padding-top: 30px;">
                                      <p style="font-size: 18px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0;">Bom descanso! Amanhã venderemos ainda mais! 🚀</p>
                                      <p style="font-size: 12px; color: #64748b; margin: 0;">Relatório gerado automaticamente por ✨ Papelaria Cash</p>
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
          subject: `📑 Fechamento de Caixa - Papelaria Cash - ✨ ${new Date().toLocaleDateString('pt-BR')}`,
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
    try {
      // 1. Limpeza de Banco de Dados (Supabase)
      // Deletar em ordem para evitar erros de integridade referencial (FK)
      await supabase.from('itens_venda').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('vendas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('despesas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('produtos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Tentativa de limpar fiados (caso a tabela exista)
      try {
        await supabase.from('fiados').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (e) {
        console.warn("Tabela 'fiados' não encontrada ou erro ao deletar.");
      }

      // 2. Limpeza de Persistência Local
      localStorage.clear();
      sessionStorage.clear();

      // 3. Reset de Estado (State)
      setItems([]);
      setExpenses([]);
      setSales([]);
      setFiados([]);
      setXeroxCount(0);

      // 4. Recarregamento Total (Hard Refresh)
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);

    } catch (error) {
      console.error("Erro crítico durante o reset:", error);
      throw error;
    }
  };

  return (
    <StoreContext.Provider value={{ items, addStock, checkout, xeroxCount, addExpense, addQuickSale, expenses, sales, fiados, closeCashier, resetData, addFiado }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
