import Image from "next/image";
import Link from "next/link";

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME ?? "MAPA Tesouraria";
const CC_NUMBER = process.env.NEXT_PUBLIC_CC_NUMBER ?? "32897";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-primary-100">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
          <Logo />
          <nav className="flex items-center gap-7 text-sm font-medium">
            <a href="#funcionalidades" className="text-ink hover:text-primary-600">Funcionalidades</a>
            <a href="#planos" className="text-ink hover:text-primary-600">Planos</a>
            <a href="#sobre" className="text-ink hover:text-primary-600">Sobre a GI</a>
            <Link href="/entrar" className="btn btn-ghost">Entrar</Link>
            <Link href="/registar" className="btn btn-primary">Experimentar 14 dias grátis</Link>
          </nav>
        </div>
      </header>

      <section
        className="px-6 py-20 lg:py-28"
        style={{
          background:
            "radial-gradient(1000px 400px at 110% -10%, rgba(46,44,126,.08), transparent 60%), radial-gradient(700px 350px at -10% 80%, rgba(200,169,81,.10), transparent 60%)",
        }}
      >
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <span className="cc-badge">Aprovado por Contabilista Certificado · CC nº {CC_NUMBER}</span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight lg:text-6xl">
              O teu mapa de tesouraria,{" "}
              <em className="not-italic text-primary-600">sempre atualizado</em>.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[#4A4A5C] lg:text-xl">
              O método de tesouraria do <strong>Alípio Monteiro CC</strong> — anos de experiência
              com PMEs — agora em app: categorias certas, fluxos prontos, no computador e no telemóvel.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/registar" className="btn btn-primary">
                Experimentar 14 dias grátis →
              </Link>
              <Link href="/demo" className="btn btn-ghost">
                Marcar demonstração
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-[#4A4A5C]">
              <span>✓ <strong className="text-ink">Sem cartão</strong> nos primeiros 14 dias</span>
              <span>✓ Cumpre <strong className="text-ink">RGPD</strong> · dados em servidor UE</span>
              <span>✓ Suporte da <strong className="text-ink">GI Contabilidade</strong></span>
            </div>
          </div>

          <AppMockup />
        </div>
      </section>

      <section id="sobre" className="px-6 py-20 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <div
            className="grid items-center gap-10 rounded-3xl p-10 md:p-14 lg:grid-cols-[auto_1fr]"
            style={{
              background:
                "linear-gradient(135deg, var(--tw-gradient-stops)), #fff",
            }}
          >
            <div className="relative h-[180px] w-[180px] overflow-hidden rounded-full ring-4 ring-primary-100 shadow-lg mx-auto lg:mx-0">
              <Image
                src="/alipio.jpg"
                alt="Alípio Monteiro — Contabilista Certificado nº 32897"
                fill
                sizes="180px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold lg:text-3xl">Alípio Monteiro</h3>
              <p className="mt-2 text-sm text-[#4A4A5C] lg:text-base">
                Contabilista Certificado nº {CC_NUMBER} · Auditor Interno IPAI nº 3330 ·
                Member, Institute of Internal Audit (IIA)
              </p>
              <blockquote className="mt-5 border-l-4 border-gold-500 pl-5 text-lg italic text-ink lg:text-xl">
                Em 20 anos de carteira, vi o mesmo erro repetir-se: empresários
                inteligentes a tomar decisões sem saber o saldo real. O MAPA é a
                ferramenta que sempre quis dar aos meus clientes. Agora damos a todos.
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-ink py-12 text-white/85">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm">
            <strong className="text-white">{BRAND}</strong> — by GI Contabilidade & Consultoria · Viseu
          </p>
          <p className="mt-2 text-xs text-white/55">
            Alípio Monteiro · CC nº {CC_NUMBER} · Auditor Interno IPAI nº 3330 · Member IIA
          </p>
        </div>
      </footer>
    </main>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 font-extrabold text-white">
        M
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-primary-600">
          MAPA <span className="font-normal italic text-primary-400">Tesouraria</span>
        </span>
        <span className="mt-1 text-[10px] font-medium tracking-[2px] text-[#4A4A5C]">
          BY GI CONTABILIDADE
        </span>
      </span>
    </Link>
  );
}

function AppMockup() {
  return (
    <div className="rounded-3xl border border-primary-100 bg-white p-4 shadow-xl -rotate-1">
      <div className="mb-3 flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#D5D8DC]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#D5D8DC]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#D5D8DC]" />
      </div>
      <div className="rounded-md bg-gradient-to-b from-white to-primary-50 p-4">
        <div className="mb-4 grid grid-cols-3 gap-2">
          <Kpi label="Entradas" value="81 698 €" tone="success" />
          <Kpi label="Saídas"   value="42 752 €" tone="danger" />
          <Kpi label="Saldo"    value="38 946 €" tone="primary" />
        </div>
        <div className="flex h-40 items-end gap-1.5 rounded-md bg-white p-3">
          {[
            [60, 40], [70, 50], [85, 45], [75, 55], [90, 60], [80, 50], [95, 65], [88, 58],
          ].map(([inH, outH], i) => (
            <div key={i} className="flex h-full flex-1 items-end gap-[3px]">
              <div className="w-full rounded-t-sm bg-success" style={{ height: `${inH}%` }} />
              <div className="w-full rounded-t-sm bg-danger/85" style={{ height: `${outH}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: "success" | "danger" | "primary" }) {
  const color =
    tone === "success" ? "text-success" :
    tone === "danger"  ? "text-danger"  :
                         "text-primary-600";
  return (
    <div className="rounded-lg border border-[#D5D8DC] bg-white p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#4A4A5C]">{label}</div>
      <div className={`mt-1 text-lg font-extrabold ${color}`}>{value}</div>
    </div>
  );
}
