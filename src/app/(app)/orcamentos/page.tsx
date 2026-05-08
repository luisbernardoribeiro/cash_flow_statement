import { requireActiveOrg } from "@/lib/auth";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Orçamentos" };

export default async function OrcamentosPage() {
  await requireActiveOrg();
  return (
    <ComingSoon
      title="Orçamentos"
      breadcrumbLabel="Orçamentos"
      description="Define quanto queres gastar em cada categoria por mês e a app avisa-te quando o saldo se aproxima do limite."
      features={[
        "Orçamento mensal por categoria (€/mês)",
        "Cálculo automático de variance (real vs orçado)",
        "Alertas quando o gasto ultrapassa 80% / 100% do orçamento",
        "Comparação mês a mês (este vs anterior, vs ano passado)",
        "Cópia de orçamento de um mês para vários (replicar Janeiro em todo o ano)",
      ]}
    />
  );
}
