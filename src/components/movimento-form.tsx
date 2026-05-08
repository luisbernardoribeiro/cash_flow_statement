"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchableCombobox, type ComboOption } from "./searchable-combobox";
import { createCategoryInline } from "@/app/(app)/categorias/actions";
import { createSupplierInline } from "@/app/(app)/fornecedores/actions";

export type CatOption  = { id: string; name: string; type: "entrada" | "saida" };
export type SupOption  = { id: string; name: string };
export type AccOption  = { id: string; name: string; type: string };

export type MovimentoFormDefaults = {
  id?: string;
  date?: string;
  type?: "entrada" | "saida";
  description?: string;
  amount?: string;
  categoryId?: string | null;
  supplierId?: string | null;
  accountId?: string;
  notes?: string;
};

type Props = {
  /** Server action (createTransaction ou updateTransaction). */
  action: (formData: FormData) => void | Promise<void>;
  /** Defaults quando estamos a editar (ou pré-preencher). */
  defaults?: MovimentoFormDefaults;
  cats: CatOption[];
  sups: SupOption[];
  accs: AccOption[];
  /** URL para o botão Cancelar. */
  cancelHref: string;
  /** Texto do botão submit. */
  submitLabel?: string;
  /** Mostrar erro genérico vindo do server. */
  errorCode?: string;
};

export function MovimentoForm({
  action, defaults = {}, cats, sups, accs,
  cancelHref, submitLabel = "Guardar movimento →", errorCode,
}: Props) {
  const [type, setType] = useState<"entrada" | "saida">(defaults.type ?? "entrada");

  const catOptions: ComboOption[] = cats.map((c) => ({
    id: c.id,
    label: c.name,
    group: c.type === "entrada" ? "Entradas" : "Saídas",
  }));

  // Filtra categorias para mostrar primeiro as do tipo atual
  const catOptionsSorted: ComboOption[] = [
    ...catOptions.filter((o) => o.group === (type === "entrada" ? "Entradas" : "Saídas")),
    ...catOptions.filter((o) => o.group !== (type === "entrada" ? "Entradas" : "Saídas")),
  ];

  const supOptions: ComboOption[] = sups.map((s) => ({ id: s.id, label: s.name }));

  const handleCreateCategory = async (name: string) => {
    const result = await createCategoryInline({ name, type });
    return result; // { id, label, group } | null
  };

  const handleCreateSupplier = async (name: string) => {
    const result = await createSupplierInline({ name });
    return result; // { id, label } | null
  };

  return (
    <form action={action} className="max-w-2xl space-y-5 rounded-2xl border border-[#D5D8DC] bg-white p-5 shadow-sm md:p-7">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      {errorCode === "invalid" && (
        <div className="rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          Verifica os campos — alguns dados são inválidos.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Data" required>
          <input
            name="date" type="date" required
            defaultValue={defaults.date ?? new Date().toISOString().slice(0, 10)}
            className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-2.5 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </Field>
        <Field label="Tipo" required>
          <select
            name="type" required
            value={type}
            onChange={(e) => setType(e.target.value as "entrada" | "saida")}
            className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-2.5 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </Field>
      </div>

      <Field label="Descrição" required>
        <input
          name="description" type="text" required maxLength={500}
          defaultValue={defaults.description ?? ""}
          placeholder="Ex.: Vendas Diárias - Loja 1"
          className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-2.5 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        />
      </Field>

      <Field label="Valor (€)" required>
        <input
          name="amount" type="text" required inputMode="decimal" pattern="[0-9.,]*"
          defaultValue={defaults.amount ?? ""}
          placeholder="0,00"
          className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-2.5 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        />
        <p className="mt-1 text-xs text-[#4A4A5C]">Usa vírgula ou ponto como separador decimal.</p>
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Categoria">
          <SearchableCombobox
            name="categoryId"
            defaultValue={defaults.categoryId ?? ""}
            options={catOptionsSorted}
            placeholder={`Procurar categoria de ${type === "entrada" ? "entrada" : "saída"}…`}
            emptyLabel="— sem categoria —"
            createLabel="+ Nova categoria"
            onCreate={handleCreateCategory}
          />
          <p className="mt-1 text-xs text-[#4A4A5C]">
            Procura ou escreve uma nova — cria-se automaticamente como tipo &quot;{type}&quot;.
          </p>
        </Field>
        <Field label="Fornecedor / Cliente">
          <SearchableCombobox
            name="supplierId"
            defaultValue={defaults.supplierId ?? ""}
            options={supOptions}
            placeholder="Procurar fornecedor…"
            emptyLabel="— sem fornecedor —"
            createLabel="+ Novo fornecedor"
            onCreate={handleCreateSupplier}
          />
          <p className="mt-1 text-xs text-[#4A4A5C]">
            Procura ou escreve um novo — pode adicionar NIF/email depois em /fornecedores.
          </p>
        </Field>
      </div>

      <Field label="Conta" required>
        <select
          name="accountId" required
          defaultValue={defaults.accountId ?? accs[0]?.id ?? ""}
          className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-2.5 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        >
          {accs.map((a) => (
            <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
          ))}
        </select>
      </Field>

      <Field label="Notas">
        <textarea
          name="notes" rows={3} maxLength={1000}
          defaultValue={defaults.notes ?? ""}
          placeholder="Detalhes adicionais (opcional)"
          className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-2.5 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        />
      </Field>

      <div className="flex flex-wrap justify-between gap-3 border-t border-[#D5D8DC] pt-5">
        <Link href={cancelHref} className="btn btn-ghost">Cancelar</Link>
        <button type="submit" className="btn btn-primary">{submitLabel}</button>
      </div>
    </form>
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
