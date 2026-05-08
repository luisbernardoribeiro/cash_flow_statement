import Link from "next/link";
import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { transactions, categories, accounts, suppliers } from "@/lib/db/schema";
import { and, desc, eq, gte, lte, sql, count } from "drizzle-orm";
import { formatEUR, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Movimentos" };

const PAGE_SIZE = 25;

type SearchParams = Promise<{
  tipo?: "entrada" | "saida";
  cat?: string;
  conta?: string;
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
  if (params.conta) filters.push(eq(transactions.accountId, params.conta));
  if (params.de)    filters.push(gte(transactions.date, params.de));
  if (params.ate)   filters.push(lte(transactions.date, params.ate));

  const where = and(...filters);

  const [rows, [{ total }], [agg], cats, accs] = await Promise.all([
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

    db.select({ id: accounts.id, name: accounts.name })
      .from(accounts).where(eq(accounts.orgId, ctx.orgId)).orderBy(accounts.name),
  ]);

  const entradas = Number(agg.entradas);
  const saidas = Number(agg.saidas);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="px-10 py-7">
      <PageHeader
        title="Movimentos"
        breadcrumb={[{ label: "Início", href: "/dashboard" }, { label: "Movimentos" }]}
        sub={`${total} movimento${total === 1 ? "" : "s"} no filtro atual`}
        actions={
          <>
            <Link href="/importar" className="btn btn-ghost">Importar Excel</Link>
            <Link href="/movimentos/novo" className="btn btn-primary">+ Novo Movimento</Link>
          </>
        }
      />

      <FiltersBar params={params} cats={cats} accs={accs} />

      <SummaryStrip entradas={entradas} saidas={saidas} total={total} />

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-[#D5D8DC] bg-white">
            <table className="w-full text-sm">
              <thead className="bg-primary-50/60">
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

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th className={`px-4 py-3 text-${align ?? "left"} text-xs font-bold uppercase tracking-wider text-[#4A4A5C]`}>
      {children}
    </th>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "success" | "danger" }) {
  const cls = tone === "success" ? "bg-success-bg text-success" : "bg-danger-bg text-danger";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>;
}

function FiltersBar({
  params, cats, accs,
}: {
  params: { tipo?: string; cat?: string; conta?: string; de?: string; ate?: string };
  cats: Array<{ id: string; name: string; type: string }>;
  accs: Array<{ id: string; name: string }>;
}) {
  return (
    <form method="get" className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-[#D5D8DC] bg-white p-3">
      <Select name="tipo" value={params.tipo}>
        <option value="">Tipo: Todos</option>
        <option value="entrada">Apenas Entradas</option>
        <option value="saida">Apenas Saídas</option>
      </Select>
      <Select name="cat" value={params.cat}>
        <option value="">Categoria: Todas</option>
        {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      <Select name="conta" value={params.conta}>
        <option value="">Conta: Todas</option>
        {accs.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </Select>
      <Input name="de" type="date" value={params.de} placeholder="De" />
      <Input name="ate" type="date" value={params.ate} placeholder="Até" />
      <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
        Filtrar
      </button>
      <Link href="/movimentos" className="ml-auto text-sm font-medium text-primary-600 hover:underline">Limpar</Link>
    </form>
  );
}

function Select({ name, value, children }: { name: string; value?: string; children: React.ReactNode }) {
  return (
    <select name={name} defaultValue={value} className="rounded-md border border-[#D5D8DC] bg-white px-3 py-2 text-sm">
      {children}
    </select>
  );
}

function Input({ name, type, value, placeholder }: { name: string; type: string; value?: string; placeholder?: string }) {
  return (
    <input
      name={name}
      type={type}
      defaultValue={value}
      placeholder={placeholder}
      className="rounded-md border border-[#D5D8DC] bg-white px-3 py-2 text-sm"
    />
  );
}

function SummaryStrip({ entradas, saidas, total }: { entradas: number; saidas: number; total: number }) {
  return (
    <div className="mb-4 flex flex-wrap gap-7 rounded-lg border border-[#D5D8DC] bg-white px-5 py-3.5">
      <Stat label="Entradas" value={`+ ${formatEUR(entradas)}`} tone="success" />
      <Stat label="Saídas"   value={`- ${formatEUR(saidas)}`}   tone="danger" />
      <Stat label="Saldo"    value={formatEUR(entradas - saidas)} tone="primary" />
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

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-primary-200 bg-white p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-2xl">📥</div>
      <h3 className="text-xl font-bold">Nenhum movimento encontrado</h3>
      <p className="mt-2 mb-5 text-sm text-[#4A4A5C]">Cria o primeiro movimento ou importa o teu mapa em Excel.</p>
      <div className="flex justify-center gap-3 flex-wrap">
        <Link href="/movimentos/novo" className="btn btn-primary">+ Novo Movimento</Link>
        <Link href="/importar" className="btn btn-ghost">Importar Excel</Link>
      </div>
    </div>
  );
}
