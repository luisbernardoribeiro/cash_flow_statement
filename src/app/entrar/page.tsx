import Link from "next/link";
import { redirect } from "next/navigation";
import { sendMagicLink } from "./actions";
import { getUser } from "@/lib/auth";

export const metadata = { title: "Entrar" };

type SearchParams = Promise<{ sent?: string; email?: string; error?: string; redirect?: string }>;

export default async function EntrarPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  // Se já está autenticado, vai direto
  const user = await getUser();
  if (user) redirect(params.redirect || "/dashboard");

  const sent = params.sent === "1";

  return (
    <main className="min-h-screen bg-primary-50/30 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center gap-3 justify-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 font-extrabold text-white">M</span>
          <span className="text-xl font-extrabold tracking-tight text-primary-600">
            MAPA <span className="font-normal italic text-primary-400">Tesouraria</span>
          </span>
        </Link>

        <div className="rounded-2xl border border-primary-100 bg-white p-8 shadow-md">
          {sent ? (
            <SuccessView email={params.email ?? ""} />
          ) : (
            <FormView error={params.error} redirectTo={params.redirect} />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[#4A4A5C]">
          ✓ Aprovado por Contabilista Certificado · CC nº 32897
        </p>
      </div>
    </main>
  );
}

function FormView({ error, redirectTo }: { error?: string; redirectTo?: string }) {
  return (
    <>
      <h1 className="text-2xl font-bold mb-2">Entrar</h1>
      <p className="text-sm text-[#4A4A5C] mb-6">
        Recebes um link mágico no email para entrar sem password.
      </p>

      <form action={sendMagicLink} className="space-y-4">
        {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
        <div>
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#4A4A5C] mb-2">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoFocus
            placeholder="o-teu-email@empresa.pt"
            className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-3 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>

        {error && (
          <div className="rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
            {error === "send_failed"
              ? "Não foi possível enviar o email. Verifica o endereço e tenta de novo."
              : "Algo correu mal. Tenta de novo."}
          </div>
        )}

        <button type="submit" className="btn btn-primary w-full justify-center">
          Enviar link mágico →
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-[#4A4A5C]">
        Não tens conta?{" "}
        <span className="text-primary-600 font-semibold">
          O link mágico cria automaticamente quando entras pela primeira vez.
        </span>
      </p>
    </>
  );
}

function SuccessView({ email }: { email: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-3xl">
        ✉️
      </div>
      <h1 className="text-2xl font-bold mb-2">Verifica o teu email</h1>
      <p className="text-sm text-[#4A4A5C] mb-2">
        Enviámos um link de acesso para
      </p>
      {email && (
        <p className="text-base font-semibold text-primary-700 mb-6 break-all">{email}</p>
      )}
      <p className="text-sm text-[#4A4A5C] mb-6">
        Abre o email e clica no botão para entrar. Pode demorar 1–2 minutos a chegar — verifica também o spam.
      </p>
      <Link href="/entrar" className="text-sm font-semibold text-primary-600 hover:underline">
        ← Usar outro email
      </Link>
    </div>
  );
}
