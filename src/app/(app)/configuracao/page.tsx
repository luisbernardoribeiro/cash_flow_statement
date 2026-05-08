import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { organizations, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { updateOrganization, updateUserName } from "./actions";

export const metadata = { title: "Configuração" };

type SearchParams = Promise<{ ok?: string; error?: string }>;

export default async function ConfiguracaoPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireActiveOrg();
  const params = await searchParams;

  const [org] = await db
    .select({ id: organizations.id, name: organizations.name, nif: organizations.nif, plan: organizations.plan, createdAt: organizations.createdAt })
    .from(organizations).where(eq(organizations.id, ctx.orgId)).limit(1);

  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users).where(eq(users.id, ctx.userId)).limit(1);

  return (
    <div className="px-4 py-5 md:px-10 md:py-7">
      <PageHeader
        title="Configuração"
        breadcrumb={[{ label: "Início", href: "/dashboard" }, { label: "Configuração" }]}
        sub="Dados da empresa e do teu perfil"
      />

      <Toast type={params.ok || params.error} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Empresa */}
        <div className="rounded-2xl border border-white/10 bg-[#15151E] p-7 shadow-sm">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold">Empresa</h3>
              <p className="text-sm text-white/60">Dados visíveis em relatórios e na sidebar.</p>
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 capitalize">
              {org.plan}
            </span>
          </div>

          <form action={updateOrganization} className="space-y-4">
            <Field label="Nome" required>
              <input name="name" type="text" required maxLength={120} defaultValue={org.name}
                disabled={ctx.role !== "owner" && ctx.role !== "admin"}
                className="w-full rounded-md border border-white/10 bg-[#15151E] px-3 py-2.5 text-base disabled:bg-bg-soft disabled:text-white/40 focus:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-500/20" />
            </Field>
            <Field label="NIF">
              <input name="nif" type="text" inputMode="numeric" pattern="[0-9]{9}" maxLength={9}
                defaultValue={org.nif ?? ""} placeholder="500000000"
                disabled={ctx.role !== "owner" && ctx.role !== "admin"}
                className="w-full rounded-md border border-white/10 bg-[#15151E] px-3 py-2.5 text-base disabled:bg-bg-soft disabled:text-white/40 focus:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-500/20" />
            </Field>
            <Field label="Empresa criada em">
              <p className="text-sm text-white/60">{new Date(org.createdAt).toLocaleString("pt-PT")}</p>
            </Field>

            {(ctx.role === "owner" || ctx.role === "admin") ? (
              <button type="submit" className="btn btn-primary text-sm">Guardar alterações</button>
            ) : (
              <p className="text-xs italic text-white/60">Só Owner/Admin podem editar a empresa.</p>
            )}
          </form>
        </div>

        {/* Utilizador */}
        <div className="rounded-2xl border border-white/10 bg-[#15151E] p-7 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-bold">O teu perfil</h3>
            <p className="text-sm text-white/60">Como apareces na app.</p>
          </div>

          <form action={updateUserName} className="space-y-4">
            <Field label="Nome">
              <input name="name" type="text" maxLength={80} defaultValue={user?.name ?? ""}
                placeholder="O teu nome"
                className="w-full rounded-md border border-white/10 bg-[#15151E] px-3 py-2.5 text-base focus:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-500/20" />
            </Field>
            <Field label="Email">
              <p className="text-sm text-white/60">{user?.email}</p>
              <p className="mt-1 text-[11px] text-white/40">Para mudar o email, contacta o suporte.</p>
            </Field>
            <Field label="Função na empresa">
              <span className="inline-block rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 capitalize">
                {ctx.role}
              </span>
            </Field>
            <button type="submit" className="btn btn-primary text-sm">Guardar nome</button>
          </form>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-warning/30 bg-warning-bg/40 p-6">
        <h3 className="mb-2 text-base font-bold text-warning">Zona de atenção</h3>
        <p className="text-sm text-white/60">Apagar a empresa elimina permanentemente todos os movimentos, categorias, fornecedores e contas. Esta operação está temporariamente desativada — contacta o suporte se precisares.</p>
      </div>

      <p className="mt-12 text-center text-xs text-white/60">
        ✓ Aprovado por Contabilista Certificado · Alípio Monteiro · CC nº 32897
      </p>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/60">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function Toast({ type }: { type?: string }) {
  if (!type) return null;
  const messages: Record<string, { text: string; tone: "success" | "danger" }> = {
    updated:      { text: "Empresa atualizada.", tone: "success" },
    user_updated: { text: "Nome atualizado.", tone: "success" },
    invalid:      { text: "Dados inválidos.", tone: "danger" },
    forbidden:    { text: "Não tens permissão para esta operação.", tone: "danger" },
  };
  const m = messages[type];
  if (!m) return null;
  const cls = m.tone === "success" ? "border-success/30 bg-emerald-500/15 text-emerald-400" : "border-danger/30 bg-rose-500/15 text-rose-400";
  return <div className={`mb-4 rounded-md border ${cls} px-4 py-2.5 text-sm font-medium`}>{m.text}</div>;
}
