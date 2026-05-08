import Link from "next/link";
import { AvatarFallback } from "@/components/avatar-fallback";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME ?? "MAPA Fluxos Tesouraria";
const CC_NUMBER = process.env.NEXT_PUBLIC_CC_NUMBER ?? "32897";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-[#08071A] text-white">
        <div className="pointer-events-none absolute inset-0 z-0">
          <CanvasRevealEffect
            animationSpeed={3}
            containerClassName="bg-[#08071A]"
            colors={[
              [200, 169, 81],
              [120, 113, 255],
              [255, 255, 255],
            ]}
            opacities={[0.2, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]}
            dotSize={3}
            showGradient={false}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(8,7,26,0.65)_70%,_rgba(8,7,26,1)_100%)]" />
        </div>

        <header className="relative z-10 border-b border-white/10">
          <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-between gap-3 px-4 md:h-[72px] md:px-6">
            <Logo dark />
            <nav className="flex items-center gap-3 text-sm font-medium md:gap-7">
              <a href="#sobre" className="hidden text-white/80 hover:text-white lg:inline">Sobre a GI</a>
              <Link href="/entrar" className="hidden rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 sm:inline-flex">Entrar</Link>
              <Link href="/entrar" className="rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold-600 md:text-base">
                <span className="hidden sm:inline">Experimentar 14 dias grátis</span>
                <span className="sm:hidden">Começar →</span>
              </Link>
            </nav>
          </div>
        </header>

        <div className="relative z-10 px-4 py-16 md:px-6 md:py-24 lg:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-10 md:gap-16 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gold-500">
                ✓ Criado por Contabilista Certificado · CC nº {CC_NUMBER}
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-white lg:text-6xl">
                O mapa de tesouraria{" "}
                <em className="not-italic text-gold-500">do teu contabilista</em>,
                em app.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-white/75 lg:text-xl">
                Mais de quatro décadas de experiência do <strong className="text-white">Alípio Monteiro CC</strong> a controlar a tesouraria de PMEs portuguesas, agora numa plataforma: <strong className="text-white">categorias prontas, fluxos definidos, regras certas</strong>. Não precisas de pensar — basta registar.
              </p>
              <div className="mt-7 flex flex-wrap gap-4">
                <Link href="/entrar" className="inline-flex items-center justify-center rounded-md bg-gold-500 px-5 py-3 text-sm font-semibold text-ink shadow-lg transition-colors hover:bg-gold-600 md:text-base">
                  Experimentar 14 dias grátis →
                </Link>
                <Link href="/entrar" className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 backdrop-blur-sm transition-colors hover:bg-white/10 md:text-base">
                  Já tenho conta
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/65">
                <span>✓ <strong className="text-white">Sem cartão</strong> nos primeiros 14 dias</span>
                <span>✓ Cumpre <strong className="text-white">RGPD</strong> · dados em servidor UE</span>
                <span>✓ Suporte da <strong className="text-white">GI ADVISE</strong></span>
              </div>
            </div>

            <AppMockup />
          </div>
        </div>
      </section>

      <section id="sobre" className="bg-[#0A0A0F] px-6 py-20 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-10 rounded-3xl border border-white/10 bg-[#15151E] p-10 md:p-14 lg:grid-cols-[auto_1fr]">
            <AvatarFallback
              src="/alipio.jpg"
              alt="Alípio Monteiro — Contabilista Certificado nº 32897"
              initials="AM"
              size={180}
            />
            <div>
              <h3 className="text-2xl font-bold text-white lg:text-3xl">Alípio Monteiro</h3>
              <p className="mt-2 text-sm text-white/60 lg:text-base">
                Contabilista Certificado nº {CC_NUMBER} · Auditor Interno IPAI nº 3330 ·
                Member, Institute of Internal Audit (IIA)
              </p>
              <blockquote className="mt-5 border-l-4 border-gold-500 pl-5 text-lg italic text-white/85 lg:text-xl">
                Em mais de 40 anos de carteira, vi o mesmo erro repetir-se: empresários
                inteligentes a tomar decisões sem saber o saldo real. O MAPA é a
                ferramenta que sempre quis dar aos meus clientes. Agora damos a todos.
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#08071A] py-12 text-white/85">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm">
              <strong className="text-white">{BRAND}</strong> — by GI ADVISE — Contabilidade Consultoria · Viseu
            </p>
            <p className="mt-2 text-xs text-white/55">
              Alípio Monteiro · CC nº {CC_NUMBER} · Auditor Interno IPAI nº 3330 · Member IIA
            </p>
          </div>
          {/* GI ADVISE logo (versão branca via filter brightness invert) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/gi-logo.svg"
            alt="GI ADVISE — Contabilidade Consultoria"
            className="h-12 w-auto opacity-80 [filter:brightness(0)_invert(1)]"
          />
        </div>
      </footer>
    </main>
  );
}

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="MAPA Tesouraria — by GI ADVISE">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/gi-mark.svg"
        alt=""
        className={dark ? "h-11 w-11 [filter:brightness(0)_invert(1)]" : "h-11 w-11"}
      />
      <span className="flex flex-col leading-none">
        <span className={`text-lg font-extrabold tracking-tight ${dark ? "text-white" : "text-primary-600"}`}>
          MAPA <span className={`font-normal italic ${dark ? "text-white/70" : "text-primary-400"}`}>Fluxos Tesouraria</span>
        </span>
        <span className={`mt-1 text-[10px] font-medium tracking-[2px] ${dark ? "text-white/60" : "text-[#4A4A5C]"}`}>
          BY GI ADVISE
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
