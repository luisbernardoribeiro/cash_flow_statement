import Link from "next/link";

export type KpiTone = "success" | "danger" | "primary";

export type KpiDelta =
  | { kind: "pct"; value: number }
  | { kind: "first-month" }
  | { kind: "new" }
  | { kind: "none" };

export function KpiCard({
  label,
  value,
  tone,
  delta,
  isEmpty = false,
  goodWhenUp = true,
}: {
  label: string;
  value: string;
  tone: KpiTone;
  delta: KpiDelta;
  isEmpty?: boolean;
  goodWhenUp?: boolean;
}) {
  const valueColor =
    tone === "success" ? "text-success" :
    tone === "danger"  ? "text-danger"  :
                         "text-primary-700";

  return (
    <div className="rounded-lg border border-[#D5D8DC] bg-white p-4 transition-shadow hover:shadow-md md:p-5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#4A4A5C]">
        {label}
      </div>

      {isEmpty ? (
        <div className="mt-2">
          <div className="text-sm font-medium text-[#9AA0A6]">Sem movimentos este mês</div>
          <Link
            href="/movimentos/novo"
            className="mt-1.5 inline-block text-xs font-semibold text-primary-600 hover:underline"
          >
            + Registar
          </Link>
        </div>
      ) : (
        <>
          <div className={`mt-1.5 text-2xl font-extrabold leading-none tracking-tight tabular-nums md:text-3xl ${valueColor}`}>
            {value}
          </div>
          <div className="mt-2 h-5">
            <DeltaPill delta={delta} goodWhenUp={goodWhenUp} />
          </div>
        </>
      )}
    </div>
  );
}

function DeltaPill({ delta, goodWhenUp }: { delta: KpiDelta; goodWhenUp: boolean }) {
  if (delta.kind === "none") return null;

  if (delta.kind === "first-month") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-600">
        Primeiro mês
      </span>
    );
  }

  if (delta.kind === "new") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-600">
        Novo
      </span>
    );
  }

  const v = delta.value;
  const isUp = v >= 0;
  const isGood = goodWhenUp ? isUp : !isUp;
  const sign = isUp ? "▲" : "▼";
  const abs = Math.abs(v).toFixed(0);

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
      isGood ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
    }`}>
      <span aria-hidden="true">{sign}</span>
      {abs}% <span className="font-normal opacity-70">vs mês ant.</span>
    </span>
  );
}
