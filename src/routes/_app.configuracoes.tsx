import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Store, MapPin, Sun, Moon, Save, Bell, Globe, Trash2 } from "lucide-react";
import { useTheme } from "../components/theme-provider";
import { useStore } from "../lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — PapelariaPro" }] }),
  component: Configuracoes,
});

function Configuracoes() {
  const { theme, toggle } = useTheme();
  const { resetData } = useStore();
  const [name, setName] = useState("PapelariaPro Centro");
  const [addr, setAddr] = useState("Av. Paulista, 1500 — São Paulo, SP");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();

  const openResetModal = () => {
    setResetStep(1);
    setShowResetModal(true);
  };

  const handleReset = async () => {
    setIsResetting(true);
    toast.promise(resetData(), {
      loading: 'Limpando banco de dados...',
      success: () => {
        setIsResetting(false);
        setShowResetModal(false);
        navigate({ to: "/dashboard" });
        return 'Sistema resetado com sucesso!';
      },
      error: () => {
        setIsResetting(false);
        return 'Erro ao resetar sistema.';
      }
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Personalize sua loja e a aparência do sistema.</p>
      </div>

      <section className="rounded-3xl border border-border/60 bg-surface/70 p-6 card-inset">
        <h2 className="mb-1 text-lg font-bold">Informações da loja</h2>
        <p className="mb-5 text-xs text-muted-foreground">Esses dados aparecem nos recibos e no PDV.</p>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome da loja</span>
            <div className="relative">
              <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-border/60 bg-elevated/60 py-3 pl-9 pr-3 text-sm focus:border-electric/60 focus:outline-none focus:ring-2 focus:ring-electric/30"
              />
            </div>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Endereço</span>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                className="w-full rounded-2xl border border-border/60 bg-elevated/60 py-3 pl-9 pr-3 text-sm focus:border-electric/60 focus:outline-none focus:ring-2 focus:ring-electric/30"
              />
            </div>
          </label>
        </div>

        <button className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-electric to-aqua px-4 py-2.5 text-sm font-semibold text-background">
          <Save className="h-4 w-4" /> Salvar alterações
        </button>
      </section>

      <section className="rounded-3xl border border-border/60 bg-surface/70 p-6 card-inset">
        <h2 className="mb-1 text-lg font-bold">Aparência</h2>
        <p className="mb-5 text-xs text-muted-foreground">Alterne entre o tema Azul Escuro e Preto OLED.</p>

        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-elevated/60 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-electric/15 text-electric">
              {theme === "black" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-semibold capitalize">Tema {theme === "blue" ? "Azul Escuro" : "Preto OLED"}</p>
              <p className="text-xs text-muted-foreground">Clique para alternar</p>
            </div>
          </div>
          <button
            onClick={toggle}
            role="switch"
            aria-checked={theme === "black"}
            className={
              "relative h-7 w-12 rounded-full transition " +
              (theme === "black" ? "bg-gradient-to-r from-electric to-aqua" : "bg-muted")
            }
          >
            <span
              className={
                "absolute top-0.5 h-6 w-6 rounded-full bg-background shadow transition-all " +
                (theme === "black" ? "left-[22px]" : "left-0.5")
              }
            />
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-border/60 bg-surface/70 p-5 card-inset">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-aqua/15 text-aqua">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Notificações</p>
              <p className="text-xs text-muted-foreground">Alertas de estoque baixo</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-border/60 bg-surface/70 p-5 card-inset">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-electric/15 text-electric">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Idioma</p>
              <p className="text-xs text-muted-foreground">Português (BR)</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6 card-inset mt-8">
        <h2 className="mb-1 text-lg font-bold text-destructive">Zona de Perigo</h2>
        <p className="mb-5 text-xs text-muted-foreground">Gerenciamento crítico de dados e ações irreversíveis.</p>
        
        <button 
          onClick={openResetModal}
          className="flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-6 py-3 text-sm font-bold text-destructive transition hover:bg-destructive hover:text-white"
        >
          <Trash2 className="h-4 w-4" /> Zerar dados do sistema
        </button>
      </section>

      {/* Reset Modal — 2-Step Confirmation */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in px-4">
          <div className="w-full max-w-md rounded-3xl border border-destructive/20 bg-surface p-8 shadow-2xl animate-in zoom-in-95 glass-card">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20 text-destructive mx-auto">
              <Trash2 className="h-8 w-8" />
            </div>

            {resetStep === 1 ? (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Zerar Sistema</h3>
                  <p className="text-sm text-muted-foreground">
                    Deseja apagar todos os dados do sistema? Isso inclui vendas, despesas, estoque e fiados.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 rounded-2xl border border-white/10 bg-transparent py-3.5 text-sm font-bold transition hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setResetStep(2)}
                    className="flex-1 rounded-2xl bg-destructive py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] transition hover:bg-destructive/90"
                  >
                    Sim, continuar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Confirmação Final</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Você tem certeza <span className="text-white font-bold">ABSOLUTA</span>? Esta ação é permanente e irreversível.
                  </p>
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-left">
                    <p className="text-xs text-destructive flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Todos os registros serão excluídos permanentemente: produtos, vendas, despesas, clientes fiado e histórico financeiro.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetModal(false)}
                    disabled={isResetting}
                    className="flex-1 rounded-2xl border border-white/10 bg-transparent py-3.5 text-sm font-bold transition hover:bg-white/5 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={isResetting}
                    className="flex-1 rounded-2xl bg-destructive py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] transition hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isResetting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Excluindo...
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