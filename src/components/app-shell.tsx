"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  count?: number;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Operação",
    items: [
      { href: "/dashboard",     label: "Dashboard",     icon: "📊" },
      { href: "/movimentos",    label: "Movimentos",    icon: "€" },
      { href: "/fluxo-mensal",  label: "Fluxo Mensal",  icon: "📅" },
      { href: "/orcamentos",    label: "Orçamentos",    icon: "🎯" },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { href: "/contas",        label: "Contas",        icon: "🏦" },
      { href: "/categorias",    label: "Categorias",    icon: "🏷️" },
      { href: "/fornecedores",  label: "Fornecedores",  icon: "🤝" },
    ],
  },
  {
    label: "Análise",
    items: [
      { href: "/relatorios",    label: "Relatórios",    icon: "📄" },
    ],
  },
  {
    label: "Conta",
    items: [
      { href: "/configuracao",  label: "Configuração",  icon: "⚙️" },
    ],
  },
];

export function AppShell({
  orgName, email, children,
}: {
  orgName: string;
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const sidebarWidth = collapsed ? "md:w-16" : "md:w-60";

  return (
    <div className="min-h-screen bg-primary-50/40">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-primary-700 bg-primary-600 px-4 text-white md:hidden">
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/10 active:bg-white/20"
        >
          <Hamburger />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2" aria-label="MAPA Tesouraria">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/gi-mark.svg" alt="" className="h-8 w-8 [filter:brightness(0)_invert(1)]" />
          <strong className="text-lg">MAPA</strong>
        </Link>
        <div className="w-10" />
      </header>

      <div className="flex">
        {open && (
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            aria-hidden="true"
          />
        )}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-primary-600 text-white transition-all duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0",
            sidebarWidth,
            collapsed ? "md:px-2 md:py-4" : "p-5",
            !collapsed && "p-5",
            open ? "translate-x-0 shadow-xl" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className={cn("mb-7 flex items-center", collapsed ? "md:justify-center md:mb-4" : "justify-between")}>
            <Link
              href="/dashboard"
              className={cn("flex items-center gap-2.5", collapsed ? "md:px-0" : "px-1.5")}
              aria-label="MAPA Tesouraria"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/gi-mark.svg" alt="" className="h-8 w-8 [filter:brightness(0)_invert(1)]" />
              {!collapsed && <strong className="text-lg">MAPA</strong>}
            </Link>
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-white/85 hover:bg-white/10 md:hidden"
            >
              <Close />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden">
            {NAV_SECTIONS.map((section, sIdx) => (
              <div
                key={section.label}
                className={cn(
                  sIdx > 0 && !collapsed && "mt-4 border-t border-white/10 pt-3",
                  sIdx > 0 && collapsed && "md:mt-2 md:border-t md:border-white/10 md:pt-2",
                )}
              >
                {!collapsed && (
                  <div className="mb-1 px-3.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">
                    {section.label}
                  </div>
                )}
                {section.items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "relative mb-1 flex items-center rounded-md text-sm font-medium transition-colors",
                        collapsed
                          ? "md:h-10 md:w-10 md:justify-center md:p-0 md:mx-auto"
                          : "gap-3 px-3.5 py-2.5",
                        active
                          ? "bg-white/15 text-white"
                          : "text-white/75 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <span className={cn("text-center opacity-90", collapsed ? "" : "w-[18px]")}>
                        {item.icon}
                      </span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {typeof item.count === "number" && item.count > 0 && (
                        <span
                          className={cn(
                            "ml-auto inline-flex items-center justify-center rounded-full bg-gold-500 px-1.5 text-[10px] font-bold leading-5 text-ink",
                            collapsed && "md:absolute md:-right-1 md:-top-1 md:ml-0 md:h-4 md:min-w-4 md:px-1",
                          )}
                        >
                          {item.count > 99 ? "99+" : item.count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {!collapsed && (
            <div className="mt-4 rounded-md bg-white/10 p-3.5 text-sm">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/55">Empresa ativa</div>
              <div className="mt-1 font-semibold leading-tight">{orgName}</div>
              <div className="mt-2 truncate text-xs text-white/65">{email}</div>
              <form action="/sair" method="post" className="mt-3">
                <button type="submit" className="w-full rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/10">
                  Sair
                </button>
              </form>
            </div>
          )}

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            className={cn(
              "mt-3 hidden items-center gap-2 rounded-md border border-white/15 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 md:flex",
              collapsed ? "md:justify-center md:p-2" : "px-3 py-2",
            )}
          >
            <ChevronsRight
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-300",
                !collapsed && "rotate-180",
              )}
              aria-hidden="true"
            />
            {!collapsed && <span>Ocultar</span>}
          </button>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}

function Hamburger() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function Close() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="6" y1="6"  x2="18" y2="18" />
      <line x1="18" y1="6" x2="6"  y2="18" />
    </svg>
  );
}
