"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { organizations, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const orgSchema = z.object({
  name: z.string().min(1).max(120),
  nif: z.string().regex(/^\d{9}$/).optional().nullable(),
});

export async function updateOrganization(formData: FormData) {
  const ctx = await requireActiveOrg();
  if (ctx.role !== "owner" && ctx.role !== "admin") redirect("/configuracao?error=forbidden");

  const parsed = orgSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    nif: pickNif(formData.get("nif")),
  });
  if (!parsed.success) redirect("/configuracao?error=invalid");

  await db.update(organizations).set(parsed.data).where(eq(organizations.id, ctx.orgId));
  revalidatePath("/configuracao");
  revalidatePath("/dashboard");
  redirect("/configuracao?ok=updated");
}

export async function updateUserName(formData: FormData) {
  const ctx = await requireActiveOrg();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/configuracao?error=invalid");

  await db.update(users).set({ name }).where(eq(users.id, ctx.userId));
  revalidatePath("/configuracao");
  redirect("/configuracao?ok=user_updated");
}

function pickNif(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return /^\d{9}$/.test(s) ? s : null;
}
