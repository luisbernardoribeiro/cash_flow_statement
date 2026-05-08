"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { accounts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const schema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(["caixa", "tpa", "banco"]),
  openingBalance: z.string().refine((v) => !isNaN(Number(v.replace(",", "."))), "Saldo inválido"),
});

export async function createAccount(formData: FormData) {
  const ctx = await requireActiveOrg();
  const parsed = schema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    type: String(formData.get("type") ?? ""),
    openingBalance: String(formData.get("openingBalance") ?? "0"),
  });
  if (!parsed.success) redirect("/contas?error=invalid");

  await db.insert(accounts).values({
    orgId: ctx.orgId,
    name: parsed.data.name,
    type: parsed.data.type,
    openingBalance: String(Number(parsed.data.openingBalance.replace(",", "."))),
  });
  revalidatePath("/contas");
  redirect("/contas?ok=created");
}

export async function updateAccount(formData: FormData) {
  const ctx = await requireActiveOrg();
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    type: String(formData.get("type") ?? ""),
    openingBalance: String(formData.get("openingBalance") ?? "0"),
  });
  if (!id || !parsed.success) redirect("/contas?error=invalid");

  await db.update(accounts).set({
    name: parsed.data.name,
    type: parsed.data.type,
    openingBalance: String(Number(parsed.data.openingBalance.replace(",", "."))),
  }).where(and(eq(accounts.id, id), eq(accounts.orgId, ctx.orgId)));
  revalidatePath("/contas");
  redirect("/contas?ok=updated");
}

export async function deleteAccount(formData: FormData) {
  const ctx = await requireActiveOrg();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  // Não apagamos: arquiva (movimentos têm restrict). Se necessário, retornamos erro.
  try {
    await db.delete(accounts).where(and(eq(accounts.id, id), eq(accounts.orgId, ctx.orgId)));
    revalidatePath("/contas");
    redirect("/contas?ok=deleted");
  } catch {
    // Tem movimentos associados — em vez de apagar, arquivamos
    await db.update(accounts).set({ archived: true }).where(and(eq(accounts.id, id), eq(accounts.orgId, ctx.orgId)));
    revalidatePath("/contas");
    redirect("/contas?ok=archived");
  }
}
