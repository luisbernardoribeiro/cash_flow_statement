import { AlipioPhoto } from "@/components/alipio-photo";

export function CCSeal({ showPhoto = true }: { showPhoto?: boolean }) {
  return (
    <div
      role="img"
      aria-label="Aprovado por Contabilista Certificado nº 32897"
      className="inline-flex items-center gap-3 rounded-full border border-primary-200 bg-gradient-to-br from-primary-50 to-white py-1.5 pl-1.5 pr-4 shadow-sm"
    >
      {showPhoto ? (
        <AlipioPhoto
          className="h-10 w-10 shrink-0 border-2 border-gold-500"
          initialsClass="text-sm"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500 text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
      <div className="text-left leading-tight">
        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary-700">
          Aprovado por Contabilista Certificado
        </div>
        <div className="mt-0.5 text-[11px] font-semibold text-primary-600">
          CC nº 32897 · Alípio Monteiro
        </div>
      </div>
    </div>
  );
}
