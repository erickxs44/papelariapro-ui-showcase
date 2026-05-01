import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, ScanBarcode, Package, Settings, PenLine, ArrowLeftRight, ReceiptText } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pdv", label: "PDV", icon: ScanBarcode },
  { to: "/fiados", label: "Fiados", icon: ReceiptText },
  { to: "/movimentacoes", label: "Movimentações", icon: ArrowLeftRight },
  { to: "/estoque", label: "Estoque", icon: Package },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppSidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col gap-2 border-r border-border/60 bg-sidebar px-4 py-6">
      <Link to="/dashboard" className="flex items-center gap-2 px-2 pb-6">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-electric to-aqua">
          <PenLine className="h-5 w-5 text-background" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-tight">PapelariaPro</span>
          <span className="text-[11px] text-muted-foreground">Gestão moderna</span>
        </div>
      </Link>
      <nav className="flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={
                "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all " +
                (active
                  ? "bg-gradient-to-r from-electric/20 to-aqua/10 text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground")
              }
            >
              <Icon className={"h-4 w-4 " + (active ? "text-electric" : "")} />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-aqua" />}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-border/60 bg-surface/60 p-4 text-xs text-muted-foreground card-inset">
        <p className="font-semibold text-foreground">Plano Pro</p>
        <p className="mt-1">Tudo desbloqueado para sua loja.</p>
      </div>
    </aside>
  );
}