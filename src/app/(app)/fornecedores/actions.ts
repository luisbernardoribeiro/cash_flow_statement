"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { suppliers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const schema = z.object({
  name: z.string().min(1).max(120),
  nif: z.string().regex(/^\d{9}$/).optional().nullable(),
  email: z.string().email().optional().nullable(),
});

export async function createSupplier(formData: FormData) {
  const ctx = await requireActiveOrg();
  const parsed = schema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    nif: pickNif(formData.get("nif")),
    email: pickEmail(formData.get("email")),
  });
  if (!parsed.success) redirect("/fornecedores?error=invalid");

  await db.insert(suppliers).values({ orgId: ctx.orgId, ...parsed.data });
  revalidatePath("/fornecedores");
  redirect("/fornecedores?ok=created");
}

export async function updateSupplier(formData: FormData) {
  const ctx = await requireActiveOrg();
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    nif: pickNif(formData.get("nif")),
    email: pickEmail(formData.get("email")),
  });
  if (!id || !parsed.success) redirect("/fornecedores?error=invalid");

  await db.update(suppliers).set(parsed.data)
    .where(and(eq(suppliers.id, id), eq(suppliers.orgId, ctx.orgId)));
  revalidatePath("/fornecedores");
  redirect("/fornecedores?ok=updated");
}

export async function deleteSupplier(formData: FormData) {
  const ctx = await requireActiveOrg();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.delete(suppliers).where(and(eq(suppliers.id, id), eq(suppliers.orgId, ctx.orgId)));
  revalidatePath("/fornecedores");
  revalidatePath("/movimentos");
  redirect("/fornecedores?ok=deleted");
}

function pickNif(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return /^\d{9}$/.test(s) ? s : null;
}
function pickEmail(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.includes("@") ? s : null;
}
