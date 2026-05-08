import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { memberships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createOrganization } from "./actions";

export const metadata = { title: "Bem-vindo" };

type SearchParams = Promise<{ error?: string }>;

export default async function OnboardingPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const params = await searchParams;

  const existing = await db
    .select({ orgId: memberships.orgId })
    .from(memberships)
    .where(eq(memberships.userId, user.id))
    .limit(1);

  if (existing.length > 0) redirect("/dashboard");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0A0F] flex items-center justify-center px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary-500/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl"
      />

      <div className="relative w-full max-w-lg">
        <Link href="/" className="mb-8 flex items-center gap-3 justify-center" aria-label="MAPA Tesouraria — by GI ADVISE">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/gi-mark.svg" alt="" className="h-10 w-10 [filter:brightness(0)_invert(1)]" />
          <span className="text-xl font-extrabold tracking-tight text-white">
            MAPA <span className="font-normal italic text-white/70">Tesouraria</span>
          </span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-[#15151E] p-8 shadow-xl">
          <h1 className="text-2xl font-bold mb-2 text-white">Bem-vindo ao MAPA 👋</h1>
          <p className="text-sm text-white/60 mb-2">
            Regista o nome da tua empresa e está feito. A app já vem montada com o método do <strong className="text-white/85">Alípio Monteiro CC</strong>:
          </p>
          <ul className="mb-6 space-y-1 text-sm text-white/60">
            <li>✓ <strong className="text-white/85">20 categorias</strong> — Vendas, Compras, Renda, Vencimentos, Eletricidade…</li>
            <li>✓ <strong className="text-white/85">3 contas</strong> base — Caixa, TPA, Banco</li>
            <li>✓ Dashboard, fluxo mensal, relatórios — tudo configurado</li>
          </ul>
          <p className="mb-6 text-xs text-white/55">
            <strong>Não precisas de importar nada.</strong> Esta é a tua nova versão do mapa. Logo a seguir registas o primeiro movimento.
          </p>

          <form action={createOrganization} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-white/55 mb-2">
                Nome da empresa
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoFocus
                placeholder="Ex.: Padaria do Bairro, Lda."
                maxLength={120}
                className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-3 text-base text-white placeholder-white/30 focus:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>

            <div>
              <label htmlFor="nif" className="block text-xs font-semibold uppercase tracking-wider text-white/55 mb-2">
                NIF <span className="text-white/35 font-normal normal-case tracking-normal">(opcional)</span>
              </label>
              <input
                id="nif"
                name="nif"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{9}"
                placeholder="500000000"
                maxLength={9}
                className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-3 text-base text-white placeholder-white/30 focus:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>

            {params.error && (
              <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                Não foi possível criar a empresa. Tenta de novo.
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full justify-center">
              Criar empresa e começar →
            </button>
          </form>

          <p className="mt-6 text-xs text-white/50">
            Ao continuar, aceitas os{" "}
            <Link href="/termos" className="text-gold-500 underline">termos de uso</Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="text-gold-500 underline">política de privacidade</Link>.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-white/55">
          ✓ Aprovado por Contabilista Certificado · CC nº 32897
        </p>
      </div>
    </main>
  );
}
