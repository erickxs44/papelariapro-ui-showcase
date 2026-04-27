import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Store, MapPin, Sun, Moon, Save, Bell, Globe } from "lucide-react";
import { useTheme } from "../components/theme-provider";

export const Route = createFileRoute("/_app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — PapelariaPro" }] }),
  component: Configuracoes,
});

function Configuracoes() {
  const { theme, toggle } = useTheme();
  const [name, setName] = useState("PapelariaPro Centro");
  const [addr, setAddr] = useState("Av. Paulista, 1500 — São Paulo, SP");

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
    </div>
  );
}