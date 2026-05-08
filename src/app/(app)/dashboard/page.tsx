import Link from "next/link";
import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { transactions, categories, accounts } from "@/lib/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { formatEUR, formatDate } from "@/lib/utils";
import { MonthlyBarChart, type MonthBar } from "@/components/monthly-chart";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await requireActiveOrg();

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString().slice(0, 10);

  const [monthAgg] = await db
    .select({
      entradas: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'entrada' THEN ${transactions.amount} ELSE 0 END), 0)`,
      saidas:   sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'saida'   THEN ${transactions.amount} ELSE 0 END), 0)`,
      total:    sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.orgId, ctx.orgId),
        gte(transactions.date, monthStart)
      )
    );

  const [allTimeAgg] = await db
    .select({
      entradas: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'entrada' THEN ${transactions.amount} ELSE 0 END), 0)`,
      saidas:   sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'saida'   THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.orgId, ctx.orgId));

  const entradasMes = Number(monthAgg.entradas);
  const saidasMes   = Number(monthAgg.saidas);
  const liquidoMes  = entradasMes - saidasMes;
  const saldoTotal  = Number(allTimeAgg.entradas) - Number(allTimeAgg.saidas);
  const movsMes     = Number(monthAgg.total);

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

  const monthlyData: MonthBar[] = buildMonthlySeries(monthlyRows, windowStart);

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

  return (
    <div className="px-10 py-7">
      <div className="mb-7 flex items-start justify-between">
        <div>
          <p className="text-sm text-[#4A4A5C]">
            Início <span className="mx-2">/</span>
            <strong className="text-ink">Dashboard</strong>
          </p>
        </div>
        <a href="/movimentos/novo" className="btn btn-primary">+ Novo Movimento</a>
      </div>

      <h1 className="text-3xl font-bold">{greeting}.</h1>
      <p className="mt-1 text-[#4A4A5C]">
        Vista geral · {ctx.orgName} · <span className="capitalize">{monthName}</span>
      </p>

      <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Entradas (Mês)"         value={formatEUR(entradasMes)} tone="success" />
        <KpiCard label="Saídas (Mês)"           value={formatEUR(saidasMes)}   tone="danger" />
        <KpiCard label="Saldo Líquido (Mês)"    value={formatEUR(liquidoMes)}  tone="primary" />
        <KpiCard label="Saldo Total (Sempre)"   value={formatEUR(saldoTotal)}  tone="gold" />
      </div>

      {recent.length === 0 && <EmptyState />}

      {recent.length > 0 && monthlyData.some((m) => m.entradas > 0 || m.saidas > 0) && (
        <div className="mt-7 rounded-lg border border-[#D5D8DC] bg-white p-5">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold">Entradas vs Saídas</h3>
              <p className="text-xs text-[#4A4A5C]">Últimos 12 meses</p>
            </div>
          </div>
          <MonthlyBarChart data={monthlyData} />
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-7 rounded-lg border border-[#D5D8DC] bg-white">
          <div className="flex items-center justify-between border-b border-[#D5D8DC] px-5 py-3.5">
            <div>
              <h3 className="text-base font-bold">Últimos movimentos</h3>
              <p className="text-xs text-[#4A4A5C]">{recent.length} mais recentes</p>
            </div>
            <Link href="/movimentos" className="text-sm font-semibold text-primary-600 hover:underline">
              Ver tudo →
            </Link>
          </div>
          <table className="w-full text-sm">
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

      <p className="mt-12 text-center text-xs text-[#4A4A5C]">
        ✓ Aprovado por Contabilista Certificado · Alípio Monteiro · CC nº 32897
      </p>
    </div>
  );
}

function greetingForHour(h: number) {
  if (h < 12) return "Bom dia";
  if (h < 19) return "Boa tarde";
  return "Boa noite";
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

function KpiCard({
  label, value, tone,
}: {
  label: string;
  value: string;
  tone: "success" | "danger" | "primary" | "gold";
}) {
  const color =
    tone === "success" ? "text-success" :
    tone === "danger"  ? "text-danger"  :
    tone === "gold"    ? "text-gold-600" :
                         "text-primary-600";
  return (
    <div className="rounded-lg border border-[#D5D8DC] bg-white p-5 transition-shadow hover:shadow-md">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#4A4A5C]">{label}</div>
      <div className={`mt-1.5 text-3xl font-extrabold tracking-tight ${color}`}>{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 rounded-2xl border-2 border-dashed border-primary-200 bg-white p-10 text-center">
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
