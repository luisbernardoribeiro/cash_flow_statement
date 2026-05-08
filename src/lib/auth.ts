import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { memberships, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/entrar");
  return user;
}

export type ActiveContext = {
  userId: string;
  email: string;
  orgId: string;
  orgName: string;
  role: "owner" | "admin" | "operator" | "viewer" | "accountant";
};

/**
 * Devolve o utilizador autenticado + a empresa ativa.
 * Se não tiver organização, redireciona para /onboarding.
 * Se não estiver autenticado, redireciona para /entrar.
 */
export async function requireActiveOrg(): Promise<ActiveContext> {
  const user = await requireUser();

  const rows = await db
    .select({
      orgId: memberships.orgId,
      orgName: organizations.name,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.orgId, organizations.id))
    .where(eq(memberships.userId, user.id))
    .limit(1);

  if (rows.length === 0) {
    redirect("/onboarding");
  }

  const m = rows[0];
  return {
    userId: user.id,
    email: user.email!,
    orgId: m.orgId,
    orgName: m.orgName,
    role: m.role,
  };
}
