"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const schema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(["entrada", "saida"]),
  group: z.string().max(80).optional().nullable(),
});

export async function createCategory(formData: FormData) {
  const ctx = await requireActiveOrg();
  const parsed = schema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    type: String(formData.get("type") ?? ""),
    group: nullableStr(formData.get("group")),
  });
  if (!parsed.success) redirect("/categorias?error=invalid");

  await db.insert(categories).values({ orgId: ctx.orgId, ...parsed.data });
  revalidatePath("/categorias");
  redirect("/categorias?ok=created");
}

export async function updateCategory(formData: FormData) {
  const ctx = await requireActiveOrg();
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    type: String(formData.get("type") ?? ""),
    group: nullableStr(formData.get("group")),
  });
  if (!id || !parsed.success) redirect("/categorias?error=invalid");

  await db.update(categories).set(parsed.data)
    .where(and(eq(categories.id, id), eq(categories.orgId, ctx.orgId)));
  revalidatePath("/categorias");
  redirect("/categorias?ok=updated");
}

export async function deleteCategory(formData: FormData) {
  const ctx = await requireActiveOrg();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.orgId, ctx.orgId)));
  revalidatePath("/categorias");
  revalidatePath("/movimentos");
  revalidatePath("/fluxo-mensal");
  redirect("/categorias?ok=deleted");
}

function nullableStr(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}
