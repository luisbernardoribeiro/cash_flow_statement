import { requireActiveOrg } from "@/lib/auth";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Relatórios" };

export default async function RelatoriosPage() {
  await requireActiveOrg();
  return (
    <ComingSoon
      title="Relatórios"
      breadcrumbLabel="Relatórios"
      description="Gera PDFs e folhas Excel formatados, prontos para enviar ao contabilista ou aos sócios."
      features={[
        "Mapa de Tesouraria mensal/anual em PDF (formato standard pedido pela contabilidade)",
        "Export Excel com todos os movimentos filtrados",
        "Demonstração de fluxos de caixa (DFC) — entradas, saídas, saldo final",
        "Relatórios agendados por email (semanal, mensal)",
        "Export SAF-T para a AT (em conformidade com Portaria 302/2016)",
      ]}
    />
  );
}
