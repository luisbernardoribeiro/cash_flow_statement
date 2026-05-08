import Link from "next/link";
import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { transactions, categories, accounts } from "@/lib/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { ArrowDownToLine, ArrowUpFromLine, Wallet } from "lucide-react";
import { formatEUR, formatDate } from "@/lib/utils";
import { MonthlyBarChart, type MonthBar } from "@/components/monthly-chart";
import { HeroBalance } from "@/components/dashboard/hero-balance";
import { KpiCard, type KpiDelta } from "@/components/dashboard/kpi-card";
import { FooterCredentials } from "@/components/dashboard/footer-credentials";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await requireActiveOrg();

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString().slice(0, 10);
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    .toISOString().slice(0, 10);

  // Agregação unificada N + N-1 numa só query (FILTER WHERE — Postgres 9.4+)
  const [agg] = await db
    .select({
      entradasN: sql<string>`COALESCE(SUM(${transactions.amount}) FILTER (WHERE ${transactions.type} = 'entrada' AND ${transactions.date} >= ${monthStart}), 0)`,
      saidasN:   sql<string>`COALESCE(SUM(${transactions.amount}) FILTER (WHERE ${transactions.type} = 'saida'   AND ${transactions.date} >= ${monthStart}), 0)`,
      movsN:     sql<number>`COUNT(*) FILTER (WHERE ${transactions.date} >= ${monthStart})`,
      entradasPrev: sql<string>`COALESCE(SUM(${transactions.amount}) FILTER (WHERE ${transactions.type} = 'entrada' AND ${transactions.date} >= ${prevMonthStart} AND ${transactions.date} < ${monthStart}), 0)`,
      saidasPrev:   sql<string>`COALESCE(SUM(${transactions.amount}) FILTER (WHERE ${transactions.type} = 'saida'   AND ${transactions.date} >= ${prevMonthStart} AND ${transactions.date} < ${monthStart}), 0)`,
      movsPrev:     sql<number>`COUNT(*) FILTER (WHERE ${transactions.date} >= ${prevMonthStart} AND ${transactions.date} < ${monthStart})`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.orgId, ctx.orgId),
        gte(transactions.date, prevMonthStart),
      ),
    );

  const [allTimeAgg] = await db
    .select({
      entradas: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'entrada' THEN ${transactions.amount} ELSE 0 END), 0)`,
      saidas:   sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'saida'   THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.orgId, ctx.orgId));

  const entradasMes = Number(agg.entradasN);
  const saidasMes   = Number(agg.saidasN);
  const liquidoMes  = entradasMes - saidasMes;
  const movsMes     = Number(agg.movsN);

  const entradasPrev = Number(agg.entradasPrev);
  const saidasPrev   = Number(agg.saidasPrev);
  const liquidoPrev  = entradasPrev - saidasPrev;
  const prevHasData  = Number(agg.movsPrev) > 0;

  const saldoTotal  = Number(allTimeAgg.entradas) - Number(allTimeAgg.saidas);

  // Janela dos últimos 12 meses, ancorada na data do movimento mais recente
  // (evita gráfico vazio quando os dados não são do mês atual)
  const [latestMov] = await db
    .select({ d: sql<string>`MAX(${transactions.date})` })
    .from(transactions)
    .where(eq(transactions.orgId, ctx.orgId));

  const anchor = latestMov?.d ? new Date(latestMov.d) : new Date();
  const windowStart = new Date(anchor.getFullYear(), anchor.getMonth() - 11, 1);
  const windowStartStr = `${windowStart.getFullYear()}-${String(windowStart.getMonth() + 1).padStart(2, "0")}-01`;

  const monthlyRows = await db
    .select({
      ym:       sql<string>`TO_CHAR(${transactions.date}, 'YYYY-MM')`,
      entradas: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'entrada' THEN ${transactions.amount} ELSE 0 END), 0)`,
      saidas:   sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'saida'   THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(and(eq(transactions.orgId, ctx.orgId), gte(transactions.date, windowStartStr)))
    .groupBy(sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`);

  const monthlyDataFull = buildMonthlySeries(monthlyRows, windowStart);
  const monthlyData = trimToDataWindow(monthlyDataFull, 4);

  // Últimos movimentos (independente de data)
  const recent = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      type: transactions.type,
      description: transactions.description,
      amount: transactions.amount,
      categoryName: categories.name,
      accountName: accounts.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(eq(transactions.orgId, ctx.orgId))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(8);

  const monthName = today.toLocaleString("pt-PT", { month: "long", year: "numeric" });
  const greeting = greetingForHour(today.getHours());

  const isEmptyMonth = movsMes === 0;
  const deltaEntradas = computeDelta(entradasMes, entradasPrev, prevHasData);
  const deltaSaidas   = computeDelta(saidasMes,   saidasPrev,   prevHasData);
  const deltaLiquido  = computeDelta(liquidoMes,  liquidoPrev,  prevHasData);

  // Saldo no início do mês = saldo total - líquido deste mês.
  // Mostramos a variação % do saldo total face a esse ponto, como fração para NumberFlow ("percent").
  const saldoInicioMes = saldoTotal - liquidoMes;
  const saldoDeltaPct =
    saldoInicioMes !== 0 && movsMes > 0
      ? liquidoMes / Math.abs(saldoInicioMes)
      : null;

  const hasAnyChartData = monthlyData.some((m) => m.entradas > 0 || m.saidas > 0);

  return (
    <div className="px-4 py-5 md:px-10 md:py-7">
      <div className="mb-5 flex items-start justify-between gap-3">
        <p className="text-sm text-[#4A4A5C]">
          Início <span className="mx-2">/</span>
          <strong className="text-ink">Dashboard</strong>
        </p>
        <a href="/movimentos/novo" className="btn btn-primary">+ Novo Movimento</a>
      </div>

      <HeroBalance
        value={saldoTotal}
        isNegative={saldoTotal < 0}
        deltaPct={saldoDeltaPct}
        greeting={greeting}
        orgName={ctx.orgName}
        monthName={monthName}
      />

      {/* Divider dourado entre hero e KPIs mensais */}
      <div
        aria-hidden="true"
        className="my-6 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent md:my-8"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Entradas (Mês)"
          value={formatEUR(entradasMes)}
          tone="success"
          icon={ArrowDownToLine}
          delta={deltaEntradas}
          isEmpty={isEmptyMonth}
          goodWhenUp={true}
        />
        <KpiCard
          label="Saídas (Mês)"
          value={formatEUR(saidasMes)}
          tone="danger"
          icon={ArrowUpFromLine}
          delta={deltaSaidas}
          isEmpty={isEmptyMonth}
          goodWhenUp={false}
        />
        <KpiCard
          label="Saldo Líquido (Mês)"
          value={formatEUR(liquidoMes)}
          tone="primary"
          icon={Wallet}
          delta={deltaLiquido}
          isEmpty={isEmptyMonth}
          goodWhenUp={true}
        />
      </div>

      {recent.length === 0 && <EmptyState />}

      {recent.length > 0 && hasAnyChartData && (
        <div className="mt-7 rounded-lg border border-[#D5D8DC] bg-white p-5 md:mt-8">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold">Entradas vs Saídas</h3>
              <p className="text-xs text-[#4A4A5C]">
                {monthlyData.length === 12 ? "Últimos 12 meses" : `Últimos ${monthlyData.length} meses com dados`}
              </p>
            </div>
          </div>
          <MonthlyBarChart data={monthlyData} />
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-7 rounded-lg border border-[#D5D8DC] bg-white md:mt-8">
          <div className="flex items-center justify-between border-b border-[#D5D8DC] px-5 py-3.5">
            <div>
              <h3 className="text-base font-bold">Últimos movimentos</h3>
              <p className="text-xs text-[#4A4A5C]">{recent.length} mais recentes</p>
            </div>
            <Link href="/movimentos" className="text-sm font-semibold text-primary-600 hover:underline">
              Ver tudo →
            </Link>
          </div>
          {/* Mobile: cards */}
          <ul className="divide-y divide-[#D5D8DC] md:hidden">
            {recent.map((r) => {
              const isIn = r.type === "entrada";
              return (
                <li key={r.id}>
                  <Link href={`/movimentos/${r.id}`} className="block px-4 py-3 hover:bg-primary-50/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isIn ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
                          }`}>
                            {isIn ? "Entrada" : "Saída"}
                          </span>
                          <span className="text-xs text-[#4A4A5C] whitespace-nowrap">{formatDate(r.date)}</span>
                        </div>
                        <div className="mt-1 line-clamp-2 font-medium leading-snug">{r.description}</div>
                        <div className="mt-0.5 truncate text-xs text-[#4A4A5C]">
                          {r.categoryName ?? "—"}{r.accountName && <> · {r.accountName}</>}
                        </div>
                      </div>
                      <div className={`shrink-0 text-right font-bold tabular-nums whitespace-nowrap ${
                        isIn ? "text-success" : "text-danger"
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
            <thead className="bg-primary-50/40">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[#4A4A5C]">Data</th>
                <th className="px-5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[#4A4A5C]">Tipo</th>
                <th className="px-5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[#4A4A5C]">Descrição</th>
                <th className="px-5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[#4A4A5C]">Categoria</th>
                <th className="px-5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[#4A4A5C]">Conta</th>
                <th className="px-5 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-[#4A4A5C]">Valor</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => {
                const isIn = r.type === "entrada";
                return (
                  <tr key={r.id} className="border-t border-[#D5D8DC] hover:bg-primary-50/20">
                    <td className="px-5 py-3 whitespace-nowrap">{formatDate(r.date)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        isIn ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
                      }`}>
                        {isIn ? "Entrada" : "Saída"}
                      </span>
                    </td>
                    <td className="px-5 py-3">{r.description}</td>
                    <td className="px-5 py-3 text-[#4A4A5C]">{r.categoryName ?? "—"}</td>
                    <td className="px-5 py-3 text-[#4A4A5C]">{r.accountName ?? "—"}</td>
                    <td className={`px-5 py-3 text-right font-bold tabular-nums whitespace-nowrap ${
                      isIn ? "text-success" : "text-danger"
                    }`}>
                      {isIn ? "+ " : "- "}{formatEUR(Number(r.amount))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <FooterCredentials />
    </div>
  );
}

