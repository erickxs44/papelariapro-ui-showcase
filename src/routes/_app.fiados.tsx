import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, Phone, Calendar, AlertCircle, CheckCircle2, ShieldCheck, X, Plus, FileText, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useStore } from "../lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/fiados")({
  head: () => ({ meta: [{ title: "Fiados — PapelariaPro" }] }),
  component: Fiados,
});

type Fiado = {
  id: string;
  name: string;
  phone: string;
  amount: number;
  dueDate: Date;
  status: "Pendente" | "Em Atraso";
};

function Fiados() {
  const { fiados, addFiado, payFiado, addFiadoTransaction, getFiadoHistory } = useStore();
  const [search, setSearch] = useState("");
  const [selectedFiado, setSelectedFiado] = useState<any | null>(null);
  
  const [baixaValue, setBaixaValue] = useState("");

  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [transactionFiado, setTransactionFiado] = useState<any | null>(null);
  const [transactionDesc, setTransactionDesc] = useState("");
  const [transactionValue, setTransactionValue] = useState("");
  
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyFiado, setHistoryFiado] = useState<any | null>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = (fiados || []).filter(f => f.name.toLowerCase().includes(search.toLowerCase()));



  const handleBaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiado || !baixaValue) return;
    setIsSubmitting(true);
    try {
      const val = parseFloat(baixaValue.replace(",", "."));
      if (val <= 0) return;
      await payFiado(selectedFiado.id, val);
      toast.success(`Baixa de R$ ${val.toFixed(2)} realizada com sucesso para ${selectedFiado.name}!`);
      setSelectedFiado(null);
      setBaixaValue("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionFiado || !transactionDesc || !transactionValue) return;
    setIsSubmitting(true);
    try {
      const val = parseFloat(transactionValue.replace(",", "."));
      if (val <= 0) return;
      await addFiadoTransaction(transactionFiado.id, val, transactionDesc);
      toast.success(`Fiado adicionado para ${transactionFiado.name}!`);
      setIsAddTransactionModalOpen(false);
      setTransactionFiado(null);
      setTransactionDesc("");
      setTransactionValue("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  const handleNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientPhone) return;
    setIsSubmitting(true);
    try {
      await addFiado({
        id: Math.random().toString(36).substr(2, 9),
        name: newClientName,
        phone: newClientPhone,
        amount: 0,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        status: "Pendente"
      });
      setIsNewClientModalOpen(false);
      setNewClientName("");
      setNewClientPhone("");
      toast.success("Cliente cadastrado com sucesso!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openHistory = async (fiado: any) => {
    setHistoryFiado(fiado);
    setIsHistoryModalOpen(true);
    setIsLoadingHistory(true);
    const history = await getFiadoHistory(fiado.id);
    setHistoryItems(history);
    setIsLoadingHistory(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-7xl pb-12"
    >
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 ml-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div>
            <p className="text-sm font-medium text-aqua">Controle de Clientes</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl glow-text">Gestão de Fiados</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsNewClientModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-electric to-aqua px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(34,211,238,0.4)] transition hover:opacity-90 w-fit"
          >
            <Plus className="h-4 w-4" />
            Novo Cliente
          </motion.button>
        </div>
      </div>

      {/* Summary cards removed by request */}


      <div className="rounded-3xl glass-card p-6 mb-8">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar devedor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-2xl border-2 border-electric/30 bg-background/40 py-4 pl-12 pr-4 text-lg outline-none focus:border-electric transition-all focus:bg-background/80"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <AnimatePresence>
            {filtered.map((fiado, i) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.02 }}
                key={fiado.id} 
                className="group relative rounded-2xl border border-border/40 bg-elevated/40 p-4 transition-all hover:border-electric hover:shadow-[0_0_20px_rgba(111,0,255,0.1)] flex flex-col justify-between gap-3"
              >
                <div className="flex justify-between items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface/80 border border-border/60">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold truncate">{fiado.name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mt-0.5 ${fiado.status === "Em Atraso" ? "bg-destructive/20 text-destructive animate-pulse-ring" : "bg-aqua/20 text-aqua"}`}>
                      {fiado.status}
                    </span>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openHistory(fiado)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-aqua/10 text-aqua hover:bg-aqua hover:text-white transition-colors"
                      title="Ver Extrato"
                    >
                      <FileText className="h-4 w-4" />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setTransactionFiado(fiado);
                        setIsAddTransactionModalOpen(true);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric/10 text-electric hover:bg-electric hover:text-white transition-colors"
                      title="Adicionar Fiado"
                    >
                      <Plus className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
                  
                <div className="border-t border-border/40 pt-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Dívida Total</span>
                    <span className="text-lg font-black text-white leading-none">R$ {fiado.amount.toFixed(2)}</span>
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedFiado(fiado)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-electric px-3 py-2 text-xs font-bold text-white shadow-lg shadow-electric/20 transition hover:bg-electric/90"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Baixar
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedFiado && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-surface p-8 shadow-2xl relative glass-card"
            >
              <button 
                onClick={() => setSelectedFiado(null)}
                className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-electric/20 text-electric mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              
              <form onSubmit={handleBaixa}>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Confirmar Baixa</h2>
                  <p className="text-muted-foreground text-sm">
                    Quanto <span className="text-white font-bold">{selectedFiado.name}</span> está pagando?
                  </p>
                </div>

                <div className="mb-6">
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={baixaValue}
                    onChange={(e) => setBaixaValue(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-elevated p-4 text-center text-2xl font-black text-electric focus:border-electric focus:outline-none transition"
                    placeholder="R$ 0,00"
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button 
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedFiado(null); setBaixaValue(""); }}
                    className="flex-1 rounded-2xl border border-white/10 bg-transparent py-3.5 text-sm font-bold transition hover:bg-white/5"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button 
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isSubmitting}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-aqua to-electric py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(111,0,255,0.5)] transition btn-glow disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Processando...
                      </>
                    ) : (
                      "Confirmar"
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Add Transaction */}
      <AnimatePresence>
        {isAddTransactionModalOpen && transactionFiado && (
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
                <h2 className="text-xl font-bold">Adicionar Fiado</h2>
                <button 
                  onClick={() => setIsAddTransactionModalOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-muted-foreground">Descrição</label>
                  <input
                    type="text"
                    required
                    value={transactionDesc}
                    onChange={(e) => setTransactionDesc(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-elevated p-3 focus:border-electric focus:outline-none transition"
                    placeholder="Ex: Fiado de Ramon"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-muted-foreground">Valor da Venda (R$)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    disabled={transactionDesc.length === 0}
                    value={transactionValue}
                    onChange={(e) => setTransactionValue(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-elevated p-3 focus:border-electric focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0.00"
                  />
                </div>
                <motion.button 
                  whileHover={transactionDesc.length > 0 ? { scale: 1.02 } : {}}
                  whileTap={transactionDesc.length > 0 ? { scale: 0.95 } : {}}
                  type="submit"
                  disabled={transactionDesc.length === 0 || isSubmitting}
                  className="mt-4 w-full rounded-2xl bg-electric py-3.5 text-sm font-bold text-white shadow-lg shadow-electric/30 transition hover:bg-electric/90 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Processando...
                    </>
                  ) : (
                    "Confirmar Fiado"
                  )}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Novo Cliente */}
      <AnimatePresence>
        {isNewClientModalOpen && (
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
                <h2 className="text-xl font-bold">Cadastrar novo cliente</h2>
                <button 
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleNewClient} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-muted-foreground">Nome do Cliente</label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-elevated p-3 focus:border-electric focus:outline-none transition"
                    placeholder="Ex: Maria Silva"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-muted-foreground">Número de Contato</label>
                  <input
                    type="tel"
                    required
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-elevated p-3 focus:border-electric focus:outline-none transition"
                    placeholder="Ex: (11) 99999-9999"
                  />
                </div>
                <div className="mt-6 flex justify-end">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-2xl bg-electric px-6 py-3 font-bold text-white shadow-lg shadow-electric/30 transition hover:bg-electric/90 w-full flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Processando...
                      </>
                    ) : (
                      "Cadastrar"
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Extrato Detalhado */}
      <AnimatePresence>
        {isHistoryModalOpen && historyFiado && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/40 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg max-h-[85vh] rounded-[2.5rem] border border-white/10 bg-surface/90 shadow-2xl relative glass-card flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-white/10 shrink-0">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-aqua">Relatório Detalhado</p>
                    <h2 className="text-2xl font-black mt-1">{historyFiado.name}</h2>
                  </div>
                  <button 
                    onClick={() => setIsHistoryModalOpen(false)}
                    className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="rounded-2xl bg-white/5 p-4 border border-white/5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground uppercase">Saldo Devedor Atual</span>
                  <span className="text-2xl font-black text-white">
                    R$ {historyItems.reduce((acc, item) => item.tipo === 'Compra' ? acc + item.valor : acc - item.valor, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                {isLoadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-aqua/30 border-t-aqua" />
                    <p className="text-sm text-muted-foreground animate-pulse">Carregando histórico...</p>
                  </div>
                ) : historyItems.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground italic">Nenhuma movimentação registrada.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historyItems.map((item, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={item.id} 
                        className="flex items-center justify-between p-4 rounded-2xl bg-elevated/40 border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`grid h-10 w-10 place-items-center rounded-xl ${item.tipo === 'Compra' ? 'bg-destructive/10 text-destructive' : 'bg-aqua/10 text-aqua'}`}>
                            {item.tipo === 'Compra' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-sm leading-tight">{item.descricao}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.data).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className={`text-sm font-black ${item.tipo === 'Compra' ? 'text-destructive' : 'text-aqua'}`}>
                          {item.tipo === 'Compra' ? '+' : '-'} R$ {item.valor.toFixed(2)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

