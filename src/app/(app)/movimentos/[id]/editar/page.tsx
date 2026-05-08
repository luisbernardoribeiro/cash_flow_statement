import { notFound } from "next/navigation";
import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { transactions, categories, suppliers, accounts } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { MovimentoForm } from "@/components/movimento-form";
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

      <MovimentoForm
        action={updateTransaction}
        defaults={{
          id: row.id,
          date: row.date,
          type: row.type,
          description: row.description,
          amount: amountStr,
          categoryId: row.categoryId,
          supplierId: row.supplierId,
          accountId: row.accountId,
          notes: row.notes ?? "",
        }}
        cats={cats}
        sups={sups}
        accs={accs}
        cancelHref={`/movimentos/${id}`}
        submitLabel="Guardar alterações →"
        errorCode={error}
      />
    </div>
  );
}
