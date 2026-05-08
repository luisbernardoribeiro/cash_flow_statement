import { PageHeader } from "@/components/page-header";

export function ComingSoon({
  title, breadcrumbLabel, description, features,
}: {
  title: string;
  breadcrumbLabel: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="px-10 py-7">
      <PageHeader
        title={title}
        breadcrumb={[{ label: "Início", href: "/dashboard" }, { label: breadcrumbLabel }]}
      />

      <div className="mx-auto max-w-3xl rounded-2xl border-2 border-dashed border-white/15 bg-[#15151E] p-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/15 text-3xl">
          🚧
        </div>
        <h3 className="mb-2 text-2xl font-bold text-white">Em construção</h3>
        <p className="mx-auto mb-7 max-w-xl text-sm text-white/60">{description}</p>

        <div className="mx-auto max-w-md rounded-lg border border-white/10 bg-white/5 p-5 text-left">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gold-500">O que vai vir</h4>
          <ul className="space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-500" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
