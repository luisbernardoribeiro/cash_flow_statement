import Link from "next/link";
import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { transactions, categories, accounts, suppliers } from "@/lib/db/schema";
import { and, desc, eq, gte, ilike, lte, sql, count } from "drizzle-orm";
import { formatEUR, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Movimentos" };

const PAGE_SIZE = 25;

type SearchParams = Promise<{
  tipo?: "entrada" | "saida";
  cat?: string;
  forn?: string;
  conta?: string;
  q?: string;
  de?: string;
  ate?: string;
  page?: string;
}>;

export default async function MovimentosPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireActiveOrg();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const filters = [eq(transactions.orgId, ctx.orgId)];
  if (params.tipo === "entrada" || params.tipo === "saida") filters.push(eq(transactions.type, params.tipo));
  if (params.cat)   filters.push(eq(transactions.categoryId, params.cat));
  if (params.forn)  filters.push(eq(transactions.supplierId, params.forn));
  if (params.conta) filters.push(eq(transactions.accountId, params.conta));
  if (params.de)    filters.push(gte(transactions.date, params.de));
  if (params.ate)   filters.push(lte(transactions.date, params.ate));
  if (params.q)     filters.push(ilike(transactions.description, `%${params.q}%`));

  const where = and(...filters);

  const [rows, [{ total }], [agg], cats, sups, accs] = await Promise.all([
    db.select({
      id: transactions.id,
      date: transactions.date,
      type: transactions.type,
      description: transactions.description,
      amount: transactions.amount,
      categoryName: categories.name,
      supplierName: suppliers.name,
      accountName: accounts.name,
    })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(suppliers, eq(transactions.supplierId, suppliers.id))
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(where)
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),

    db.select({ total: count() }).from(transactions).where(where),

    db.select({
      entradas: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'entrada' THEN ${transactions.amount} ELSE 0 END), 0)`,
      saidas:   sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'saida'   THEN ${transactions.amount} ELSE 0 END), 0)`,
    }).from(transactions).where(where),

    db.select({ id: categories.id, name: categories.name, type: categories.type })
      .from(categories).where(eq(categories.orgId, ctx.orgId)).orderBy(categories.name),

    db.select({ id: suppliers.id, name: suppliers.name })
      .from(suppliers).where(eq(suppliers.orgId, ctx.orgId)).orderBy(suppliers.name),

    db.select({ id: accounts.id, name: accounts.name })
      .from(accounts).where(eq(accounts.orgId, ctx.orgId)).orderBy(accounts.name),
  ]);

  const entradas = Number(agg.entradas);
  const saidas = Number(agg.saidas);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = !!(params.tipo || params.cat || params.forn || params.conta || params.q || params.de || params.ate);

  return (
    <div className="px-4 py-5 md:px-10 md:py-7">
      <PageHeader
        title="Movimentos"
        breadcrumb={[{ label: "Início", href: "/dashboard" }, { label: "Movimentos" }]}
        sub={`${total} movimento${total === 1 ? "" : "s"}${hasFilters ? " no filtro atual" : ""}`}
        actions={
          <Link href="/movimentos/novo" className="btn btn-primary">+ Novo Movimento</Link>
        }
      />

      <FiltersBar params={params} cats={cats} sups={sups} accs={accs} hasFilters={hasFilters} />

      <SummaryStrip entradas={entradas} saidas={saidas} total={total} hasFilters={hasFilters} />

      {rows.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-[#15151E]">
            {/* Mobile: lista de cards */}
            <ul className="divide-y divide-white/10 md:hidden">
              {rows.map((r) => {
                const isIn = r.type === "entrada";
                return (
                  <li key={r.id}>
                    <Link href={`/movimentos/${r.id}`} className="block px-4 py-3 hover:bg-white/5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge tone={isIn ? "success" : "danger"}>{isIn ? "Entrada" : "Saída"}</Badge>
                            <span className="text-xs text-white/60 whitespace-nowrap">{formatDate(r.date)}</span>
                          </div>
                          <div className="mt-1 line-clamp-2 font-medium leading-snug">{r.description}</div>
                          <div className="mt-1 truncate text-xs text-white/60">
                            {r.categoryName ?? "—"}
                            {r.supplierName && <> · {r.supplierName}</>}
                            {r.accountName && <> · {r.accountName}</>}
                          </div>
                        </div>
                        <div className={`shrink-0 text-right font-bold tabular-nums whitespace-nowrap ${
                          isIn ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {isIn ? "+ " : "- "}{formatEUR(Number(r.amount))}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Desktop: tabela */}
            <table className="hidden w-full text-sm md:table">
              <thead className="bg-white/5">
                <tr>
                  <Th>Data</Th>
                  <Th>Tipo</Th>
                  <Th>Descrição</Th>
                  <Th>Categoria</Th>
                  <Th>Fornecedor</Th>
                  <Th>Conta</Th>
                  <Th align="right">Valor</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-white/10 hover:bg-white/5 cursor-pointer">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Link href={`/movimentos/${r.id}`} className="block">{formatDate(r.date)}</Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/movimentos/${r.id}`} className="block">
                        <Badge tone={r.type === "entrada" ? "success" : "danger"}>
                          {r.type === "entrada" ? "Entrada" : "Saída"}
                        </Badge>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/movimentos/${r.id}`} className="block hover:text-gold-500">{r.description}</Link>
                    </td>
                    <td className="px-4 py-3.5 text-white/60">{r.categoryName ?? "—"}</td>
                    <td className="px-4 py-3.5 text-white/60">{r.supplierName ?? "—"}</td>
                    <td className="px-4 py-3.5 text-white/60">{r.accountName ?? "—"}</td>
                    <td className={`px-4 py-3.5 text-right font-bold tabular-nums whitespace-nowrap ${
                      r.type === "entrada" ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      <Link href={`/movimentos/${r.id}`} className="block">
                        {r.type === "entrada" ? "+ " : "- "}{formatEUR(Number(r.amount))}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} params={params} />}
        </>
      )}
    </div>
  );
}

function FiltersBar({
  params, cats, sups, accs, hasFilters,
}: {
  params: { tipo?: string; cat?: string; forn?: string; conta?: string; q?: string; de?: string; ate?: string };
  cats: Array<{ id: string; name: string; type: string }>;
  sups: Array<{ id: string; name: string }>;
  accs: Array<{ id: string; name: string }>;
  hasFilters: boolean;
}) {
  return (
    <form
      method="get"
      className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-[#15151E] p-3 md:grid-cols-3 lg:flex lg:flex-wrap lg:items-center"
    >
      <Input name="q" type="search" value={params.q} placeholder="Procurar descrição…" wide />
      <Select name="tipo" value={params.tipo}>
        <option value="">Tipo: Todos</option>
        <option value="entrada">Apenas Entradas</option>
        <option value="saida">Apenas Saídas</option>
      </Select>
      <Select name="cat" value={params.cat}>
        <option value="">Categoria: Todas</option>
        {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      <Select name="forn" value={params.forn}>
        <option value="">Fornecedor: Todos</option>
        {sups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select>
      <Select name="conta" value={params.conta}>
        <option value="">Conta: Todas</option>
        {accs.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </Select>
      <Input name="de"  type="date" value={params.de}  title="De" />
      <Input name="ate" type="date" value={params.ate} title="Até" />
      <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
        Filtrar
      </button>
      {hasFilters && (
        <Link href="/movimentos" className="text-sm font-medium text-gold-500 hover:text-gold-400 hover:underline lg:ml-auto">
          Limpar
        </Link>
      )}
    </form>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th className={`px-4 py-3 text-${align ?? "left"} text-xs font-bold uppercase tracking-wider text-white/60`}>
      {children}
    </th>
  );
}

function Select({ name, value, children }: { name: string; value?: string; children: React.ReactNode }) {
  return (
    <select name={name} defaultValue={value ?? ""} className="rounded-md border border-white/10 bg-[#15151E] px-3 py-2 text-sm">
      {children}
    </select>
  );
}

function Input({
  name, type, value, placeholder, title, wide,
}: {
  name: string; type: string; value?: string; placeholder?: string; title?: string; wide?: boolean;
}) {
  return (
    <input
      name={name}
      type={type}
      defaultValue={value}
      placeholder={placeholder}
      title={title}
      className={`rounded-md border border-white/10 bg-[#15151E] px-3 py-2 text-sm ${wide ? "min-w-[220px] flex-1" : ""}`}
    />
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "success" | "danger" }) {
  const cls = tone === "success" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>;
}

function SummaryStrip({
  entradas, saidas, total, hasFilters,
}: { entradas: number; saidas: number; total: number; hasFilters: boolean }) {
  return (
    <div className="mb-4 flex flex-wrap gap-7 rounded-lg border border-white/10 bg-[#15151E] px-5 py-3.5">
      <Stat label={`Entradas${hasFilters ? " (filtro)" : ""}`} value={`+ ${formatEUR(entradas)}`} tone="success" />
      <Stat label={`Saídas${hasFilters ? " (filtro)" : ""}`}   value={`- ${formatEUR(saidas)}`}   tone="danger" />
      <Stat label={`Saldo${hasFilters ? " (filtro)" : ""}`}    value={formatEUR(entradas - saidas)} tone="primary" />
      <Stat label="Movimentos" value={String(total)} tone="ink" className="ml-auto" />
    </div>
  );
}

function Stat({ label, value, tone, className }: {
  label: string; value: string;
  tone: "success" | "danger" | "primary" | "ink";
  className?: string;
}) {
  const color =
    tone === "success" ? "text-emerald-400" :
    tone === "danger"  ? "text-rose-400"  :
    tone === "primary" ? "text-white" :
                         "text-white";
  return (
    <div className={className}>
      <div className="text-[11px] font-bold uppercase tracking-wider text-white/60">{label}</div>
      <div className={`mt-0.5 text-xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function Pagination({ page, totalPages, params }: { page: number; totalPages: number; params: Record<string, string | undefined> }) {
  const linkFor = (p: number) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && k !== "page" && q.set(k, String(v)));
    q.set("page", String(p));
    return `/movimentos?${q.toString()}`;
  };
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      {page > 1 && <Link href={linkFor(page - 1)} className="rounded border border-white/10 bg-[#15151E] px-3 py-1.5 text-sm hover:bg-white/5">‹ Anterior</Link>}
      <span className="text-sm text-white/60">Página {page} de {totalPages}</span>
      {page < totalPages && <Link href={linkFor(page + 1)} className="rounded border border-white/10 bg-[#15151E] px-3 py-1.5 text-sm hover:bg-white/5">Seguinte ›</Link>}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-white/15 bg-[#15151E] p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-2xl">📒</div>
      <h3 className="text-xl font-bold">
        {hasFilters ? "Sem movimentos no filtro atual" : "Sem movimentos"}
      </h3>
      <p className="mt-2 mb-5 text-sm text-white/60">
        {hasFilters ? "Ajusta ou limpa os filtros para ver outros resultados." : "Regista o primeiro movimento para começar."}
      </p>
      <div className="flex justify-center gap-3 flex-wrap">
        {hasFilters && <Link href="/movimentos" className="btn btn-ghost">Limpar filtros</Link>}
        <Link href="/movimentos/novo" className="btn btn-primary">+ Novo Movimento</Link>
      </div>
    </div>
  );
}
