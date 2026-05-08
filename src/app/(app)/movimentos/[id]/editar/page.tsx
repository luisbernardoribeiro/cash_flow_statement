import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { transactions, categories, suppliers, accounts } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { updateTransaction } from "../../actions";

export const metadata = { title: "Editar Movimento" };

type PageParams = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string }>;

export default async function EditarMovimentoPage({
  params, searchParams,
}: { params: PageParams; searchParams: SearchParams }) {
  const ctx = await requireActiveOrg();
  const { id } = await params;
  const { error } = await searchParams;

  const [row] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.orgId, ctx.orgId)))
    .limit(1);

  if (!row) notFound();

  const [cats, sups, accs] = await Promise.all([
    db.select({ id: categories.id, name: categories.name, type: categories.type })
      .from(categories).where(eq(categories.orgId, ctx.orgId)).orderBy(asc(categories.name)),
    db.select({ id: suppliers.id, name: suppliers.name })
      .from(suppliers).where(eq(suppliers.orgId, ctx.orgId)).orderBy(asc(suppliers.name)),
    db.select({ id: accounts.id, name: accounts.name, type: accounts.type })
      .from(accounts).where(eq(accounts.orgId, ctx.orgId)).orderBy(asc(accounts.name)),
  ]);

  const amountStr = Number(row.amount).toFixed(2).replace(".", ",");

  return (
    <div className="px-4 py-5 md:px-10 md:py-7">
      <PageHeader
        title="Editar Movimento"
        breadcrumb={[
          { label: "Início", href: "/dashboard" },
          { label: "Movimentos", href: "/movimentos" },
          { label: row.description.slice(0, 40), href: `/movimentos/${id}` },
          { label: "Editar" },
        ]}
      />

      <form action={updateTransaction} className="max-w-2xl space-y-5 rounded-2xl border border-[#D5D8DC] bg-white p-7 shadow-sm">
        <input type="hidden" name="id" value={row.id} />

        {error === "invalid" && (
          <div className="rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
            Verifica os campos — alguns dados são inválidos.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Data" required>
            <input name="date" type="date" required defaultValue={row.date}
              className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-2.5 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          </Field>
          <Field label="Tipo" required>
            <select name="type" required defaultValue={row.type}
              className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-2.5 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20">
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </Field>
        </div>

        <Field label="Descrição" required>
          <input name="description" type="text" required maxLength={500} defaultValue={row.description}
            className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-2.5 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
        </Field>

        <Field label="Valor (€)" required>
          <input name="amount" type="text" required inputMode="decimal" pattern="[0-9.,]*" defaultValue={amountStr}
            className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-2.5 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Categoria">
            <select name="categoryId" defaultValue={row.categoryId ?? ""}
              className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-2.5 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20">
              <option value="">— sem categoria —</option>
              <optgroup label="Entradas">
                {cats.filter(c => c.type === "entrada").map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
              <optgroup label="Saídas">
                {cats.filter(c => c.type === "saida").map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            </select>
          </Field>
          <Field label="Fornecedor / Cliente">
            <select name="supplierId" defaultValue={row.supplierId ?? ""}
              className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-2.5 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20">
              <option value="">— sem fornecedor —</option>
              {sups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Conta" required>
          <select name="accountId" required defaultValue={row.accountId}
            className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-2.5 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20">
            {accs.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
            ))}
          </select>
        </Field>

        <Field label="Notas">
          <textarea name="notes" rows={3} maxLength={1000} defaultValue={row.notes ?? ""}
            className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-2.5 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
        </Field>

        <div className="flex justify-between gap-3 border-t border-[#D5D8DC] pt-5">
          <Link href={`/movimentos/${id}`} className="btn btn-ghost">Cancelar</Link>
          <button type="submit" className="btn btn-primary">Guardar alterações →</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#4A4A5C]">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
    </div>
  );
}
