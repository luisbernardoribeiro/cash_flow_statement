import Link from "next/link";

export function PageHeader({
  title, breadcrumb, sub, actions,
}: {
  title: string;
  breadcrumb: Array<{ label: string; href?: string }>;
  sub?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-7">
      <div className="mb-3 flex items-start justify-between gap-4">
        <p className="text-sm text-[#4A4A5C]">
          {breadcrumb.map((b, i) => (
            <span key={i}>
              {b.href ? (
                <Link href={b.href} className="hover:text-primary-600">{b.label}</Link>
              ) : (
                <strong className="text-ink">{b.label}</strong>
              )}
              {i < breadcrumb.length - 1 && <span className="mx-2 text-[#9AA0A6]">/</span>}
            </span>
          ))}
        </p>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <h1 className="text-3xl font-bold">{title}</h1>
      {sub && <p className="mt-1 text-[#4A4A5C]">{sub}</p>}
    </div>
  );
}
