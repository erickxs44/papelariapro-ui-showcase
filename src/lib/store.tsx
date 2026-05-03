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

export type Movement = {
  id?: string;
  clienteId?: string;
  type: "Venda Fiada" | "Pagamento de Fiado" | "Venda" | "Entrada" | "Saída";
  description: string;
  value: number;
  date: string;
};

type StoreContextType = {
  items: Item[];
  addStock: (item: Item) => void;
  checkout: (cart: { id?: string; name: string; qty: number; price: number }[], paymentMethod?: string, fiadoId?: string) => Promise<void>;
  xeroxCount: number;
  addExpense: (desc: string, value: number) => Promise<void>;
  addQuickSale: (desc: string, value: number) => Promise<void>;
  expenses: { desc: string; value: number; date: Date }[];
  sales: Movement[];
  fiados: any[];
  services: any[];
  quickProducts: string[];
  listasEscolares: any[];
  closeCashier: (period: "Hoje" | "7D" | "30D") => Promise<void>;
  resetData: () => Promise<void>;
  addFiado: (fiado: any) => Promise<void>;
  addFiadoTransaction: (fiadoId: string, amount: number, desc: string) => Promise<void>;
  payFiado: (fiadoId: string, amount: number) => Promise<void>;
  addService: (service: any) => void;
  discountStock: (itemId: string, qtyToDiscount: number) => Promise<void>;
  addStockSale: (itemName: string, value: number) => Promise<void>;
  getFiadoHistory: (fiadoId: string) => Promise<any[]>;
  registrarMovimentacao: (
    data: Date,
    descricao: string,
    valor: number,
    tipo: "Entrada" | "Saída" | "Venda" | "Venda Fiada" | "Pagamento de Fiado",
    detalhes?: { metodo_pagamento?: string, cliente_id?: string, categoria?: string }
  ) => Promise<string | null>;
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
  const [sales, setSales] = useState<Movement[]>([]);
  const [fiados, setFiados] = useState<any[]>([]);
  
  // Catalogs that should be clearable
  const [services, setServices] = useState<any[]>([]);
  const [quickProducts, setQuickProducts] = useState<string[]>([]);
  const [listasEscolares, setListasEscolares] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('produtos').select('*');
        if (!error && Array.isArray(data)) {
          const loadedItems: Item[] = data.map((d: any) => ({
            id: d.id,
            name: d.nome,
            cat: "Escolar" as const,
            costPrice: d.preco_custo ?? 0,
            price: d.preco_venda ?? 0,
            qty: d.estoque_atual ?? 0,
            level: calculateLevel(d.estoque_atual ?? 0)
          }));
          setItems(loadedItems);
        }
      } catch (e) {
        console.warn('Erro ao carregar produtos:', e);
      }
    };

    const fetchExpenses = async () => {
      try {
        const { data, error } = await supabase.from('despesas').select('*');
        if (!error && Array.isArray(data)) {
          setExpenses(data.map((d: any) => ({
            desc: d.descricao || 'Sem descrição',
            value: d.valor ?? 0,
            date: new Date(d.data_pagamento || Date.now())
          })));
        }
      } catch (e) {
        console.warn('Erro ao carregar despesas:', e);
      }
    };

    const fetchFiados = async () => {
      try {
        const { data, error } = await supabase.from('fiados').select('*');
        if (!error && Array.isArray(data)) {
          setFiados(data.map((d: any) => ({
            id: d.id,
            name: d.nome || 'Cliente',
            phone: d.telefone || '',
            amount: d.valor ?? 0,
            dueDate: new Date(d.data_vencimento || Date.now()),
            status: d.status || 'Pendente'
          })));
        }
      } catch (e) {
        // Table might not exist — that's OK
        console.warn('Tabela fiados não encontrada:', e);
      }
    };

    fetchProducts();
    fetchExpenses();
    fetchFiados();

    // Load movements from LocalStorage as priority for detailed reports
    const savedMovements = localStorage.getItem('papelaria_movements');
    if (savedMovements) {
      try {
        const parsed = JSON.parse(savedMovements);
        if (Array.isArray(parsed)) {
          // Sanitize each item — reject malformed entries instead of crashing
          const sanitized = parsed.filter((m: any) => m && typeof m === 'object' && typeof m.value === 'number').map((m: any) => ({
            ...m,
            description: (m.description || '').trim() || 'Sem descrição',
            value: m.value ?? 0,
            date: m.date || new Date().toISOString(),
          }));
          setSales(sanitized);
        } else {
          throw new Error('Not an array');
        }
      } catch {
        // Corrupted data — clear and start fresh from Supabase
        localStorage.removeItem('papelaria_movements');
        const fetchSalesFromDB = async () => {
          try {
            const { data, error } = await supabase.from('vendas').select('*');
            if (!error && Array.isArray(data)) {
              setSales(data.map((d: any) => ({
                id: d.id,
                clienteId: d.cliente_id,
                value: d.valor_total ?? 0,
                date: d.data_venda || new Date().toISOString(),
                type: d.metodo_pagamento?.includes('Fiado') ? 'Venda Fiada' as const : 'Venda' as const,
                description: (d.descricao || '').trim() || 'Venda PDV'
              })));
            }
          } catch (e) {
            console.warn('Erro ao carregar vendas do Supabase:', e);
          }
        };
        fetchSalesFromDB();
      }
    } else {
      // Fallback to Supabase if local is empty
      const fetchSalesFromDB = async () => {
        try {
          const { data, error } = await supabase.from('vendas').select('*');
          if (!error && Array.isArray(data)) {
            setSales(data.map((d: any) => ({
              id: d.id,
              clienteId: d.cliente_id,
              value: d.valor_total ?? 0,
              date: d.data_venda || new Date().toISOString(),
              type: d.metodo_pagamento?.includes('Fiado') ? 'Venda Fiada' as const : 'Venda' as const,
              description: (d.descricao || '').trim() || 'Venda PDV'
            })));
          }
        } catch (e) {
          console.warn('Erro ao carregar vendas do Supabase:', e);
        }
      };
      fetchSalesFromDB();
    }

    // Initialize catalogs if not reset
    if (!localStorage.getItem('reset_performed')) {
      setServices([
        { name: "Xerox P&B", price: 0.5, icon: "Copy" },
        { name: "Xerox Color", price: 1.5, icon: "Palette" },
        { name: "Impressão", price: 2.0, icon: "Printer" },
        { name: "Encadernação", price: 8.0, icon: "BookOpen" },
      ]);
      setQuickProducts([
        "Caderno Universitário 200fls",
        "Caneta BIC Azul",
        "Lápis HB",
        "Borracha Branca",
        "Régua 30cm",
        "Marca Texto",
        "Cola Bastão",
        "Tesoura Escolar",
      ]);
      setListasEscolares([
        {
          name: "Lista Básica 1º Ano",
          items: ["Caderno Universitário 200fls", "Lápis HB", "Borracha Branca", "Tesoura Escolar"]
        },
        {
          name: "Kit Desenho",
          items: ["Lápis de Cor 24 cores", "Tinta Guache 6 cores", "Lápis HB"]
        }
      ]);
    }
  }, []);

  const registrarMovimentacao = async (
    data: Date,
    descricao: string,
    valor: number,
    tipo: "Entrada" | "Saída" | "Venda" | "Venda Fiada" | "Pagamento de Fiado",
    detalhes: { metodo_pagamento?: string, cliente_id?: string, categoria?: string } = {}
  ): Promise<string | null> => {
    // CRITICAL: Use the exact user-provided description — never override
    const safeDesc = (descricao || '').trim() || 'Sem descrição';

    // 1. Atualização de Estado Reativa OBRIGATÓRIA (sem delay)
    if (tipo === "Saída") {
      setExpenses(prev => [{ desc: safeDesc, value: valor, date: data }, ...prev]);
    } else {
      const newMove: Movement = {
        id: crypto.randomUUID(),
        clienteId: detalhes.cliente_id,
        type: tipo,
        description: safeDesc,
        value: valor,
        date: data.toISOString()
      };
      setSales(prev => {
        const next = [newMove, ...prev];
        try { localStorage.setItem('papelaria_movements', JSON.stringify(next)); } catch {}
        return next;
      });
    }

    // 2. Persistência Atômica no Banco (wrapped in try/catch)
    let returnId = null;
    try {
      if (tipo === "Saída") {
        const { data: res } = await supabase.from('despesas').insert({
          descricao: safeDesc,
          valor,
          categoria: detalhes.categoria || 'Geral',
          data_pagamento: data.toISOString()
        }).select();
        if (res) returnId = res[0]?.id;
      } else {
        const { data: res } = await supabase.from('vendas').insert({
          valor_total: valor,
          metodo_pagamento: detalhes.metodo_pagamento || "Dinheiro",
          descricao: safeDesc,
          data_venda: data.toISOString(),
          cliente_id: detalhes.cliente_id || null
        }).select();
        if (res) returnId = res[0]?.id;
      }
    } catch (e) {
      console.warn('Erro ao persistir no Supabase:', e);
      // State was already updated optimistically, so the UI still works
    }
    return returnId;
  };

  const addStock = async (item: Item) => {
    // Add optimistically without ID
    setItems((prev) => [item, ...prev]);

    try {
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
    } catch (e) {
      console.warn('Erro ao salvar produto no Supabase:', e);
    }
  };

  const discountStock = async (itemId: string, qtyToDiscount: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    const newQty = Math.max(0, item.qty - qtyToDiscount);
    
    // Update local state optimistic
    setItems((prev) => 
      prev.map(i => i.id === itemId ? { ...i, qty: newQty, level: calculateLevel(newQty) } : i)
    );

    // Update DB
    try {
      await supabase.from('produtos').update({ estoque_atual: newQty }).eq('id', itemId);
    } catch (e) {
      console.warn('Erro ao atualizar estoque:', e);
    }
  };

  const checkout = async (cart: { id?: string; name: string; qty: number; price: number }[], paymentMethod: string = "Dinheiro", fiadoId?: string) => {
    const total = cart.reduce((s, i) => s + (i.price ?? 0) * (i.qty ?? 0), 0);

    if (fiadoId && paymentMethod === "Fiado PDV") {
      const fiado = fiados.find(f => f.id === fiadoId);
      if (fiado) {
        const newAmount = (fiado.amount ?? 0) + total;
        setFiados(prev => prev.map(f => f.id === fiadoId ? { ...f, amount: newAmount, status: newAmount > 0 ? "Em Atraso" : "Pendente" } : f));
        try {
          await supabase.from('fiados').update({ valor: newAmount, status: newAmount > 0 ? "Em Atraso" : "Pendente" }).eq('id', fiadoId);
          await supabase.from('historico_fiado').insert({
            id_cliente: fiadoId,
            descricao: `Compra PDV: ${cart.map(i => i.name).join(', ')}`,
            valor: total,
            tipo: 'Compra',
            data: new Date().toISOString()
          });
        } catch (e) {
          console.warn('Erro ao atualizar fiado no checkout:', e);
        }
      }
    }

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

    const xeroxPAndB = cart.find(c => c.name === "Xerox P&B");
    const xeroxColor = cart.find(c => c.name === "Xerox Color");
    
    let addedXerox = 0;
    if (xeroxPAndB) addedXerox += xeroxPAndB.qty;
    if (xeroxColor) addedXerox += xeroxColor.qty;
    if (addedXerox > 0) setXeroxCount(prev => prev + addedXerox);

    const vendaId = await registrarMovimentacao(
      new Date(),
      cart.map(i => i.name).join(', '),
      total,
      fiadoId && paymentMethod === "Fiado PDV" ? "Venda Fiada" : "Venda",
      { metodo_pagamento: paymentMethod, cliente_id: fiadoId }
    );

    if (vendaId) {
      for (const cartItem of cart) {
        if (cartItem.id) {
          try {
            await supabase.from('itens_venda').insert({
              venda_id: vendaId,
              produto_id: cartItem.id,
              quantidade: cartItem.qty,
              preco_unitario: cartItem.price
            });
          } catch (e) {
            console.warn('Erro ao inserir item_venda:', e);
          }
        }
      }
    }
  };

  const addExpense = async (desc: string, value: number) => {
    await registrarMovimentacao(new Date(), desc, value, "Saída", { categoria: 'Geral' });
  };

  const addQuickSale = async (desc: string, value: number) => {
    // Use EXACTLY what the user typed — never replace with hardcoded text
    const safeDesc = (desc || '').trim();
    if (!safeDesc) {
      toast.error('Descrição é obrigatória.');
      return;
    }
    await registrarMovimentacao(new Date(), safeDesc, value, "Venda", { metodo_pagamento: 'Dinheiro' });
  };

  const addStockSale = async (itemName: string, value: number) => {
    await registrarMovimentacao(new Date(), `Estoque: ${itemName}`, value, "Venda", { metodo_pagamento: `Estoque: ${itemName}` });
  };

  const addFiado = async (fiado: any) => {
    setFiados(prev => [fiado, ...prev]);
    try {
      await supabase.from('fiados').insert({
        nome: fiado.name,
        telefone: fiado.phone,
        valor: fiado.amount,
        data_vencimento: fiado.dueDate.toISOString(),
        status: fiado.status
      });
    } catch (e) {
      console.warn('Erro ao salvar fiado:', e);
    }
  };

  const addService = (service: any) => {
    setServices(prev => [...prev, service]);
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

    // CRITICAL: Wrap DB queries in try/catch — network failures must NOT crash the UI
    let currentSalesTotal = 0;
    const salesByMethod = { Pix: 0, Cartão: 0, Dinheiro: 0 };
    let currentExpensesTotal = 0;
    let topExpenses: { descricao: string; valor: number }[] = [];

    try {
      const { data: salesData } = await supabase.from('vendas').select('valor_total, metodo_pagamento').gte('data_venda', startDate.toISOString());
      if (salesData && Array.isArray(salesData)) {
        currentSalesTotal = salesData.reduce((sum: number, v: any) => sum + (v.valor_total ?? 0), 0);
        salesData.forEach((v: any) => {
          if (v.metodo_pagamento === "Pix") salesByMethod.Pix += (v.valor_total ?? 0);
          else if (v.metodo_pagamento === "Cartão") salesByMethod.Cartão += (v.valor_total ?? 0);
          else if (v.metodo_pagamento === "Dinheiro") salesByMethod.Dinheiro += (v.valor_total ?? 0);
        });
      }
    } catch (e) {
      console.warn('Erro ao buscar vendas para fechamento:', e);
    }

    try {
      const { data: expData } = await supabase.from('despesas').select('descricao, valor').gte('data_pagamento', startDate.toISOString());
      if (expData && Array.isArray(expData)) {
        currentExpensesTotal = expData.reduce((sum: number, e: any) => sum + (e.valor ?? 0), 0);
        topExpenses = [...expData].sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0)).slice(0, 3);
      }
    } catch (e) {
      console.warn('Erro ao buscar despesas para fechamento:', e);
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
      toast.error("Não foi possível enviar o e-mail, mas o relatório foi gerado.");
      // Don't re-throw — this would crash the error boundary
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
      // IMPORTANTE: Não limpar sessionStorage pois contém o token de autenticacao
      localStorage.clear();
      localStorage.setItem('reset_performed', 'true');

      // 3. Reset de Estado (State)
      setItems([]);
      setExpenses([]);
      setSales([]);
      setFiados([]);
      setServices([]);
      setQuickProducts([]);
      setListasEscolares([]);
      setXeroxCount(0);

      // 4. Recarregamento — vai para /login porque a sessão ainda está ativa
      // User can log back in immediately
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);

    } catch (error) {
      console.error("Erro crítico durante o reset:", error);
      toast.error("Erro ao resetar dados.");
      // Don't re-throw — it would crash the error boundary
    }
  };

  const addFiadoTransaction = async (fiadoId: string, amount: number, desc: string) => {
    const fiado = fiados.find(f => f.id === fiadoId);
    if (!fiado) return;
    const newAmount = (fiado.amount ?? 0) + amount;
    const newStatus = newAmount > 0 ? "Em Atraso" : "Pendente";

    setFiados(prev => prev.map(f => f.id === fiadoId ? { ...f, amount: newAmount, status: newStatus } : f));
    try {
      await supabase.from('fiados').update({ valor: newAmount, status: newStatus }).eq('id', fiadoId);
      await supabase.from('historico_fiado').insert({
        id_cliente: fiadoId,
        descricao: `Compra: ${desc}`,
        valor: amount,
        tipo: 'Compra',
        data: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Erro ao registrar transação fiado:', e);
    }

    await registrarMovimentacao(new Date(), desc, amount, "Venda Fiada", { metodo_pagamento: `Fiado: ${desc}`, cliente_id: fiadoId });
  };

  const payFiado = async (fiadoId: string, amount: number) => {
    const fiado = fiados.find(f => f.id === fiadoId);
    if (!fiado) return;
    const newAmount = Math.max(0, (fiado.amount ?? 0) - amount);
    const newStatus = newAmount > 0 ? "Pendente" : "Pendente";

    setFiados(prev => prev.map(f => f.id === fiadoId ? { ...f, amount: newAmount, status: newStatus } : f));
    try {
      await supabase.from('fiados').update({ valor: newAmount, status: newStatus }).eq('id', fiadoId);
      await supabase.from('historico_fiado').insert({
        id_cliente: fiadoId,
        descricao: `Pagamento Realizado`,
        valor: amount,
        tipo: 'Pagamento',
        data: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Erro ao registrar pagamento fiado:', e);
    }

    await registrarMovimentacao(new Date(), `Pagamento Realizado`, amount, "Pagamento de Fiado", { metodo_pagamento: `Baixa Fiado: ${fiado.name}`, cliente_id: fiadoId });
  };

  const getFiadoHistory = async (fiadoId: string) => {
    // Filter from global movements (LocalStorage priority)
    const history = sales
      .filter(m => m.clienteId === fiadoId)
      .map(m => ({
        id: m.id || Math.random().toString(),
        data: m.date,
        descricao: m.description,
        valor: m.value,
        tipo: m.type === "Pagamento de Fiado" ? "Pagamento" : "Compra"
      }))
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    return history;
  };

  return (
    <StoreContext.Provider value={{ 
      items, addStock, checkout, xeroxCount, addExpense, addQuickSale, 
      expenses, sales, fiados, services, quickProducts, listasEscolares,
      closeCashier, resetData, addFiado, addService, discountStock,
      addFiadoTransaction, payFiado, addStockSale, getFiadoHistory, registrarMovimentacao
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    // During route transitions (e.g. logout navigating from _app to /login),
    // React may unmount _app children while they still call useStore().
    // Instead of crashing, return safe defaults.
    const noop = async () => {};
    return {
      items: [],
      addStock: () => {},
      checkout: noop,
      xeroxCount: 0,
      addExpense: noop,
      addQuickSale: noop,
      expenses: [],
      sales: [],
      fiados: [],
      services: [],
      quickProducts: [],
      listasEscolares: [],
      closeCashier: noop,
      resetData: noop,
      addFiado: noop,
      addFiadoTransaction: noop,
      payFiado: noop,
      addService: () => {},
      discountStock: noop,
      addStockSale: noop,
      getFiadoHistory: async () => [],
      registrarMovimentacao: async () => null,
    } as StoreContextType;
  }
  return ctx;
}
