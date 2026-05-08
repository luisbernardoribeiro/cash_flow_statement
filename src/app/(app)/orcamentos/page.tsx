import Link from "next/link";
import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { budgets, categories, transactions } from "@/lib/db/schema";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { formatEUR } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { applyToAllMonths, clearBudgets, copyFromPrevious, saveBudgets } from "./actions";

export const metadata = { title: "Orçamentos" };

type SearchParams = Promise<{
  year?: string;
  month?: string;
  ok?: string;
  error?: string;
}>;

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default async function OrcamentosPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireActiveOrg();
  const params = await searchParams;

  // Default = mês com movimentos mais recentes
  const today = new Date();
  let year = Number(params.year);
  let month = Number(params.month);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    const [latest] = await db
      .select({
        y: sql<number>`EXTRACT(YEAR FROM MAX(${transactions.date}))::int`,
        m: sql<number>`EXTRACT(MONTH FROM MAX(${transactions.date}))::int`,
      })
      .from(transactions)
      .where(eq(transactions.orgId, ctx.orgId));
    year  = latest?.y || today.getFullYear();
    month = latest?.m || today.getMonth() + 1;
  }

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // Busca categorias + orçamento atual + realizado
  const [cats, budgetRows, realizedRows] = await Promise.all([
    db.select({
      id: categories.id,
      name: categories.name,
      type: categories.type,
      group: categories.group,
    })
      .from(categories)
      .where(and(eq(categories.orgId, ctx.orgId), eq(categories.archived, false)))
      .orderBy(asc(categories.type), asc(categories.group), asc(categories.name)),

    db.select({
      categoryId: budgets.categoryId,
      plannedAmount: budgets.plannedAmount,
    })
      .from(budgets)
      .where(and(
        eq(budgets.orgId, ctx.orgId),
        eq(budgets.year, year),
        eq(budgets.month, month),
      )),

    db.select({
      categoryId: transactions.categoryId,
      total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
      .from(transactions)
      .where(and(
        eq(transactions.orgId, ctx.orgId),
        gte(transactions.date, monthStart),
        lte(transactions.date, monthEnd),
      ))
      .groupBy(transactions.categoryId),
  ]);

  const budgetMap = new Map<string, number>(
    budgetRows.map((b) => [b.categoryId, Number(b.plannedAmount)])
  );
  const realizedMap = new Map<string, number>(
    realizedRows
      .filter((r): r is typeof r & { categoryId: string } => r.categoryId !== null)
      .map((r) => [r.categoryId, Number(r.total)])
  );

  const entradas = cats.filter((c) => c.type === "entrada");
  const saidas   = cats.filter((c) => c.type === "saida");

  const totalEntradasPlan = entradas.reduce((a, c) => a + (budgetMap.get(c.id) ?? 0), 0);
  const totalSaidasPlan   = saidas.reduce((a, c) => a + (budgetMap.get(c.id) ?? 0), 0);
  const totalEntradasReal = entradas.reduce((a, c) => a + (realizedMap.get(c.id) ?? 0), 0);
  const totalSaidasReal   = saidas.reduce((a, c) => a + (realizedMap.get(c.id) ?? 0), 0);

  const yearsAggResult = await db
    .select({ y: sql<number>`EXTRACT(YEAR FROM ${transactions.date})::int` })
    .from(transactions)
    .where(eq(transactions.orgId, ctx.orgId))
    .groupBy(sql`EXTRACT(YEAR FROM ${transactions.date})`)
    .orderBy(asc(sql`EXTRACT(YEAR FROM ${transactions.date})`));
  const yearOptions = Array.from(new Set([...yearsAggResult.map((r) => r.y), year, today.getFullYear()])).sort();

  const hasBudget = budgetRows.length > 0;

  return (
    <div className="px-4 py-5 md:px-10 md:py-7">
      <PageHeader
        title="Orçamentos"
        breadcrumb={[{ label: "Início", href: "/dashboard" }, { label: "Orçamentos" }]}
        sub="Define quanto queres receber e gastar em cada categoria. Compara com o realizado em tempo real."
      />

      <Toast type={params.ok || params.error} />

      {/* Seletor de período + ações rápidas */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-[#D5D8DC] bg-white p-3.5">
        <form method="get" className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#4A4A5C]">Período</label>
          <select name="month" defaultValue={String(month)} className="rounded-md border border-[#D5D8DC] bg-white px-3 py-2 text-sm">
            {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select name="year" defaultValue={String(year)} className="rounded-md border border-[#D5D8DC] bg-white px-3 py-2 text-sm">
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button type="submit" className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700">
            Ver
          </button>
        </form>

        <div className="ml-auto flex flex-wrap gap-2">
          <form action={copyFromPrevious}>
            <input type="hidden" name="year" value={year} />
            <input type="hidden" name="month" value={month} />
            <button type="submit" className="rounded-md border border-[#D5D8DC] bg-white px-3 py-2 text-xs font-semibold text-[#4A4A5C] hover:bg-primary-50">
              Copiar do mês anterior
            </button>
          </form>
          {hasBudget && (
            <>
              <form action={applyToAllMonths}>
                <input type="hidden" name="year" value={year} />
                <input type="hidden" name="month" value={month} />
                <button type="submit" className="rounded-md border border-[#D5D8DC] bg-white px-3 py-2 text-xs font-semibold text-[#4A4A5C] hover:bg-primary-50">
                  Aplicar a todo o ano {year}
                </button>
              </form>
              <form action={clearBudgets}>
                <input type="hidden" name="year" value={year} />
                <input type="hidden" name="month" value={month} />
                <button type="submit" className="rounded-md border border-danger/30 bg-white px-3 py-2 text-xs font-semibold text-danger hover:bg-danger-bg">
                  Apagar orçamento
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <form action={saveBudgets} className="space-y-6">
        <input type="hidden" name="year" value={year} />
        <input type="hidden" name="month" value={month} />

        {/* Resumo */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <SummaryCard
            label="Entradas planeadas"
            planned={totalEntradasPlan}
            realized={totalEntradasReal}
            tone="success"
          />
          <SummaryCard
            label="Saídas planeadas"
            planned={totalSaidasPlan}
            realized={totalSaidasReal}
            tone="danger"
          />
          <SummaryCard
            label="Saldo planeado"
            planned={totalEntradasPlan - totalSaidasPlan}
            realized={totalEntradasReal - totalSaidasReal}
            tone="primary"
          />
        </div>

        {/* Tabela Entradas */}
        <Section title="Entradas" subtitle={`${entradas.length} categorias`} tone="success">
          <BudgetTable
            cats={entradas}
            budgetMap={budgetMap}
            realizedMap={realizedMap}
            tone="success"
          />
        </Section>

        {/* Tabela Saídas */}
        <Section title="Saídas" subtitle={`${saidas.length} categorias`} tone="danger">
          <BudgetTable
            cats={saidas}
            budgetMap={budgetMap}
            realizedMap={realizedMap}
            tone="danger"
          />
        </Section>

        <div className="sticky bottom-0 -mx-10 border-t border-[#D5D8DC] bg-white/95 px-10 py-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#4A4A5C]">
              📅 A editar o orçamento de <strong>{MONTH_NAMES[month - 1]} {year}</strong>
            </p>
            <button type="submit" className="btn btn-primary">
              💾 Guardar orçamento
            </button>
          </div>
        </div>
      </form>

      <p className="mt-12 text-center text-xs text-[#4A4A5C]">
        ✓ Aprovado por Contabilista Certificado · Alípio Monteiro · CC nº 32897
      </p>
    </div>
  );
}

function Section({
  title, subtitle, tone, children,
}: {
  title: string; subtitle?: string; tone: "success" | "danger";
  children: React.ReactNode;
}) {
  const accent = tone === "success" ? "text-success" : "text-danger";
  return (
    <div className="overflow-hidden rounded-lg border border-[#D5D8DC] bg-white">
      <div className="border-b border-[#D5D8DC] bg-primary-50/40 px-5 py-3">
        <h3 className={`text-sm font-bold uppercase tracking-wider ${accent}`}>{title}</h3>
        {subtitle && <p className="text-xs text-[#4A4A5C]">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function BudgetTable({
  cats, budgetMap, realizedMap, tone,
}: {
  cats: Array<{ id: string; name: string; group: string | null }>;
  budgetMap: Map<string, number>;
  realizedMap: Map<string, number>;
  tone: "success" | "danger";
}) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-bg-soft/50">
        <tr>
          <Th>Categoria</Th>
          <Th>Grupo</Th>
          <Th align="right">Orçamento</Th>
          <Th align="right">Realizado</Th>
          <Th align="right">Variance</Th>
          <Th align="right">% Usado</Th>
        </tr>
      </thead>
      <tbody>
        {cats.map((c) => {
          const planned  = budgetMap.get(c.id) ?? 0;
          const realized = realizedMap.get(c.id) ?? 0;
          const variance = planned - realized;
          const pct = planned > 0 ? Math.round((realized / planned) * 100) : 0;

          // Para Saídas: passar do orçamento é vermelho (variance negativa)
          // Para Entradas: faltar para o orçamento é vermelho (variance positiva)
          const isOver = tone === "danger" ? variance < 0 : variance > 0;

          return (
            <tr key={c.id} className="border-t border-[#D5D8DC] hover:bg-primary-50/20">
              <td className="px-4 py-2.5 font-medium">{c.name}</td>
              <td className="px-4 py-2.5 text-[#4A4A5C]">{c.group ?? "—"}</td>
              <td className="px-4 py-2.5">
                <div className="flex items-center justify-end gap-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9.,]*"
                    name={`budget_${c.id}`}
                    defaultValue={planned > 0 ? planned.toFixed(2).replace(".", ",") : ""}
                    placeholder="0,00"
                    className="w-28 rounded-md border border-[#D5D8DC] bg-white px-2 py-1 text-right text-sm tabular-nums focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600/30"
                  />
                  <span className="text-xs text-[#4A4A5C]">€</span>
                </div>
              </td>
              <td className={`px-4 py-2.5 text-right tabular-nums ${realized > 0 ? "" : "text-[#9AA0A6]"}`}>
                {realized > 0 ? formatEUR(realized) : "—"}
              </td>
              <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${
                planned === 0 ? "text-[#9AA0A6]" :
                isOver ? "text-danger" : "text-success"
              }`}>
                {planned === 0 ? "—" : (variance >= 0 ? "+ " : "- ") + formatEUR(Math.abs(variance))}
              </td>
              <td className="px-4 py-2.5">
                {planned > 0 ? (
                  <UsageBar pct={pct} tone={tone} />
                ) : (
                  <span className="block text-right text-[#9AA0A6]">—</span>
                )}
              </td>
            </tr>
          );
        })}
        {cats.length === 0 && (
          <tr>
            <td colSpan={6} className="px-4 py-6 text-center text-sm text-[#4A4A5C]">
              Sem categorias deste tipo. <Link href="/categorias" className="text-primary-600 underline">Criar uma</Link>.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th className={`px-4 py-2.5 text-${align ?? "left"} text-[10px] font-bold uppercase tracking-wider text-[#4A4A5C]`}>
      {children}
    </th>
  );
}

function UsageBar({ pct, tone }: { pct: number; tone: "success" | "danger" }) {
  const cap = Math.min(pct, 100);
  // Para Saídas: > 100% é mau (vermelho); 80-100 amarelo; < 80 verde
  // Para Entradas: > 100% é bom (verde); igual mas inverso
  let barColor = "bg-success";
  if (tone === "danger") {
    if (pct > 100) barColor = "bg-danger";
    else if (pct > 80) barColor = "bg-warning";
  } else {
    if (pct >= 100) barColor = "bg-success";
    else if (pct >= 80) barColor = "bg-warning";
    else barColor = "bg-danger";
  }
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#E5E7EB]">
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${cap}%` }}
        />
      </div>
      <span className={`min-w-[3rem] text-right text-xs font-semibold tabular-nums ${
        pct > 100 ? "text-danger" : "text-[#4A4A5C]"
      }`}>
        {pct}%
      </span>
    </div>
  );
}

function SummaryCard({
  label, planned, realized, tone,
}: {
  label: string;
  planned: number;
  realized: number;
  tone: "success" | "danger" | "primary";
}) {
  const colorPlanned =
    tone === "success" ? "text-success" :
    tone === "danger"  ? "text-danger"  :
                         "text-primary-600";
  return (
    <div className="rounded-lg border border-[#D5D8DC] bg-white p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#4A4A5C]">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold tabular-nums ${colorPlanned}`}>
        {formatEUR(planned)}
      </div>
      <div className="mt-1 text-xs text-[#4A4A5C]">
        Realizado: <strong className="tabular-nums text-ink">{formatEUR(realized)}</strong>
      </div>
    </div>
  );
}

function Toast({ type }: { type?: string }) {
  if (!type) return null;
  const messages: Record<string, { text: string; tone: "success" | "danger" }> = {
    saved:        { text: "Orçamento guardado.", tone: "success" },
    copied:       { text: "Orçamento copiado do mês anterior.", tone: "success" },
    applied_all:  { text: "Orçamento aplicado a todos os meses do ano.", tone: "success" },
    cleared:      { text: "Orçamento do mês apagado.", tone: "success" },
    no_previous:  { text: "Mês anterior não tem orçamento definido.", tone: "danger" },
    no_current:   { text: "Define primeiro o orçamento do mês atual.", tone: "danger" },
    invalid_period: { text: "Período inválido.", tone: "danger" },
  };
  const m = messages[type];
  if (!m) return null;
  const cls = m.tone === "success"
    ? "border-success/30 bg-success-bg text-success"
    : "border-danger/30 bg-danger-bg text-danger";
  return <div className={`mb-4 rounded-md border ${cls} px-4 py-2.5 text-sm font-medium`}>{m.text}</div>;
}
