import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/dashboard";

  // Magic link / OTP por email envia ?token_hash=...&type=...
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  // OAuth / PKCE envia ?code=...
  const code = url.searchParams.get("code");

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      console.error("[auth/callback verifyOtp]", error);
      return NextResponse.redirect(new URL("/entrar?error=exchange_failed", url.origin));
    }
    return NextResponse.redirect(new URL(next, url.origin));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback exchangeCode]", error);
      return NextResponse.redirect(new URL("/entrar?error=exchange_failed", url.origin));
    }
    return NextResponse.redirect(new URL(next, url.origin));
  }

  return NextResponse.redirect(new URL("/entrar?error=no_code", url.origin));
}
