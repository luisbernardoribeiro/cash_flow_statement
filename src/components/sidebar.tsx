"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function Sidebar({ orgName, email }: { orgName: string; email: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-col bg-primary-600 p-5 text-white">
      <Link href="/dashboard" className="mb-7 flex items-center gap-2.5 px-1.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 font-extrabold">M</span>
        <strong className="text-lg">MAPA</strong>
      </Link>

      <nav className="flex-1">
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
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              )}
            >
              <span className="w-[18px] text-center opacity-90">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 rounded-md bg-white/10 p-3.5 text-sm">
        <div className="text-[10px] uppercase tracking-wider text-white/55 font-semibold">Empresa ativa</div>
        <div className="mt-1 font-semibold leading-tight">{orgName}</div>
        <div className="mt-2 truncate text-xs text-white/65">{email}</div>
        <form action="/sair" method="post" className="mt-3">
          <button type="submit" className="w-full rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/10">
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
