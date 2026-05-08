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

      <div className="mx-auto max-w-3xl rounded-2xl border-2 border-dashed border-primary-200 bg-white p-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-3xl">
          🚧
        </div>
        <h3 className="mb-2 text-2xl font-bold">Em construção</h3>
        <p className="mx-auto mb-7 max-w-xl text-sm text-[#4A4A5C]">{description}</p>

        <div className="mx-auto max-w-md rounded-lg bg-primary-50/50 p-5 text-left">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-primary-700">O que vai vir</h4>
          <ul className="space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-400" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
