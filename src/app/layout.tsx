import type { Metadata } from "next";
import "./globals.css";

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME ?? "MAPA Fluxos Tesouraria";
const PARENT = process.env.NEXT_PUBLIC_BRAND_PARENT ?? "GI ADVISE — Contabilidade Consultoria";

export const metadata: Metadata = {
  title: {
    default: `${BRAND} — by GI ADVISE · Controlo de tesouraria para PMEs`,
    template: `%s · ${BRAND}`,
  },
  description:
    "Plataforma de controlo de tesouraria desenvolvida por Contabilista Certificado para PMEs portuguesas. Entradas, saídas e saldo em tempo real, no computador e no telemóvel.",
  authors: [{ name: "Alípio Monteiro" }],
  keywords: ["tesouraria", "contabilidade", "PME", "Portugal", "fluxo de caixa", "Contabilista Certificado"],
  openGraph: {
    title: `${BRAND} — by GI ADVISE`,
    description: "Aprovado por Contabilista Certificado · CC nº 32897",
    locale: "pt_PT",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  );
}
