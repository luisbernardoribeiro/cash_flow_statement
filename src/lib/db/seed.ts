import { db } from "./client";
import { categories, accounts } from "./schema";

const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: "entrada" | "saida";
  group: string;
}> = [
  { name: "Vendas Diárias",       type: "entrada", group: "Receita Operacional" },
  { name: "Receita Serviços",     type: "entrada", group: "Receita Operacional" },
  { name: "Outras Receitas",      type: "entrada", group: "Receita Não Operacional" },
  { name: "Depósito Inicial",     type: "entrada", group: "Saldo Inicial" },
  { name: "Compras Mercadorias",  type: "saida",   group: "Custo Mercadoria" },
  { name: "Fornecedores",         type: "saida",   group: "Custo Mercadoria" },
  { name: "Vencimentos",          type: "saida",   group: "Pessoal" },
  { name: "Segurança Social",     type: "saida",   group: "Pessoal" },
  { name: "Renda",                type: "saida",   group: "Estrutura" },
  { name: "Eletricidade",         type: "saida",   group: "Estrutura" },
  { name: "Água",                 type: "saida",   group: "Estrutura" },
  { name: "Comunicações",         type: "saida",   group: "Estrutura" },
  { name: "Combustível",          type: "saida",   group: "Logística" },
  { name: "Manutenção",           type: "saida",   group: "Logística" },
  { name: "Material Escritório",  type: "saida",   group: "Administrativo" },
  { name: "Seguros",              type: "saida",   group: "Administrativo" },
  { name: "Impostos",             type: "saida",   group: "Administrativo" },
  { name: "Consultoria",          type: "saida",   group: "Administrativo" },
  { name: "Marketing",            type: "saida",   group: "Comercial" },
  { name: "Outras Despesas",      type: "saida",   group: "Diversos" },
];

const DEFAULT_ACCOUNTS: Array<{
  name: string;
  type: "caixa" | "tpa" | "banco";
  openingBalance: string;
}> = [
  { name: "Caixa",          type: "caixa", openingBalance: "0" },
  { name: "TPA",            type: "tpa",   openingBalance: "0" },
  { name: "Conta Bancária", type: "banco", openingBalance: "0" },
];

export async function seedOrgDefaults(orgId: string) {
  await db.insert(categories).values(
    DEFAULT_CATEGORIES.map((c) => ({ ...c, orgId }))
  );
  await db.insert(accounts).values(
    DEFAULT_ACCOUNTS.map((a) => ({ ...a, orgId }))
  );
}
