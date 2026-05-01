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
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();

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
        <p className="mb-5 text-xs text-muted-foreground">Alterne entre tema claro e escuro.</p>

        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-elevated/60 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-electric/15 text-electric">
              {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-semibold capitalize">Tema {theme === "dark" ? "Escuro" : "Claro"}</p>
              <p className="text-xs text-muted-foreground">Clique para alternar</p>
            </div>
          </div>
          <button
            onClick={toggle}
            role="switch"
            aria-checked={theme === "dark"}
            className={
              "relative h-7 w-12 rounded-full transition " +
              (theme === "dark" ? "bg-gradient-to-r from-electric to-aqua" : "bg-muted")
            }
          >
            <span
              className={
                "absolute top-0.5 h-6 w-6 rounded-full bg-background shadow transition-all " +
                (theme === "dark" ? "left-[22px]" : "left-0.5")
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
          onClick={() => setShowResetModal(true)}
          className="flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-6 py-3 text-sm font-bold text-destructive transition hover:bg-destructive hover:text-white"
        >
          <Trash2 className="h-4 w-4" /> Zerar dados do sistema
        </button>
      </section>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border/60 bg-surface p-8 shadow-2xl animate-in zoom-in-95">
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-destructive/20 text-destructive">
              <Trash2 className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-black">Tem certeza que deseja apagar tudo?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta ação é irreversível e todos os seus registros de vendas, despesas e produtos serão excluídos permanentemente.
            </p>
            
            <div className="mt-8 flex flex-col gap-2">
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="w-full rounded-2xl bg-destructive py-3.5 text-sm font-black text-white transition hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {isResetting ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="w-full rounded-2xl bg-elevated py-3.5 text-sm font-bold text-foreground transition hover:bg-border/40"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}