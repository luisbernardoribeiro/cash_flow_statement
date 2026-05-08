import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { categories, transactions } from "@/lib/db/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { createCategory, deleteCategory, updateCategory } from "./actions";

export const metadata = { title: "Categorias" };

type SearchParams = Promise<{ ok?: string; error?: string; edit?: string }>;

export default async function CategoriasPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireActiveOrg();
  const params = await searchParams;

  // Categorias + contagem de movimentos
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      type: categories.type,
      group: categories.group,
      archived: categories.archived,
      usage: sql<number>`COUNT(${transactions.id})::int`,
    })
    .from(categories)
    .leftJoin(transactions, and(
      eq(transactions.categoryId, categories.id),
      eq(transactions.orgId, ctx.orgId),
    ))
    .where(eq(categories.orgId, ctx.orgId))
    .groupBy(categories.id)
    .orderBy(asc(categories.type), asc(categories.group), asc(categories.name));

  const editing = params.edit ? rows.find((r) => r.id === params.edit) : null;

  return (
    <div className="px-4 py-5 md:px-10 md:py-7">
      <PageHeader
        title="Categorias"
        breadcrumb={[{ label: "Início", href: "/dashboard" }, { label: "Categorias" }]}
        sub={`${rows.length} categorias · usadas para classificar movimentos`}
      />

      <Toast type={params.ok || params.error} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-lg border border-[#D5D8DC] bg-white">
          {/* Mobile: lista de cards */}
          <ul className="divide-y divide-[#D5D8DC] md:hidden">
            {rows.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-primary-50/30">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.name}</span>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      c.type === "entrada" ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
                    }`}>
                      {c.type === "entrada" ? "Entrada" : "Saída"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-[#4A4A5C]">
                    {c.group ?? "Sem grupo"} · {c.usage} mov{c.usage === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 text-xs">
                  <a href={`/categorias?edit=${c.id}`} className="font-semibold text-primary-600 hover:underline">Editar</a>
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={c.id} />
                    <button type="submit" className="font-semibold text-danger hover:underline">Apagar</button>
                  </form>
                </div>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-[#4A4A5C]">Sem categorias.</li>
            )}
          </ul>

          {/* Desktop: tabela */}
          <table className="hidden w-full text-sm md:table">
            <thead className="bg-primary-50/60">
              <tr>
                <Th>Categoria</Th>
                <Th>Tipo</Th>
                <Th>Grupo</Th>
                <Th align="right">Movimentos</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-[#D5D8DC] hover:bg-primary-50/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      c.type === "entrada" ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
                    }`}>
                      {c.type === "entrada" ? "Entrada" : "Saída"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#4A4A5C]">{c.group ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.usage}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <a href={`/categorias?edit=${c.id}`} className="text-xs font-semibold text-primary-600 hover:underline">Editar</a>
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="text-xs font-semibold text-danger hover:underline">Apagar</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#4A4A5C]">Sem categorias.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-[#D5D8DC] bg-white p-6 h-fit">
          <h3 className="mb-4 text-base font-bold">
            {editing ? "Editar categoria" : "+ Nova categoria"}
          </h3>
          <form action={editing ? updateCategory : createCategory} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Field label="Nome" required>
              <input
                name="name" type="text" required maxLength={120}
                defaultValue={editing?.name ?? ""}
                placeholder="Ex.: Vendas Online"
                className="w-full rounded-md border border-[#D5D8DC] bg-white px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              />
            </Field>
            <Field label="Tipo" required>
              <select name="type" required defaultValue={editing?.type ?? "saida"}
                className="w-full rounded-md border border-[#D5D8DC] bg-white px-3 py-2 text-sm">
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </Field>
            <Field label="Grupo">
              <input
                name="group" type="text" maxLength={80}
                defaultValue={editing?.group ?? ""}
                placeholder="Ex.: Estrutura, Pessoal, Marketing"
                className="w-full rounded-md border border-[#D5D8DC] bg-white px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              />
            </Field>
            <div className="flex justify-between gap-2 pt-2">
              {editing && <a href="/categorias" className="btn btn-ghost text-sm">Cancelar</a>}
              <button type="submit" className="btn btn-primary ml-auto text-sm">
                {editing ? "Guardar" : "Criar →"}
              </button>
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
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4A4A5C]">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
    </div>
  );
}

function Toast({ type }: { type?: string }) {
  if (!type) return null;
  const messages: Record<string, { text: string; tone: "success" | "danger" }> = {
    created: { text: "Categoria criada com sucesso.", tone: "success" },
    updated: { text: "Categoria atualizada.",          tone: "success" },
    deleted: { text: "Categoria apagada.",             tone: "success" },
    invalid: { text: "Dados inválidos. Tenta de novo.", tone: "danger" },
  };
  const m = messages[type];
  if (!m) return null;
  const cls = m.tone === "success"
    ? "border-success/30 bg-success-bg text-success"
    : "border-danger/30 bg-danger-bg text-danger";
  return <div className={`mb-4 rounded-md border ${cls} px-4 py-2.5 text-sm font-medium`}>{m.text}</div>;
}
