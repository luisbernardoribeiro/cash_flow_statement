import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { suppliers, transactions } from "@/lib/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { createSupplier, deleteSupplier, updateSupplier } from "./actions";

export const metadata = { title: "Fornecedores" };

type SearchParams = Promise<{ ok?: string; error?: string; edit?: string }>;

export default async function FornecedoresPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireActiveOrg();
  const params = await searchParams;

  const rows = await db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      nif: suppliers.nif,
      email: suppliers.email,
      usage: sql<number>`COUNT(${transactions.id})::int`,
    })
    .from(suppliers)
    .leftJoin(transactions, and(
      eq(transactions.supplierId, suppliers.id),
      eq(transactions.orgId, ctx.orgId),
    ))
    .where(eq(suppliers.orgId, ctx.orgId))
    .groupBy(suppliers.id)
    .orderBy(asc(suppliers.name));

  const editing = params.edit ? rows.find((r) => r.id === params.edit) : null;

  return (
    <div className="px-10 py-7">
      <PageHeader
        title="Fornecedores"
        breadcrumb={[{ label: "Início", href: "/dashboard" }, { label: "Fornecedores" }]}
        sub={`${rows.length} fornecedores · clientes/parceiros associados aos movimentos`}
      />

      <Toast type={params.ok || params.error} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-lg border border-[#D5D8DC] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-primary-50/60">
              <tr><Th>Nome</Th><Th>NIF</Th><Th>Email</Th><Th align="right">Movimentos</Th><Th /></tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t border-[#D5D8DC] hover:bg-primary-50/30">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-[#4A4A5C] tabular-nums">{s.nif ?? "—"}</td>
                  <td className="px-4 py-3 text-[#4A4A5C]">{s.email ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{s.usage}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <a href={`/fornecedores?edit=${s.id}`} className="text-xs font-semibold text-primary-600 hover:underline">Editar</a>
                      <form action={deleteSupplier}>
                        <input type="hidden" name="id" value={s.id} />
                        <button type="submit" className="text-xs font-semibold text-danger hover:underline">Apagar</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#4A4A5C]">Sem fornecedores.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-[#D5D8DC] bg-white p-6 h-fit">
          <h3 className="mb-4 text-base font-bold">
            {editing ? "Editar fornecedor" : "+ Novo fornecedor"}
          </h3>
          <form action={editing ? updateSupplier : createSupplier} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Field label="Nome" required>
              <input name="name" type="text" required maxLength={120} defaultValue={editing?.name ?? ""}
                placeholder="Ex.: Recheio"
                className="w-full rounded-md border border-[#D5D8DC] bg-white px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </Field>
            <Field label="NIF">
              <input name="nif" type="text" inputMode="numeric" pattern="[0-9]{9}" maxLength={9}
                defaultValue={editing?.nif ?? ""} placeholder="500000000"
                className="w-full rounded-md border border-[#D5D8DC] bg-white px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </Field>
            <Field label="Email">
              <input name="email" type="email" defaultValue={editing?.email ?? ""}
                placeholder="contacto@empresa.pt"
                className="w-full rounded-md border border-[#D5D8DC] bg-white px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </Field>
            <div className="flex justify-between gap-2 pt-2">
              {editing && <a href="/fornecedores" className="btn btn-ghost text-sm">Cancelar</a>}
              <button type="submit" className="btn btn-primary ml-auto text-sm">{editing ? "Guardar" : "Criar →"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Th({ children, align }: { children?: React.ReactNode; align?: "right" }) {
  return <th className={`px-4 py-3 text-${align ?? "left"} text-xs font-bold uppercase tracking-wider text-[#4A4A5C]`}>{children}</th>;
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4A4A5C]">{label} {required && <span className="text-danger">*</span>}</label>
      {children}
    </div>
  );
}
function Toast({ type }: { type?: string }) {
  if (!type) return null;
  const messages: Record<string, { text: string; tone: "success" | "danger" }> = {
    created: { text: "Fornecedor criado.", tone: "success" },
    updated: { text: "Fornecedor atualizado.", tone: "success" },
    deleted: { text: "Fornecedor apagado.", tone: "success" },
    invalid: { text: "Dados inválidos.", tone: "danger" },
  };
  const m = messages[type];
  if (!m) return null;
  const cls = m.tone === "success" ? "border-success/30 bg-success-bg text-success" : "border-danger/30 bg-danger-bg text-danger";
  return <div className={`mb-4 rounded-md border ${cls} px-4 py-2.5 text-sm font-medium`}>{m.text}</div>;
}
