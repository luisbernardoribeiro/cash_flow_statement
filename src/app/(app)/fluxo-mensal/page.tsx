import Link from "next/link";
import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { transactions, categories } from "@/lib/db/schema";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { formatEUR } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Fluxo Mensal" };

type SearchParams = Promise<{ ano?: string }>;

export default async function FluxoMensalPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireActiveOrg();
  const params = await searchParams;

  // Default: ano com mais movimentos (não o ano civil corrente, que pode estar vazio)
  let defaultYear = new Date().getFullYear();
  if (!params.ano) {
    const [latestMov] = await db
      .select({ y: sql<number>`EXTRACT(YEAR FROM MAX(${transactions.date}))::int` })
      .from(transactions)
      .where(eq(transactions.orgId, ctx.orgId));
    if (latestMov?.y) defaultYear = latestMov.y;
  }
  const year = Number(params.ano) || defaultYear;

  const yearStart = `${year}-01-01`;
  const yearEnd   = `${year}-12-31`;

  // Buscar todas as categorias da org (incluindo as não usadas — útil para ver linhas vazias)
  const cats = await db
    .select({ id: categories.id, name: categories.name, type: categories.type, group: categories.group })
    .from(categories)
    .where(eq(categories.orgId, ctx.orgId))
    .orderBy(asc(categories.type), asc(categories.group), asc(categories.name));

  // Agregação por categoria + mês
  const aggRows = await db
    .select({
      categoryId: transactions.categoryId,
      type: transactions.type,
      month: sql<number>`EXTRACT(MONTH FROM ${transactions.date})::int`,
      total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.orgId, ctx.orgId),
        gte(transactions.date, yearStart),
        lte(transactions.date, yearEnd),
      )
    )
    .groupBy(transactions.categoryId, transactions.type, sql`EXTRACT(MONTH FROM ${transactions.date})`);

  // Construir matriz: catId → [mes1..mes12]
  const matrix = new Map<string, number[]>();
  // Para "sem categoria" (catId null) também cria uma entrada
  for (const r of aggRows) {
    const key = r.categoryId ?? "__nocat__";
    if (!matrix.has(key)) matrix.set(key, Array(12).fill(0));
    const monthIdx = r.month - 1;
    matrix.get(key)![monthIdx] = Number(r.total);
  }

  // Determinar quais categorias têm dados
  const usedCatIds = new Set(matrix.keys());
  const visibleCats = cats.filter((c) => usedCatIds.has(c.id));
  const hasNoCat = matrix.has("__nocat__");

  // Totais por mês (saldo líquido)
  const monthTotals = Array(12).fill(0);
  for (const c of visibleCats) {
    const arr = matrix.get(c.id);
    if (!arr) continue;
    const sign = c.type === "saida" ? -1 : 1;
    for (let m = 0; m < 12; m++) monthTotals[m] += arr[m] * sign;
  }
  if (hasNoCat) {
    const arr = matrix.get("__nocat__")!;
    for (let m = 0; m < 12; m++) monthTotals[m] += arr[m];
  }

  // Saldo acumulado
  const acumulado: number[] = [];
  let running = 0;
  for (let m = 0; m < 12; m++) {
    running += monthTotals[m];
    acumulado.push(running);
  }

  const monthLabels = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  // Anos disponíveis (do mais antigo ao mais recente)
  const yearsAgg = await db
    .select({ y: sql<number>`EXTRACT(YEAR FROM ${transactions.date})::int` })
    .from(transactions)
    .where(eq(transactions.orgId, ctx.orgId))
    .groupBy(sql`EXTRACT(YEAR FROM ${transactions.date})`)
    .orderBy(asc(sql`EXTRACT(YEAR FROM ${transactions.date})`));
  const years = yearsAgg.map((r) => r.y);
  if (!years.includes(year)) years.push(year);

  return (
    <div className="px-4 py-5 md:px-10 md:py-7">
      <PageHeader
        title="Fluxo Mensal"
        breadcrumb={[{ label: "Início", href: "/dashboard" }, { label: "Fluxo Mensal" }]}
        sub={`Matriz de Categoria × Mês para ${year} · valores em € (saídas negativas)`}
        actions={
          <form className="flex items-center gap-2">
            <label htmlFor="ano" className="text-xs font-bold uppercase tracking-wider text-[#4A4A5C]">Ano</label>
            <select id="ano" name="ano" defaultValue={String(year)} className="rounded-md border border-[#D5D8DC] bg-white px-3 py-2 text-sm">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button type="submit" className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              Ver
            </button>
          </form>
        }
      />

      {visibleCats.length === 0 && !hasNoCat ? (
        <div className="rounded-2xl border-2 border-dashed border-primary-200 bg-white p-10 text-center">
          <h3 className="text-xl font-bold">Sem dados em {year}</h3>
          <p className="mt-2 mb-5 text-sm text-[#4A4A5C]">Não há movimentos registados neste ano.</p>
          <Link href="/movimentos/novo" className="btn btn-primary">+ Novo Movimento</Link>
        </div>
      ) : (
        <div className="overflow-auto rounded-lg border border-[#D5D8DC] bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-primary-50/60 sticky top-0">
              <tr>
                <th className="sticky left-0 z-10 bg-primary-50/60 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#4A4A5C] min-w-[220px]">Categoria</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#4A4A5C]">Tipo</th>
                {monthLabels.map((m) => (
                  <th key={m} className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-[#4A4A5C]">
                    {m}/{String(year).slice(-2)}
                  </th>
                ))}
                <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-100/60">Total Ano</th>
              </tr>
            </thead>
            <tbody>
              {visibleCats.map((c) => {
                const arr = matrix.get(c.id) ?? Array(12).fill(0);
                const sign = c.type === "saida" ? -1 : 1;
                const total = arr.reduce((a, b) => a + b, 0) * sign;
                return (
                  <tr key={c.id} className="border-t border-[#D5D8DC] hover:bg-primary-50/30">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2.5 font-medium">
                      <div>{c.name}</div>
                      {c.group && <div className="text-[10px] text-[#4A4A5C]">{c.group}</div>}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={c.type === "entrada" ? "success" : "danger"}>
                        {c.type === "entrada" ? "Entrada" : "Saída"}
                      </Badge>
                    </td>
                    {arr.map((v, i) => (
                      <td key={i} className={`px-3 py-2.5 text-right tabular-nums whitespace-nowrap ${
                        v === 0 ? "text-[#9AA0A6]" : (sign === -1 ? "text-danger" : "text-success")
                      }`}>
                        {v === 0 ? "—" : (sign === -1 ? "- " : "+ ") + formatEUR(v).replace(" €", "")}
                      </td>
                    ))}
                    <td className="bg-primary-50/40 px-3 py-2.5 text-right font-bold tabular-nums whitespace-nowrap">
                      {total === 0 ? "—" : formatEUR(total)}
                    </td>
                  </tr>
                );
              })}
              {hasNoCat && (() => {
                const arr = matrix.get("__nocat__")!;
                const total = arr.reduce((a, b) => a + b, 0);
                return (
                  <tr className="border-t border-[#D5D8DC] bg-warning-bg/40">
                    <td className="sticky left-0 z-10 bg-warning-bg/40 px-4 py-2.5 font-medium italic text-[#4A4A5C]">
                      (sem categoria)
                    </td>
                    <td className="px-3 py-2.5 text-[#4A4A5C]">—</td>
                    {arr.map((v, i) => (
                      <td key={i} className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                        {v === 0 ? "—" : formatEUR(v).replace(" €", "")}
                      </td>
                    ))}
                    <td className="bg-primary-50/40 px-3 py-2.5 text-right font-bold tabular-nums">
                      {total === 0 ? "—" : formatEUR(total)}
                    </td>
                  </tr>
                );
              })()}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary-600 bg-primary-600 text-white">
                <td className="sticky left-0 z-10 bg-primary-600 px-4 py-3 font-bold">SALDO LÍQUIDO MENSAL</td>
                <td className="px-3 py-3" />
                {monthTotals.map((v, i) => (
                  <td key={i} className="px-3 py-3 text-right font-bold tabular-nums whitespace-nowrap">
                    {v === 0 ? "—" : formatEUR(v).replace(" €", "")}
                  </td>
                ))}
                <td className="bg-primary-700 px-3 py-3 text-right font-extrabold tabular-nums">
                  {formatEUR(monthTotals.reduce((a, b) => a + b, 0))}
                </td>
              </tr>
              <tr className="bg-gold-500 text-white">
                <td className="sticky left-0 z-10 bg-gold-500 px-4 py-3 font-bold">SALDO ACUMULADO</td>
                <td className="px-3 py-3" />
                {acumulado.map((v, i) => (
                  <td key={i} className="px-3 py-3 text-right font-bold tabular-nums whitespace-nowrap">
                    {formatEUR(v).replace(" €", "")}
                  </td>
                ))}
                <td className="bg-gold-600 px-3 py-3 text-right font-extrabold tabular-nums">
                  {formatEUR(acumulado[11])}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "success" | "danger" }) {
  const cls = tone === "success" ? "bg-success-bg text-success" : "bg-danger-bg text-danger";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>;
}
