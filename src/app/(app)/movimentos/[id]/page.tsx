import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { transactions, categories, accounts, suppliers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { formatEUR, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { deleteTransaction } from "../actions";

export const metadata = { title: "Detalhe do Movimento" };

export default async function MovimentoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireActiveOrg();
  const { id } = await params;

  const [row] = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      type: transactions.type,
      description: transactions.description,
      amount: transactions.amount,
      notes: transactions.notes,
      categoryName: categories.name,
      supplierName: suppliers.name,
      accountName: accounts.name,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(suppliers, eq(transactions.supplierId, suppliers.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(and(eq(transactions.id, id), eq(transactions.orgId, ctx.orgId)))
    .limit(1);

  if (!row) notFound();

  const isIn = row.type === "entrada";
  const amount = Number(row.amount);

  return (
    <div className="px-10 py-7">
      <PageHeader
        title="Detalhe do Movimento"
        breadcrumb={[
          { label: "Início", href: "/dashboard" },
          { label: "Movimentos", href: "/movimentos" },
          { label: row.description.slice(0, 40) },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-[#D5D8DC] bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                isIn ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
              }`}>
                {isIn ? "Entrada" : "Saída"}
              </span>
              <h2 className="mt-3 text-2xl font-bold">{row.description}</h2>
              <p className="mt-1 text-sm text-[#4A4A5C]">{formatDate(row.date)}</p>
            </div>
            <div className={`text-3xl font-extrabold tabular-nums ${isIn ? "text-success" : "text-danger"}`}>
              {isIn ? "+ " : "- "}{formatEUR(amount)}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4 border-t border-[#D5D8DC] pt-5">
            <Field label="Categoria">{row.categoryName ?? "—"}</Field>
            <Field label="Fornecedor / Cliente">{row.supplierName ?? "—"}</Field>
            <Field label="Conta">{row.accountName ?? "—"}</Field>
            <Field label="Registado a">{row.createdAt ? formatDate(row.createdAt) : "—"}</Field>
          </dl>

          {row.notes && (
            <div className="mt-5 border-t border-[#D5D8DC] pt-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#4A4A5C] mb-2">Notas</div>
              <p className="whitespace-pre-line text-sm">{row.notes}</p>
            </div>
          )}

          <div className="mt-7 flex justify-between gap-3 border-t border-[#D5D8DC] pt-5">
            <Link href="/movimentos" className="btn btn-ghost">← Voltar</Link>
            <form action={deleteTransaction}>
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                className="rounded-md border border-danger/30 bg-danger-bg px-5 py-2.5 text-sm font-semibold text-danger hover:bg-danger hover:text-white transition-colors"
              >
                Apagar movimento
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-2xl border border-primary-200 bg-primary-50/40 p-6">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary-700">Identificação</h3>
          <p className="font-mono text-xs text-[#4A4A5C] break-all">{row.id}</p>
          <p className="mt-4 text-xs text-[#4A4A5C]">
            ID único deste movimento. Útil para suporte ou auditoria.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-[#4A4A5C]">{label}</dt>
      <dd className="mt-1 text-base">{children}</dd>
    </div>
  );
}
