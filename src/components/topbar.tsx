import { Bell, Search, Sun, Moon, User, Menu } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "./ui/sheet";
import { SidebarContent } from "./app-sidebar";
import { useState } from "react";

export function Topbar() {
  const { theme, toggle } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-8">
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="grid h-10 w-10 place-items-center rounded-2xl border border-border/60 bg-surface/60 text-muted-foreground transition hover:text-foreground">
              <Menu className="h-4 w-4" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-4 pt-10">
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            <SheetDescription className="sr-only">Opções de navegação do sistema</SheetDescription>
            <SidebarContent onNavClick={() => setIsOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Pesquisar produtos, despesas, vendas..."
          className="w-full rounded-2xl border border-border/60 bg-surface/60 py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-electric/60 focus:outline-none focus:ring-2 focus:ring-electric/30"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggle}
          aria-label="Alternar tema"
          className="grid h-10 w-10 place-items-center rounded-2xl border border-border/60 bg-surface/60 text-muted-foreground transition hover:text-foreground"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button className="grid h-10 w-10 place-items-center rounded-2xl border border-border/60 bg-surface/60 text-muted-foreground transition hover:text-foreground">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface/60 px-3 py-1.5">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-electric to-aqua text-background">
            <User className="h-3.5 w-3.5" />
          </div>
          <div className="hidden text-left leading-tight md:block">
            <p className="text-xs font-semibold">Ana Souza</p>
            <p className="text-[10px] text-muted-foreground">Administradora</p>
          </div>
        </div>
      </div>
    </header>
  );
}