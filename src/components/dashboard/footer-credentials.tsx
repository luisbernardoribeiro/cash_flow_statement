import { AlipioPhoto } from "@/components/alipio-photo";

export function FooterCredentials() {
  return (
    <footer className="mt-10 rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/40 to-white p-5 md:mt-12 md:p-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-5">
        <AlipioPhoto
          className="h-16 w-16 shrink-0 border-2 border-gold-500 shadow-sm md:h-20 md:w-20"
          initialsClass="text-xl md:text-2xl"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-base font-bold text-ink">Alípio Monteiro</strong>
            <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-600">
              CC nº 32897
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#4A4A5C]">
            Contabilista Certificado · Auditor Interno IPAI nº 3330 · Member, Institute of Internal Audit (IIA)
          </p>
          <p className="mt-1 text-xs text-[#4A4A5C]">
            Plataforma da <strong className="text-ink">GI ADVISE — Contabilidade Consultoria</strong>
          </p>
          <blockquote className="mt-3 border-l-2 border-gold-500 pl-3 text-sm italic text-[#4A4A5C]">
            &ldquo;Em 20 anos de carteira, vi o mesmo erro repetir-se: empresários inteligentes a tomar decisões sem saber o saldo real. O MAPA é a ferramenta que sempre quis dar aos meus clientes. Agora damos a todos.&rdquo;
          </blockquote>
        </div>
      </div>
    </footer>
  );
}
