"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const redirectTo = String(formData.get("redirect") ?? "/dashboard");

  if (!email || !email.includes("@")) {
    redirect("/entrar?error=invalid_email");
  }

  const h = await headers();
  const origin = h.get("origin") || `https://${h.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error("[sendMagicLink]", error);
    redirect("/entrar?error=send_failed");
  }

  redirect(`/entrar?sent=1&email=${encodeURIComponent(email)}`);
}
