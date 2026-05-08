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
    <div className="px-10 py-7">
      <PageHeader
        title="Movimentos"
        breadcrumb={[{ label: "Início", href: "/dashboard" }, { label: "Movimentos" }]}
        sub={`${total} movimento${total === 1 ? "" : "s"}${hasFilters ? " no filtro atual" : ""}`}
        actions={
          <Link href="/movimentos/novo" className="btn btn-primary">+ Novo Movimento</Link>
        }
      />

      <SummaryStrip entradas={entradas} saidas={saidas} total={total} hasFilters={hasFilters} />

      {/* Form-anchor invisível — todos os inputs filter abaixo apontam para este form via attribute form="filtros" */}
      <form id="filtros" method="get" className="hidden" />

      <div className="overflow-x-auto rounded-lg border border-[#D5D8DC] bg-white">
        <table className="w-full text-sm">
          <thead>
            {/* Linha 1: títulos */}
            <tr className="bg-primary-50/60">
              <Th>Data</Th>
              <Th>Tipo</Th>
              <Th>Descrição</Th>
              <Th>Categoria</Th>
              <Th>Fornecedor</Th>
              <Th>Conta</Th>
              <Th align="right">Valor</Th>
            </tr>
            {/* Linha 2: filtros inline */}
            <tr className="border-t border-[#D5D8DC] bg-white">
              <ThFilter>
                <div className="flex flex-col gap-1">
                  <FInput name="de"  type="date" value={params.de}  title="De" />
                  <FInput name="ate" type="date" value={params.ate} title="Até" />
                </div>
              </ThFilter>
              <ThFilter>
                <FSelect name="tipo" value={params.tipo}>
                  <option value="">Todos</option>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </FSelect>
              </ThFilter>
              <ThFilter>
                <FInput name="q" type="search" value={params.q} placeholder="Procurar…" />
              </ThFilter>
              <ThFilter>
                <FSelect name="cat" value={params.cat}>
                  <option value="">Todas</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </FSelect>
              </ThFilter>
              <ThFilter>
                <FSelect name="forn" value={params.forn}>
                  <option value="">Todos</option>
                  {sups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </FSelect>
              </ThFilter>
              <ThFilter>
                <FSelect name="conta" value={params.conta}>
                  <option value="">Todas</option>
                  {accs.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </FSelect>
              </ThFilter>
              <ThFilter align="right">
                <div className="flex justify-end gap-1.5">
                  <button form="filtros" type="submit" className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700">
                    Filtrar
                  </button>
                  {hasFilters && (
                    <Link href="/movimentos" className="rounded-md border border-[#D5D8DC] bg-white px-3 py-1.5 text-xs font-semibold text-[#4A4A5C] hover:bg-primary-50">
                      Limpar
                    </Link>
                  )}
                </div>
              </ThFilter>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <EmptyState hasFilters={hasFilters} />
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-[#D5D8DC] hover:bg-primary-50/30 cursor-pointer">
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
                    <Link href={`/movimentos/${r.id}`} className="block hover:text-primary-600">{r.description}</Link>
                  </td>
                  <td className="px-4 py-3.5 text-[#4A4A5C]">{r.categoryName ?? "—"}</td>
                  <td className="px-4 py-3.5 text-[#4A4A5C]">{r.supplierName ?? "—"}</td>
                  <td className="px-4 py-3.5 text-[#4A4A5C]">{r.accountName ?? "—"}</td>
                  <td className={`px-4 py-3.5 text-right font-bold tabular-nums whitespace-nowrap ${
                    r.type === "entrada" ? "text-success" : "text-danger"
                  }`}>
                    <Link href={`/movimentos/${r.id}`} className="block">
                      {r.type === "entrada" ? "+ " : "- "}{formatEUR(Number(r.amount))}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && rows.length > 0 && <Pagination page={page} totalPages={totalPages} params={params} />}
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th className={`px-4 py-3 text-${align ?? "left"} text-xs font-bold uppercase tracking-wider text-[#4A4A5C]`}>
      {children}
    </th>
  );
}

function ThFilter({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return <th className={`px-3 py-2 text-${align ?? "left"} font-normal align-top`}>{children}</th>;
}

function FInput({
  name, type, value, placeholder, title,
}: {
  name: string; type: string; value?: string; placeholder?: string; title?: string;
}) {
  return (
    <input
      form="filtros"
      name={name}
      type={type}
      defaultValue={value}
      placeholder={placeholder}
      title={title}
      className="w-full rounded-md border border-[#D5D8DC] bg-white px-2 py-1 text-xs focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600/30"
    />
  );
}

function FSelect({ name, value, children }: { name: string; value?: string; children: React.ReactNode }) {
  return (
    <select
      form="filtros"
      name={name}
      defaultValue={value ?? ""}
      className="w-full rounded-md border border-[#D5D8DC] bg-white px-2 py-1 text-xs focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600/30"
    >
      {children}
    </select>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "success" | "danger" }) {
  const cls = tone === "success" ? "bg-success-bg text-success" : "bg-danger-bg text-danger";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>;
}

function SummaryStrip({
  entradas, saidas, total, hasFilters,
}: { entradas: number; saidas: number; total: number; hasFilters: boolean }) {
  return (
    <div className="mb-3 flex flex-wrap gap-7 rounded-lg border border-[#D5D8DC] bg-white px-5 py-3.5">
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
    tone === "success" ? "text-success" :
    tone === "danger"  ? "text-danger"  :
    tone === "primary" ? "text-primary-600" :
                         "text-ink";
  return (
    <div className={className}>
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#4A4A5C]">{label}</div>
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
      {page > 1 && <Link href={linkFor(page - 1)} className="rounded border border-[#D5D8DC] bg-white px-3 py-1.5 text-sm hover:bg-primary-50">‹ Anterior</Link>}
      <span className="text-sm text-[#4A4A5C]">Página {page} de {totalPages}</span>
      {page < totalPages && <Link href={linkFor(page + 1)} className="rounded border border-[#D5D8DC] bg-white px-3 py-1.5 text-sm hover:bg-primary-50">Seguinte ›</Link>}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-2xl">📒</div>
      <h3 className="text-xl font-bold">
        {hasFilters ? "Sem movimentos no filtro atual" : "Sem movimentos"}
      </h3>
      <p className="mt-2 mb-5 text-sm text-[#4A4A5C]">
        {hasFilters ? "Ajusta ou limpa os filtros para ver outros resultados." : "Regista o primeiro movimento para começar."}
      </p>
      <div className="flex justify-center gap-3 flex-wrap">
        {hasFilters && <Link href="/movimentos" className="btn btn-ghost">Limpar filtros</Link>}
        <Link href="/movimentos/novo" className="btn btn-primary">+ Novo Movimento</Link>
      </div>
    </div>
  );
}
