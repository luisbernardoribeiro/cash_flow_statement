import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { categories, suppliers, accounts } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { MovimentoForm } from "@/components/movimento-form";
import { createTransaction } from "../actions";

export const metadata = { title: "Novo Movimento" };

type SearchParams = Promise<{ error?: string; tipo?: string }>;

export default async function NovoMovimentoPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireActiveOrg();
  const params = await searchParams;

  const [cats, sups, accs] = await Promise.all([
    db.select({ id: categories.id, name: categories.name, type: categories.type })
      .from(categories).where(eq(categories.orgId, ctx.orgId)).orderBy(asc(categories.name)),
    db.select({ id: suppliers.id, name: suppliers.name })
      .from(suppliers).where(eq(suppliers.orgId, ctx.orgId)).orderBy(asc(suppliers.name)),
    db.select({ id: accounts.id, name: accounts.name, type: accounts.type })
      .from(accounts).where(eq(accounts.orgId, ctx.orgId)).orderBy(asc(accounts.name)),
  ]);

  const initialType = params.tipo === "entrada" || params.tipo === "saida" ? params.tipo : "entrada";

  return (
    <div className="px-4 py-5 md:px-10 md:py-7">
      <PageHeader
        title="Novo Movimento"
        breadcrumb={[
          { label: "Início", href: "/dashboard" },
          { label: "Movimentos", href: "/movimentos" },
          { label: "Novo" },
        ]}
      />

      <MovimentoForm
        action={createTransaction}
        defaults={{ type: initialType }}
        cats={cats}
        sups={sups}
        accs={accs}
        cancelHref="/movimentos"
        submitLabel="Guardar movimento →"
        errorCode={params.error}
      />
    </div>
  );
}
