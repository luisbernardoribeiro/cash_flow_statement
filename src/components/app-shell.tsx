"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",     label: "Dashboard",     icon: "📊" },
  { href: "/movimentos",    label: "Movimentos",    icon: "€" },
  { href: "/fluxo-mensal",  label: "Fluxo Mensal",  icon: "📅" },
  { href: "/orcamentos",    label: "Orçamentos",    icon: "🎯" },
  { href: "/contas",        label: "Contas",        icon: "🏦" },
  { href: "/categorias",    label: "Categorias",    icon: "🏷️" },
  { href: "/fornecedores",  label: "Fornecedores",  icon: "🤝" },
  { href: "/relatorios",    label: "Relatórios",    icon: "📄" },
  { href: "/configuracao",  label: "Configuração",  icon: "⚙️" },
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

  // Fecha o drawer ao navegar
  useEffect(() => { setOpen(false); }, [pathname]);

  // Bloqueia scroll do body quando drawer aberto (mobile)
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="min-h-screen bg-primary-50/40">
      {/* Top bar mobile (só visível em <md) */}
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
          <img src="/brand/gi-mark.svg" alt="" className="h-8 w-8 rounded-lg bg-white p-1" />
          <strong className="text-lg">MAPA</strong>
        </Link>
        <div className="w-10" /> {/* placeholder para centrar o brand */}
      </header>

      <div className="flex">
        {/* Backdrop mobile (clicar fecha) */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-primary-600 p-5 text-white transition-transform duration-200 md:static md:translate-x-0",
            open ? "translate-x-0 shadow-xl" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="mb-7 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5 px-1.5" aria-label="MAPA Tesouraria">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/gi-mark.svg" alt="" className="h-8 w-8 rounded-lg bg-white p-1" />
              <strong className="text-lg">MAPA</strong>
            </Link>
            {/* Botão fechar (só mobile) */}
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-white/85 hover:bg-white/10 md:hidden"
            >
              <Close />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "mb-1 flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-white/15 text-white"
                      : "text-white/75 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <span className="w-[18px] text-center opacity-90">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

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
        </aside>

        {/* Conteúdo */}
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
