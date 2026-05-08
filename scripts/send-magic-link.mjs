import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in env");
  process.exit(1);
}

const email = (process.argv[2] || "lbernardoribeiro@gmail.com").trim().toLowerCase();
const redirectTo = "http://localhost:3000/api/auth/callback?next=/dashboard";

const supabase = createClient(url, anon);
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
});

if (error) {
  console.error("ERROR:", error.message);
  process.exit(1);
}

console.log(`✓ Magic link enviado para ${email}`);
console.log(`  Redirect: ${redirectTo}`);
console.log("  Verifica a inbox (e a spam) — pode demorar 1-2 min.");
