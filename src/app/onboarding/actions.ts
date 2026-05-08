"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { organizations, memberships, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { seedOrgDefaults } from "@/lib/db/seed";

export async function createOrganization(formData: FormData) {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const nifRaw = String(formData.get("nif") ?? "").trim();
  const nif = nifRaw && /^\d{9}$/.test(nifRaw) ? nifRaw : null;

  if (!name || name.length < 2) {
    redirect("/onboarding?error=invalid_name");
  }

  // Garantir que o utilizador existe em public.users (caso o trigger não tenha corrido)
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (existingUser.length === 0) {
    await db.insert(users).values({
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name ?? user.email!.split("@")[0],
    });
  }

  // Criar org + membership owner numa transação
  let orgId: string;
  try {
    const [org] = await db
      .insert(organizations)
      .values({ name, nif, plan: "trial" })
      .returning({ id: organizations.id });
    orgId = org.id;

    await db.insert(memberships).values({
      userId: user.id,
      orgId,
      role: "owner",
    });

    await seedOrgDefaults(orgId);
  } catch (e) {
    console.error("[createOrganization]", e);
    redirect("/onboarding?error=create_failed");
  }

  redirect("/dashboard");
}
