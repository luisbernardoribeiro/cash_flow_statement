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
    <div className="px-10 py-7">
      <PageHeader
        title="Importar Excel"
        breadcrumb={[{ label: "Início", href: "/dashboard" }, { label: "Importar Excel" }]}
        sub="Carrega o teu mapa de tesouraria em formato Excel para popular a app de uma só vez."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-[#D5D8DC] bg-white p-7 shadow-sm">
          {ok ? (
            <SuccessBlock count={Number(params.n) || 0} />
          ) : (
            <>
              {params.error && (
                <div className="mb-5 rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
                  <strong className="block mb-1">Erro ao importar</strong>
                  <span className="text-danger/85">{decodeURIComponent(params.msg ?? "Verifica o ficheiro.")}</span>
                </div>
              )}

              <form action={importFromXlsx} encType="multipart/form-data" className="space-y-5">
                <Field label="Ficheiro Excel (.xlsx)" required>
                  <input type="file" name="file" accept=".xlsx,.xlsm,.xls" required
                    className="block w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-2.5 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-primary-700" />
                </Field>

                <Field label="Folha (sheet)">
                  <input type="text" name="sheet" defaultValue="Movimentos" placeholder="Movimentos"
                    className="w-full rounded-md border border-[#D5D8DC] bg-white px-4 py-2.5 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
                  <p className="mt-1 text-xs text-[#4A4A5C]">
                    Por defeito tenta &quot;Movimentos&quot;. Se não existir, usa a primeira folha do livro.
                  </p>
                </Field>

                <div className="flex items-start gap-2 rounded-md bg-warning-bg px-4 py-3 text-sm text-warning">
                  <span>⚠️</span>
                  <span>
                    Esta operação <strong>adiciona</strong> os movimentos do ficheiro à tua empresa atual. Não substitui os existentes.
                  </span>
                </div>

                <div className="flex justify-between gap-3 border-t border-[#D5D8DC] pt-5">
                  <Link href="/movimentos" className="btn btn-ghost">Cancelar</Link>
                  <button type="submit" className="btn btn-primary">Importar →</button>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-primary-200 bg-primary-50/40 p-6">
          <h3 className="mb-3 text-base font-bold text-primary-700">📋 Formato esperado</h3>
          <p className="mb-4 text-sm text-[#4A4A5C]">
            A app aceita o template <strong>MAPA Tesouraria</strong>, com as seguintes colunas:
          </p>
          <ul className="space-y-2 text-sm">
            <Col name="Data" required note="Formato dd/mm/yyyy ou Excel date" />
            <Col name="Tipo" required note="Entrada ou Saída" />
            <Col name="Descrição" required />
            <Col name="Categoria" note="Cria-se se não existir" />
            <Col name="Fornecedor" note="Cria-se se não existir" />
            <Col name="Conta" note="Tem de existir nas tuas Contas" />
            <Col name="Valor" required note="Número positivo" />
            <Col name="Notas" />
          </ul>
          <p className="mt-4 text-xs text-[#4A4A5C]">
            <strong>Dica:</strong> tens o ficheiro <code className="rounded bg-white px-1 py-0.5 text-primary-700">MAPA_FLUXOS_TESOURARIA.xlsx</code> com 221 movimentos demo na pasta do projeto.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#4A4A5C]">
        {label} {required && <span className="text-danger">*</span>}
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
        <strong className="text-ink">{name}</strong>
        {required && <span className="ml-1 text-xs text-danger">*</span>}
        {note && <span className="ml-1 text-xs text-[#4A4A5C]">— {note}</span>}
      </div>
    </li>
  );
}

function SuccessBlock({ count }: { count: number }) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-3xl">✓</div>
      <h3 className="text-2xl font-bold mb-2">Importação concluída!</h3>
      <p className="text-[#4A4A5C] mb-6">
        Foram importados <strong className="text-ink">{count}</strong> movimentos com sucesso.
      </p>
      <div className="flex justify-center gap-3 flex-wrap">
        <Link href="/movimentos" className="btn btn-primary">Ver movimentos →</Link>
        <Link href="/dashboard" className="btn btn-ghost">Ir para dashboard</Link>
      </div>
    </div>
  );
}
