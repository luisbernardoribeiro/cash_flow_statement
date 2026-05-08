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

  // Se já tem empresa, redireciona
  const existing = await db
    .select({ orgId: memberships.orgId })
    .from(memberships)
    .where(eq(memberships.userId, user.id))
    .limit(1);

  if (existing.length > 0) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-primary-50/30 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-8 flex items-center gap-3 justify-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 font-extrabold text-white">M</span>
          <span className="text-xl font-extrabold tracking-tight text-primary-600">
            MAPA <span className="font-normal italic text-primary-400">Tesouraria</span>
          </span>
        </Link>

        <div className="rounded-2xl border border-primary-100 bg-white p-8 shadow-md">
          <h1 className="text-2xl font-bold mb-2">Bem-vindo ao MAPA 👋</h1>
          <p className="text-sm text-[#4A4A5C] mb-2">
            Para começares, regista a tua empresa. Ao criar, vamos preparar a app com:
          </p>
          <ul className="mb-6 space-y-1 text-sm text-[#4A4A5C]">
            <li>✓ <strong className="text-ink">20 categorias</strong> do método Alípio Monteiro CC (Vendas Diárias, Compras, Renda, Vencimentos…)</li>
            <li>✓ <strong className="text-ink">3 contas</strong> base (Caixa, TPA, Banco) — podes adicionar mais</li>
            <li>✓ Estrutura pronta para começar a registar movimentos</li>
          </ul>

          <form action={createOrganization} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-[#4A4A5C] mb-2">
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
                className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-3 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              />
            </div>

            <div>
              <label htmlFor="nif" className="block text-xs font-semibold uppercase tracking-wider text-[#4A4A5C] mb-2">
                NIF <span className="text-[#9AA0A6] font-normal normal-case tracking-normal">(opcional)</span>
              </label>
              <input
                id="nif"
                name="nif"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{9}"
                placeholder="500000000"
                maxLength={9}
                className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-3 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              />
            </div>

            {params.error && (
              <div className="rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
                Não foi possível criar a empresa. Tenta de novo.
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full justify-center">
              Criar empresa e começar →
            </button>
          </form>

          <p className="mt-6 text-xs text-[#4A4A5C]">
            Ao continuar, aceitas os{" "}
            <Link href="/termos" className="text-primary-600 underline">termos de uso</Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="text-primary-600 underline">política de privacidade</Link>.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-[#4A4A5C]">
          ✓ Aprovado por Contabilista Certificado · CC nº 32897
        </p>
      </div>
    </main>
  );
}