function greetingForHour(h: number) {
  if (h < 12) return "Bom dia";
  if (h < 19) return "Boa tarde";
  return "Boa noite";
}

function computeDelta(curr: number, prev: number, prevHasData: boolean): KpiDelta {
  if (!prevHasData) return { kind: "first-month" };
  if (curr === 0 && prev === 0) return { kind: "none" };
  if (prev === 0) return { kind: "new" };
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  return { kind: "pct", value: pct };
}

function buildMonthlySeries(
  rows: Array<{ ym: string; entradas: string; saidas: string }>,
  startMonth: Date,
): MonthBar[] {
  const map = new Map(rows.map((r) => [r.ym, r]));
  const result: MonthBar[] = [];
  const monthLabels = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const cursor = new Date(startMonth.getTime());
  for (let i = 0; i < 12; i++) {
    const ym = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const row = map.get(ym);
    result.push({
      month: `${monthLabels[cursor.getMonth()]}/${String(cursor.getFullYear()).slice(-2)}`,
      entradas: row ? Number(row.entradas) : 0,
      saidas:   row ? Number(row.saidas)   : 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
}

/**
 * Recorta a série para começar no primeiro mês com dados, mantendo
 * pelo menos `minMonths` visíveis. Se a série estiver toda vazia,
 * mantém os últimos `minMonths`.
 */
function trimToDataWindow(series: MonthBar[], minMonths: number): MonthBar[] {
  const firstWithData = series.findIndex((m) => m.entradas > 0 || m.saidas > 0);
  if (firstWithData === -1) return series.slice(-minMonths);
  const startIdx = Math.max(0, Math.min(firstWithData, series.length - minMonths));
  return series.slice(startIdx);
}

function EmptyState() {
  return (
    <div className="mt-8 rounded-2xl border-2 border-dashed border-primary-200 bg-white p-10 text-center md:mt-10">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-2xl">
        ✨
      </div>
      <h3 className="text-xl font-bold">Tudo pronto. Vamos lá começar?</h3>
      <p className="mx-auto mt-2 mb-5 max-w-md text-sm text-[#4A4A5C]">
        A tua app já vem com as 20 categorias e as 3 contas do método GI.
        Regista o primeiro movimento — uma venda, uma compra, uma despesa.
      </p>
      <a href="/movimentos/novo" className="btn btn-primary">+ Registar primeiro movimento</a>
    </div>
  );
}
