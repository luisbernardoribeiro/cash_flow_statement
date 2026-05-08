"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { transactions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const createSchema = z.object({
  date: z.string().min(8),
  type: z.enum(["entrada", "saida"]),
  description: z.string().min(1).max(500),
  amount: z.string().refine((v) => Number(v.replace(",", ".")) > 0, "Valor tem de ser positivo"),
  categoryId: z.string().uuid().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  accountId: z.string().uuid(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function createTransaction(formData: FormData) {
  const ctx = await requireActiveOrg();

  const raw = {
    date: String(formData.get("date") ?? ""),
    type: String(formData.get("type") ?? ""),
    description: String(formData.get("description") ?? "").trim(),
    amount: String(formData.get("amount") ?? ""),
    categoryId: nullableUuid(formData.get("categoryId")),
    supplierId: nullableUuid(formData.get("supplierId")),
    accountId: String(formData.get("accountId") ?? ""),
    notes: nullableString(formData.get("notes")),
  };

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/movimentos/novo?error=invalid");
  }

  const amount = Number(parsed.data.amount.replace(",", "."));

  await db.insert(transactions).values({
    orgId: ctx.orgId,
    date: parsed.data.date,
    type: parsed.data.type,
    description: parsed.data.description,
    amount: String(amount),
    categoryId: parsed.data.categoryId,
    supplierId: parsed.data.supplierId,
    accountId: parsed.data.accountId,
    notes: parsed.data.notes,
    createdBy: ctx.userId,
  });

  revalidatePath("/movimentos");
  revalidatePath("/dashboard");
  redirect("/movimentos");
}

export async function updateTransaction(formData: FormData) {
  const ctx = await requireActiveOrg();
  const id = String(formData.get("id") ?? "");

  const raw = {
    date: String(formData.get("date") ?? ""),
    type: String(formData.get("type") ?? ""),
    description: String(formData.get("description") ?? "").trim(),
    amount: String(formData.get("amount") ?? ""),
    categoryId: nullableUuid(formData.get("categoryId")),
    supplierId: nullableUuid(formData.get("supplierId")),
    accountId: String(formData.get("accountId") ?? ""),
    notes: nullableString(formData.get("notes")),
  };

  const parsed = createSchema.safeParse(raw);
  if (!id || !parsed.success) {
    redirect(`/movimentos/${id}/editar?error=invalid`);
  }

  const amount = Number(parsed.data.amount.replace(",", "."));

  await db.update(transactions).set({
    date: parsed.data.date,
    type: parsed.data.type,
    description: parsed.data.description,
    amount: String(amount),
    categoryId: parsed.data.categoryId,
    supplierId: parsed.data.supplierId,
    accountId: parsed.data.accountId,
    notes: parsed.data.notes,
    updatedAt: new Date(),
  }).where(and(eq(transactions.id, id), eq(transactions.orgId, ctx.orgId)));

  revalidatePath("/movimentos");
  revalidatePath(`/movimentos/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/fluxo-mensal");
  redirect(`/movimentos/${id}?updated=1`);
}

export async function deleteTransaction(formData: FormData) {
  const ctx = await requireActiveOrg();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.orgId, ctx.orgId)));

  revalidatePath("/movimentos");
  revalidatePath("/dashboard");
  revalidatePath("/fluxo-mensal");
  redirect("/movimentos");
}

function nullableUuid(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length === 36 ? s : null;
}

function nullableString(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}
