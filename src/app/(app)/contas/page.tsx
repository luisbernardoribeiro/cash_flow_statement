import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { accounts, transactions } from "@/lib/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import { formatEUR } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { createAccount, deleteAccount, updateAccount } from "./actions";

export const metadata = { title: "Contas" };

type SearchParams = Promise<{ ok?: string; error?: string; edit?: string }>;

export default async function ContasPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireActiveOrg();
  const params = await searchParams;

  const rows = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      type: accounts.type,
      openingBalance: accounts.openingBalance,
      archived: accounts.archived,
      entradas: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'entrada' THEN ${transactions.amount} ELSE 0 END), 0)`,
      saidas:   sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'saida'   THEN ${transactions.amount} ELSE 0 END), 0)`,
      usage:    sql<number>`COUNT(${transactions.id})::int`,
    })
    .from(accounts)
    .leftJoin(transactions, and(
      eq(transactions.accountId, accounts.id),
      eq(transactions.orgId, ctx.orgId),
    ))
    .where(eq(accounts.orgId, ctx.orgId))
    .groupBy(accounts.id)
    .orderBy(asc(accounts.type), asc(accounts.name));

  const editing = params.edit ? rows.find((r) => r.id === params.edit) : null;

  return (
    <div className="px-4 py-5 md:px-10 md:py-7">
      <PageHeader
        title="Contas / Caixas"
        breadcrumb={[{ label: "Início", href: "/dashboard" }, { label: "Contas" }]}
        sub={`${rows.length} contas · onde o dinheiro entra e sai (caixa, TPA, banco)`}
      />

      <Toast type={params.ok || params.error} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-[#15151E]">
          {/* Mobile: cards */}
          <ul className="divide-y divide-white/10 md:hidden">
            {rows.map((a) => {
              const opening = Number(a.openingBalance);
              const saldo = opening + Number(a.entradas) - Number(a.saidas);
              return (
                <li key={a.id} className="px-4 py-3 hover:bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{a.name}</span>
                        <span className="inline-block rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/85 capitalize">
                          {a.type}
                        </span>
                        {a.archived && (
                          <span className="text-[10px] uppercase tracking-wider text-white/40">(arquivada)</span>
                        )}
                      </div>
                      <div className="mt-1 flex items-baseline gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-white/60">Saldo atual</div>
                          <div className={`text-lg font-bold tabular-nums ${saldo < 0 ? "text-rose-400" : "text-white"}`}>
                            {formatEUR(saldo)}
                          </div>
                        </div>
                        <div className="text-xs text-white/60">
                          Inicial {formatEUR(opening)} · {a.usage} mov{a.usage === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2 text-xs">
                      <a href={`/contas?edit=${a.id}`} className="font-semibold text-gold-500 hover:text-gold-400 hover:underline">Editar</a>
                      <form action={deleteAccount}>
                        <input type="hidden" name="id" value={a.id} />
                        <button type="submit" className="font-semibold text-rose-400 hover:underline">Apagar</button>
                      </form>
                    </div>
                  </div>
                </li>
              );
            })}
            {rows.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-white/60">Sem contas.</li>
            )}
          </ul>

          {/* Desktop: tabela */}
          <table className="hidden w-full text-sm md:table">
            <thead className="bg-white/5">
              <tr>
                <Th>Conta</Th><Th>Tipo</Th>
                <Th align="right">Saldo Inicial</Th>
                <Th align="right">Saldo Atual</Th>
                <Th align="right">Movs</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const opening = Number(a.openingBalance);
                const saldo = opening + Number(a.entradas) - Number(a.saidas);
                return (
                  <tr key={a.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-4 py-3 font-medium">
                      {a.name}
                      {a.archived && <span className="ml-2 text-[10px] uppercase tracking-wider text-white/40">(arquivada)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-white/85 capitalize">
                        {a.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-white/60">{formatEUR(opening)}</td>
                    <td className={`px-4 py-3 text-right font-bold tabular-nums ${saldo < 0 ? "text-rose-400" : "text-white"}`}>
                      {formatEUR(saldo)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{a.usage}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <a href={`/contas?edit=${a.id}`} className="text-xs font-semibold text-gold-500 hover:text-gold-400 hover:underline">Editar</a>
                        <form action={deleteAccount}>
                          <input type="hidden" name="id" value={a.id} />
                          <button type="submit" className="text-xs font-semibold text-rose-400 hover:underline">Apagar</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-white/60">Sem contas.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#15151E] p-6 h-fit">
          <h3 className="mb-4 text-base font-bold">
            {editing ? "Editar conta" : "+ Nova conta"}
          </h3>
          <form action={editing ? updateAccount : createAccount} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Field label="Nome" required>
              <input name="name" type="text" required maxLength={120} defaultValue={editing?.name ?? ""}
                placeholder="Ex.: Banco BPI - Geral"
                className="w-full rounded-md border border-white/10 bg-[#15151E] px-3 py-2 text-sm focus:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-500/20" />
            </Field>
            <Field label="Tipo" required>
              <select name="type" required defaultValue={editing?.type ?? "banco"}
                className="w-full rounded-md border border-white/10 bg-[#15151E] px-3 py-2 text-sm">
                <option value="caixa">Caixa (dinheiro físico)</option>
                <option value="tpa">TPA (terminal de pagamento)</option>
                <option value="banco">Banco</option>
              </select>
            </Field>
            <Field label="Saldo Inicial (€)">
              <input name="openingBalance" type="text" inputMode="decimal" pattern="[0-9.,\-]*"
                defaultValue={editing ? Number(editing.openingBalance).toFixed(2).replace(".", ",") : "0,00"}
                placeholder="0,00"
                className="w-full rounded-md border border-white/10 bg-[#15151E] px-3 py-2 text-sm focus:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-500/20" />
              <p className="mt-1 text-[11px] text-white/60">Quanto havia na conta quando começaste a usar a app.</p>
            </Field>
            <div className="flex justify-between gap-2 pt-2">
              {editing && <a href="/contas" className="btn btn-ghost text-sm">Cancelar</a>}
              <button type="submit" className="btn btn-primary ml-auto text-sm">{editing ? "Guardar" : "Criar →"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Th({ children, align }: { children?: React.ReactNode; align?: "right" }) {
  return <th className={`px-4 py-3 text-${align ?? "left"} text-xs font-bold uppercase tracking-wider text-white/60`}>{children}</th>;
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/60">{label} {required && <span className="text-rose-400">*</span>}</label>
      {children}
    </div>
  );
}
function Toast({ type }: { type?: string }) {
  if (!type) return null;
  const messages: Record<string, { text: string; tone: "success" | "danger" }> = {
    created:  { text: "Conta criada.", tone: "success" },
    updated:  { text: "Conta atualizada.", tone: "success" },
    deleted:  { text: "Conta apagada.", tone: "success" },
    archived: { text: "Conta tem movimentos — foi arquivada em vez de apagada.", tone: "danger" },
    invalid:  { text: "Dados inválidos.", tone: "danger" },
  };
  const m = messages[type];
  if (!m) return null;
  const cls = m.tone === "success" ? "border-success/30 bg-emerald-500/15 text-emerald-400" : "border-danger/30 bg-rose-500/15 text-rose-400";
  return <div className={`mb-4 rounded-md border ${cls} px-4 py-2.5 text-sm font-medium`}>{m.text}</div>;
}
