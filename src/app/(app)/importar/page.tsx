import Link from "next/link";
import { requireActiveOrg } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { importFromXlsx } from "./actions";

export const metadata = { title: "Importar Excel" };

type SearchParams = Promise<{ ok?: string; n?: string; error?: string; msg?: string }>;

export default async function ImportarPage({ searchParams }: { searchParams: SearchParams }) {
  await requireActiveOrg();
  const params = await searchParams;
  const ok = params.ok === "1";

  return (
    <div className="px-4 py-5 md:px-10 md:py-7">
      <PageHeader
        title="Importar (ferramenta interna)"
        breadcrumb={[{ label: "Início", href: "/dashboard" }, { label: "Importar" }]}
        sub="🔒 Página interna · usada para popular dados de demonstração ou migração inicial. Não está visível aos clientes."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-[#15151E] p-7 shadow-sm">
          {ok ? (
            <SuccessBlock count={Number(params.n) || 0} />
          ) : (
            <>
              {params.error && (
                <div className="mb-5 rounded-md border border-danger/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-400">
                  <strong className="block mb-1">Erro ao importar</strong>
                  <span className="text-rose-400/85">{decodeURIComponent(params.msg ?? "Verifica o ficheiro.")}</span>
                </div>
              )}

              <form action={importFromXlsx} className="space-y-5">
                <Field label="Ficheiro Excel (.xlsx)" required>
                  <input type="file" name="file" accept=".xlsx,.xlsm,.xls" required
                    className="block w-full rounded-md border border-white/10 bg-[#15151E] px-4 py-2.5 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-gold-500 file:px-4 file:py-2 file:font-semibold file:text-ink hover:file:bg-gold-600" />
                </Field>

                <Field label="Folha (sheet)">
                  <input type="text" name="sheet" defaultValue="Movimentos" placeholder="Movimentos"
                    className="w-full rounded-md border border-white/10 bg-[#15151E] px-4 py-2.5 text-base focus:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-500/20" />
                  <p className="mt-1 text-xs text-white/60">
                    Por defeito tenta &quot;Movimentos&quot;. Se não existir, usa a primeira folha do livro.
                  </p>
                </Field>

                <div className="flex items-start gap-2 rounded-md bg-warning-bg px-4 py-3 text-sm text-warning">
                  <span>⚠️</span>
                  <span>
                    Esta operação <strong>adiciona</strong> os movimentos do ficheiro à tua empresa atual. Não substitui os existentes.
                  </span>
                </div>

                <div className="flex justify-between gap-3 border-t border-white/10 pt-5">
                  <Link href="/movimentos" className="btn btn-ghost">Cancelar</Link>
                  <button type="submit" className="btn btn-primary">Importar →</button>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
          <h3 className="mb-3 text-base font-bold text-gold-500">📋 Template GI esperado</h3>
          <p className="mb-4 text-sm text-white/60">
            Esta app é a versão digital do <strong>mapa de tesouraria desenhado pelo Alípio Monteiro (CC nº 32897)</strong>. O importador aceita o template GI em Excel, com estas colunas:
          </p>
          <ul className="space-y-2 text-sm">
            <Col name="Data" required note="Formato dd/mm/yyyy ou Excel date" />
            <Col name="Tipo" required note="Entrada ou Saída" />
            <Col name="Descrição" required />
            <Col name="Categoria" note="Já tens as 20 categorias GI; novas criam-se" />
            <Col name="Fornecedor" note="Cria-se se não existir" />
            <Col name="Conta" note="Caixa, TPA ou Banco" />
            <Col name="Valor" required note="Número positivo" />
            <Col name="Notas" />
          </ul>
          <p className="mt-4 rounded bg-[#15151E]/70 p-3 text-xs text-white/60">
            <strong className="text-gold-500">Quem deve usar isto?</strong><br />
            Clientes da GI que já têm <strong>movimentos registados</strong> no Excel do Alípio e querem trazer o histórico para a app sem voltar a digitar.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/60">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function Col({ name, required, note }: { name: string; required?: boolean; note?: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className={`mt-0.5 inline-block h-1.5 w-1.5 rounded-full ${required ? "bg-danger" : "bg-primary-400"}`} />
      <div>
        <strong className="text-white">{name}</strong>
        {required && <span className="ml-1 text-xs text-rose-400">*</span>}
        {note && <span className="ml-1 text-xs text-white/60">— {note}</span>}
      </div>
    </li>
  );
}

function SuccessBlock({ count }: { count: number }) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-3xl">✓</div>
      <h3 className="text-2xl font-bold mb-2">Importação concluída!</h3>
      <p className="text-white/60 mb-6">
        Foram importados <strong className="text-white">{count}</strong> movimentos com sucesso.
      </p>
      <div className="flex justify-center gap-3 flex-wrap">
        <Link href="/movimentos" className="btn btn-primary">Ver movimentos →</Link>
        <Link href="/dashboard" className="btn btn-ghost">Ir para dashboard</Link>
      </div>
    </div>
  );
}
