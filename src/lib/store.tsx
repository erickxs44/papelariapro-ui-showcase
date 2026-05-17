import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "./supabase";
import { toast } from "sonner";

/**
 * Crash-proof date parser. Returns a valid Date or falls back to `now`.
 * Prevents `Invalid Date` from propagating into .getTime(), .toISOString(), etc.
 */
function safeDate(input: unknown): Date {
  if (!input) return new Date();
  const d = new Date(input as string | number);
  return isNaN(d.getTime()) ? new Date() : d;
}

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
  checkout: (cart: { id?: string; name: string; qty: number; price: number }[], paymentMethod?: string, fiadoId?: string, dividedData?: { aVista: number; fiado: number; aVistaMethod: string }, discountPercentage?: number) => Promise<void>;
  xeroxCount: number;
  addExpense: (desc: string, value: number) => Promise<void>;
  addQuickSale: (desc: string, value: number) => Promise<void>;
  expenses: { id?: string; desc: string; value: number; date: Date }[];
  sales: Movement[];
  fiados: any[];
  services: any[];
  quickProducts: string[];
  listasEscolares: any[];
  closeCashier: (period: "Hoje" | "7D" | "30D") => Promise<void>;
  resetData: () => Promise<void>;
  addFiado: (fiado: any) => Promise<string | undefined>;
  addFiadoTransaction: (fiadoId: string, amount: number, desc: string) => Promise<void>;
  payFiado: (fiadoId: string, amount: number) => Promise<void>;
  deleteFiado: (fiadoId: string) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addService: (service: any) => void;
  discountStock: (itemId: string, qtyToDiscount: number) => Promise<void>;
  reporEstoque: (itemId: string, newCost: number, newPrice: number, addQty: number) => Promise<void>;
  estornarMovimentacao: (id: string, isDespesa: boolean) => Promise<void>;
  addStockSale: (itemName: string, value: number, itemId?: string, qty?: number) => Promise<void>;
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
  const [expenses, setExpenses] = useState<{ id?: string; desc: string; value: number; date: Date }[]>([]);
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
            id: d.id,
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
        if (error) {
          console.error('Fiados fetch error:', error.message);
          return;
        }
        if (Array.isArray(data)) {
          setFiados(data.map((d: any) => ({
            id: d.id,
            name: d.nome_cliente || 'Cliente',
            phone: d.telefone || '',
            amount: d.saldo_devedor ?? 0,
            dueDate: safeDate(d.created_at), // fallback since data_vencimento doesn't exist
            status: (d.saldo_devedor ?? 0) > 0 ? 'Em Atraso' : 'Pendente' // calculated status
          })));
        }
      } catch (e) {
        console.error('Tabela fiados não encontrada:', e);
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
    const tempId = crypto.randomUUID();
    if (tipo === "Saída") {
      setExpenses(prev => [{ id: tempId, desc: safeDesc, value: valor, date: data }, ...prev]);
    } else {
      const newMove: Movement = {
        id: tempId,
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
    let returnId: string | undefined = undefined;
    try {
      if (tipo === "Saída") {
        const { data: res, error } = await supabase.from('despesas').insert({
          descricao: safeDesc,
          valor,
          categoria: detalhes.categoria || 'Geral',
          data_pagamento: data.toISOString()
        }).select();
        if (!error && res && res.length > 0) {
          returnId = res[0]?.id;
          setExpenses(prev => prev.map(e => e.id === tempId ? { ...e, id: returnId } : e));
        }
      } else {
        // Build insert payload — only include columns that exist in the schema
        const vendaPayload: Record<string, unknown> = {
          valor_total: valor,
          metodo_pagamento: detalhes.metodo_pagamento || "Dinheiro",
          descricao: safeDesc,
          data_venda: data.toISOString(),
        };
        // cliente_id may not exist in the table schema — only include if present
        if (detalhes.cliente_id) {
          vendaPayload.cliente_id = detalhes.cliente_id;
        }

        const { data: res, error } = await supabase.from('vendas').insert(vendaPayload).select();
        if (error) {
          // If .select() fails (e.g. column mismatch), retry without .select()
          console.warn('Venda insert com .select() falhou, tentando sem:', error.message);
          await supabase.from('vendas').insert(vendaPayload);
        } else if (res && res.length > 0) {
          returnId = res[0]?.id;
          setSales(prev => {
            const next = prev.map(s => s.id === tempId ? { ...s, id: returnId } : s);
            try { localStorage.setItem('papelaria_movements', JSON.stringify(next)); } catch {}
            return next;
          });
        }
      }
    } catch (e) {
      console.warn('Erro ao persistir no Supabase:', e);
      // State was already updated optimistically, so the UI still works
    }
    return returnId ?? null;
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

  const checkout = async (
    cart: { id?: string; name: string; qty: number; price: number }[], 
    paymentMethod: string = "Dinheiro", 
    fiadoId?: string,
    dividedData?: { aVista: number; fiado: number; aVistaMethod: string },
    discountPercentage: number = 0
  ) => {
    const subtotal = cart.reduce((s, i) => s + (i.price ?? 0) * (i.qty ?? 0), 0);
    const discountValue = (subtotal * discountPercentage) / 100;
    const total = subtotal - discountValue;

    // Tratamento para pagamento dividido
    if (paymentMethod === "Dividido" && dividedData && fiadoId) {
      // 1. Fiado portion
      try {
        const { data: currentFiado } = await supabase.from('fiados').select('saldo_devedor').eq('id', fiadoId).single();
        const baseAmount = currentFiado?.saldo_devedor || 0;
        const newAmount = baseAmount + dividedData.fiado;

        setFiados(prev => prev.map(f => f.id === fiadoId ? { ...f, amount: newAmount, status: newAmount > 0 ? "Em Atraso" : "Pendente" } : f));

        const resUpdate = await supabase.from('fiados').update({ saldo_devedor: newAmount }).eq('id', fiadoId);
        if (resUpdate.error) console.error('Erro update checkout fiado', resUpdate.error);
        const resInsert = await supabase.from('historico_fiados').insert({
          cliente_id: fiadoId,
          descricao: `Compra PDV (Parte Fiado): ${cart.map(i => i.name).join(', ')}`,
          valor: dividedData.fiado,
          tipo: 'compra',
          data: new Date().toISOString()
        });
        if (resInsert.error) console.error('Erro insert historico checkout fiado', resInsert.error);
      } catch (e) {
        console.warn('Erro ao atualizar fiado no checkout dividido:', e);
      }
    } else if (fiadoId && paymentMethod === "Fiado PDV") {
      try {
        const { data: currentFiado } = await supabase.from('fiados').select('saldo_devedor').eq('id', fiadoId).single();
        const baseAmount = currentFiado?.saldo_devedor || 0;
        const newAmount = baseAmount + total;

        setFiados(prev => prev.map(f => f.id === fiadoId ? { ...f, amount: newAmount, status: newAmount > 0 ? "Em Atraso" : "Pendente" } : f));

        const resUpdate = await supabase.from('fiados').update({ saldo_devedor: newAmount }).eq('id', fiadoId);
        if (resUpdate.error) console.error('Erro update checkout fiado', resUpdate.error);
        const resInsert = await supabase.from('historico_fiados').insert({
          cliente_id: fiadoId,
          descricao: `Compra PDV: ${cart.map(i => i.name).join(', ')}`,
          valor: total,
          tipo: 'compra',
          data: new Date().toISOString()
        });
        if (resInsert.error) console.error('Erro insert historico checkout fiado', resInsert.error);
      } catch (e) {
        console.warn('Erro ao atualizar fiado no checkout:', e);
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

    const isDivided = paymentMethod === "Dividido" && dividedData;

    let vendaId: string | null = null;

    if (isDivided && dividedData) {
      // Register the À Vista portion
      vendaId = await registrarMovimentacao(
        new Date(),
        cart.map(i => i.name).join(', '),
        dividedData.aVista,
        "Venda",
        { metodo_pagamento: dividedData.aVistaMethod }
      );
      // Register the Fiado portion
      await registrarMovimentacao(
        new Date(),
        `(Fiado) ` + cart.map(i => i.name).join(', '),
        dividedData.fiado,
        "Venda Fiada",
        { metodo_pagamento: "Fiado PDV", cliente_id: fiadoId }
      );
    } else {
      vendaId = await registrarMovimentacao(
        new Date(),
        cart.map(i => i.name).join(', '),
        total,
        fiadoId && paymentMethod === "Fiado PDV" ? "Venda Fiada" : "Venda",
        { metodo_pagamento: paymentMethod, cliente_id: fiadoId }
      );
    }

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
            
            // Deduct stock from Supabase DB
            const itemInState = items.find(i => i.id === cartItem.id);
            if (itemInState) {
              const newQty = Math.max(0, itemInState.qty - cartItem.qty);
              await supabase.from('produtos').update({ estoque_atual: newQty }).eq('id', cartItem.id);
            }
          } catch (e) {
            console.warn('Erro ao inserir item_venda e atualizar estoque:', e);
          }
        }
      }
    }
  };

  const reporEstoque = async (itemId: string, newCost: number, newPrice: number, addQty: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newTotalQty = item.qty + addQty;
    
    // Update local state optimistic
    setItems((prev) => 
      prev.map(i => i.id === itemId ? { ...i, qty: newTotalQty, costPrice: newCost, price: newPrice, level: calculateLevel(newTotalQty) } : i)
    );

    // Update DB
    try {
      await supabase.from('produtos').update({ 
        estoque_atual: newTotalQty,
        preco_custo: newCost,
        preco_venda: newPrice
      }).eq('id', itemId);
    } catch (e) {
      console.warn('Erro ao atualizar estoque:', e);
    }

    // NOTE: Expense registration is now controlled by the Estoque page's
    // financial confirmation modal ("Mandar valor para Dashboard?").
    // Previously this function ALSO registered the expense, causing duplicates.
  };

  const estornarMovimentacao = async (id: string, isDespesa: boolean) => {
    try {
      if (isDespesa) {
        await supabase.from('despesas').delete().eq('id', id);
        setExpenses(prev => prev.filter(e => e.id !== id));
        toast.success("Movimentação removida com sucesso!");
      } else {
        const move = sales.find(s => s.id === id);
        
        // Devolve o estoque no estado local (o banco será atualizado via Trigger)
        const { data: itensVenda } = await supabase.from('itens_venda').select('*').eq('venda_id', id);
        if (itensVenda && itensVenda.length > 0) {
          for (const iv of itensVenda) {
             const prodId = iv.produto_id;
             const qtyToReturn = iv.quantidade;
             const item = items.find(i => i.id === prodId);
             if (item) {
               const newQty = item.qty + qtyToReturn;
               setItems(prev => prev.map(i => i.id === prodId ? { ...i, qty: newQty, level: calculateLevel(newQty) } : i));
             }
          }
        }
        
        // Abate dívida se for fiado
        if (move && move.type === "Venda Fiada" && move.clienteId) {
           const fiadoId = move.clienteId;
           const amount = move.value;
           const fiado = fiados.find(f => f.id === fiadoId);
           if (fiado) {
             const newAmount = Math.max(0, (fiado.amount ?? 0) - amount);
             const newStatus = newAmount > 0 ? "Em Atraso" : "Pendente";
             setFiados(prev => prev.map(f => f.id === fiadoId ? { ...f, amount: newAmount, status: newStatus } : f));
             const resUpdate = await supabase.from('fiados').update({ saldo_devedor: newAmount }).eq('id', fiadoId);
             if (resUpdate.error) console.error("Erro no update fiados estorno", resUpdate.error);
             
             const resInsert = await supabase.from('historico_fiados').insert({
               cliente_id: fiadoId,
               descricao: `Estorno de Venda`,
               valor: amount,
               tipo: 'pagamento', // Funciona como pagamento abatendo a dívida
               data: new Date().toISOString()
             });
             if (resInsert.error) console.error("Erro no insert historico_fiados estorno", resInsert.error);
           }
        }

        await supabase.from('vendas').delete().eq('id', id);
        setSales(prev => {
          const next = prev.filter(s => s.id !== id);
          try { localStorage.setItem('papelaria_movements', JSON.stringify(next)); } catch {}
          return next;
        });
        toast.success("Movimentação removida e estoque atualizado com sucesso!");
      }
    } catch(e) {
      console.warn("Erro ao estornar movimentacao", e);
      toast.error("Erro ao estornar movimentação.");
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

  const addStockSale = async (itemName: string, value: number, itemId?: string, qty?: number) => {
    const vendaId = await registrarMovimentacao(new Date(), `Estoque: ${itemName}`, value, "Venda", { metodo_pagamento: `Estoque: ${itemName}` });
    
    // Inserir em itens_venda para que o estorno consiga devolver o estoque
    if (vendaId && itemId && qty) {
      try {
        const item = items.find(i => i.id === itemId);
        await supabase.from('itens_venda').insert({
          venda_id: vendaId,
          produto_id: itemId,
          quantidade: qty,
          preco_unitario: item?.price ?? (value / qty)
        });
      } catch (e) {
        console.warn('Erro ao inserir item_venda para venda de estoque:', e);
      }
    }
  };

  const addFiado = async (fiado: any): Promise<string | undefined> => {
    const tempId = crypto.randomUUID();
    const newFiado = { ...fiado, id: tempId };
    setFiados(prev => [newFiado, ...prev]);
    
    try {
      const dueDate = fiado.dueDate instanceof Date && !isNaN(fiado.dueDate.getTime())
        ? fiado.dueDate.toISOString()
        : new Date().toISOString();
        
      const { data, error } = await supabase.from('fiados').insert({
        nome_cliente: fiado.name,
        telefone: fiado.phone || '',
        saldo_devedor: fiado.amount || 0
      }).select();
      
      if (data && data.length > 0) {
        const realId = data[0].id;
        setFiados(prev => prev.map(f => f.id === tempId ? { ...f, id: realId } : f));
        return realId;
      } else if (error) {
        console.error('Erro ao salvar fiado, DB error:', error);
      }
    } catch (e) {
      console.error('Erro ao salvar fiado:', e);
    }
    return tempId;
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

  const deleteFiado = async (fiadoId: string) => {
    try {
      const fiado = fiados.find(f => f.id === fiadoId);
      if (!fiado) throw new Error('Cliente não encontrado');

      // SOFT-DELETE: Renomear com prefixo [EXCLUIDO] para preservar
      // todas as movimentações financeiras (vendas, histórico de fiados)
      // que referenciam este cliente. Nunca deletar entries financeiras.
      const { error } = await supabase
        .from('fiados')
        .update({ nome_cliente: `[EXCLUIDO] ${fiado.name}` })
        .eq('id', fiadoId);

      if (error) throw error;

      // Remover da UI local — os dados permanecem no banco
      setFiados(prev => prev.filter(f => f.id !== fiadoId));
    } catch (error) {
      console.error("Erro em deleteFiado (soft-delete):", error);
      throw error;
    }
  };

  const deleteProduct = async (productId: string) => {
    const product = items.find(i => i.id === productId);
    if (!product) return;

    try {
      // 1. Buscar todas as vendas vinculadas via itens_venda
      const { data: relatedItems } = await supabase
        .from('itens_venda')
        .select('venda_id')
        .eq('produto_id', productId);

      const removedVendaIds = new Set<string>();

      if (relatedItems && relatedItems.length > 0) {
        for (const iv of relatedItems) {
          removedVendaIds.add(iv.venda_id);
          // Delete itens_venda entries
          await supabase.from('itens_venda').delete().eq('venda_id', iv.venda_id);
          // Delete the venda itself (reverses financial impact)
          await supabase.from('vendas').delete().eq('id', iv.venda_id);
        }
      }

      // 2. Delete related despesas (stock reposition expenses)
      const { data: relatedExpenses } = await supabase
        .from('despesas')
        .select('id')
        .ilike('descricao', `%${product.name}%`);

      const removedExpenseIds = new Set<string>();
      if (relatedExpenses && relatedExpenses.length > 0) {
        for (const exp of relatedExpenses) {
          removedExpenseIds.add(exp.id);
          await supabase.from('despesas').delete().eq('id', exp.id);
        }
      }

      // 3. Delete the product itself
      const { error } = await supabase.from('produtos').delete().eq('id', productId);
      if (error) throw error;

      // 4. Update all local state to reflect the reversal
      setItems(prev => prev.filter(i => i.id !== productId));
      setSales(prev => {
        const next = prev.filter(s => !removedVendaIds.has(s.id || ''));
        try { localStorage.setItem('papelaria_movements', JSON.stringify(next)); } catch {}
        return next;
      });
      setExpenses(prev => prev.filter(e => !removedExpenseIds.has(e.id || '')));
    } catch (error) {
      console.error("Erro em deleteProduct:", error);
      throw error;
    }
  };

  const addFiadoTransaction = async (fiadoId: string, amount: number, desc: string) => {
    // Resolve the real Supabase ID — if fiadoId is still a temp UUID,
    // look it up in the fiados array (which may have been updated by addFiado)
    const fiado = fiados.find(f => f.id === fiadoId);
    if (!fiado) return;
    
    // Use the fiado's current ID from state (which should be the real DB ID)
    const resolvedId = fiado.id;
    const newAmount = (fiado.amount ?? 0) + amount;
    const newStatus = newAmount > 0 ? "Em Atraso" : "Pendente";

    setFiados(prev => prev.map(f => f.id === resolvedId ? { ...f, amount: newAmount, status: newStatus } : f));
    try {
      const resUpdate = await supabase.from('fiados').update({ saldo_devedor: newAmount }).eq('id', resolvedId);
      if (resUpdate.error) console.error("Erro no update fiados transacao", resUpdate.error);
      
      const resInsert = await supabase.from('historico_fiados').insert({
        cliente_id: resolvedId,
        descricao: `Compra: ${desc}`,
        valor: amount,
        tipo: 'compra',
        data: new Date().toISOString()
      });
      if (resInsert.error) {
        console.error("Erro no insert historico_fiados transacao", resInsert.error);
        toast.error("Erro ao registrar no histórico do fiado.");
      }
    } catch (e) {
      console.warn('Erro ao registrar transação fiado:', e);
      toast.error("Erro ao registrar transação fiado.");
    }

    await registrarMovimentacao(new Date(), desc, amount, "Venda Fiada", { metodo_pagamento: `Fiado: ${desc}`, cliente_id: resolvedId });
  };

  const payFiado = async (fiadoId: string, amount: number) => {
    const fiado = fiados.find(f => f.id === fiadoId);
    if (!fiado) return;
    
    // Use the fiado's current ID from state (which should be the real DB ID)
    const resolvedId = fiado.id;
    const newAmount = Math.max(0, (fiado.amount ?? 0) - amount);
    const newStatus = newAmount > 0 ? "Em Atraso" : "Pendente";

    setFiados(prev => prev.map(f => f.id === resolvedId ? { ...f, amount: newAmount, status: newStatus } : f));
    try {
      const resUpdate = await supabase.from('fiados').update({ saldo_devedor: newAmount }).eq('id', resolvedId);
      if (resUpdate.error) console.error("Erro no update fiados pagamento", resUpdate.error);
      
      const resInsert = await supabase.from('historico_fiados').insert({
        cliente_id: resolvedId,
        descricao: `Pagamento Realizado`,
        valor: amount,
        tipo: 'pagamento',
        data: new Date().toISOString()
      });
      if (resInsert.error) {
        console.error("Erro no insert historico_fiados pagamento", resInsert.error);
        toast.error("Erro ao registrar pagamento no histórico.");
      }
    } catch (e) {
      console.warn('Erro ao registrar pagamento fiado:', e);
      toast.error("Erro ao registrar pagamento fiado.");
    }

    await registrarMovimentacao(new Date(), `Pagamento Realizado`, amount, "Pagamento de Fiado", { metodo_pagamento: `Baixa Fiado: ${fiado.name}`, cliente_id: resolvedId });
  };

  const getFiadoHistory = async (fiadoId: string) => {
    try {
      console.log('[getFiadoHistory] Buscando histórico para cliente_id:', fiadoId);
      const { data, error } = await supabase
        .from('historico_fiados')
        .select('*')
        .eq('cliente_id', fiadoId)
        .order('data', { ascending: false });

      if (error) {
        console.error('[getFiadoHistory] Erro na tabela historico_fiados:', error);
        
        // Fallback: tentar tabela com nome no singular (historico_fiado)
        console.log('[getFiadoHistory] Tentando tabela alternativa historico_fiado...');
        const fallback = await supabase
          .from('historico_fiado')
          .select('*')
          .eq('cliente_id', fiadoId)
          .order('data', { ascending: false });
        
        if (!fallback.error && fallback.data) {
          console.log('[getFiadoHistory] Fallback bem-sucedido, encontrados:', fallback.data.length, 'registros');
          return fallback.data;
        }
        
        console.error('[getFiadoHistory] Ambas tabelas falharam:', fallback.error);
        return [];
      }
      
      console.log('[getFiadoHistory] Encontrados:', (data || []).length, 'registros');
      return data || [];
    } catch (e) {
      console.warn('[getFiadoHistory] Erro na requisição do histórico do fiado:', e);
      return [];
    }
  };

  return (
    <StoreContext.Provider value={{ 
      items, addStock, checkout, xeroxCount, addExpense, addQuickSale, 
      expenses, sales, fiados, services, quickProducts, listasEscolares,
      closeCashier, resetData, addFiado, addService, discountStock,
      addFiadoTransaction, payFiado, deleteFiado, addStockSale, getFiadoHistory, registrarMovimentacao,
      reporEstoque, estornarMovimentacao, deleteProduct
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
      deleteFiado: noop,
      addService: () => {},
      discountStock: noop,
      addStockSale: noop,
      getFiadoHistory: async () => [],
      registrarMovimentacao: async () => null,
      reporEstoque: async () => {},
      estornarMovimentacao: async () => {},
      deleteProduct: noop,
    } as StoreContextType;
  }
  return ctx;
}
