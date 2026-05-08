import Link from "next/link";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  icon: Icon,
  delta,
  isEmpty = false,
  goodWhenUp = true,
}: {
  label: string;
  value: string;
  tone: KpiTone;
  icon: LucideIcon;
  delta: KpiDelta;
  isEmpty?: boolean;
  goodWhenUp?: boolean;
}) {
  const valueColor =
    tone === "success" ? "text-success" :
    tone === "danger"  ? "text-danger"  :
                         "text-primary-700";

  const iconBg =
    tone === "success" ? "bg-success-bg" :
    tone === "danger"  ? "bg-danger-bg"  :
                         "bg-primary-50";

  const iconColor =
    tone === "success" ? "text-success" :
    tone === "danger"  ? "text-danger"  :
                         "text-primary-600";

  const trendingIcon = !isEmpty && delta.kind === "pct"
    ? renderTrendingIcon(delta.value, goodWhenUp)
    : null;

  return (
    <div className="rounded-xl border border-[#D5D8DC] bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-5">
      <div className="mb-3 flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} aria-hidden="true" />
        </div>
        {trendingIcon}
      </div>

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
          <div className={cn("mt-1 text-2xl font-extrabold leading-none tracking-tight tabular-nums md:text-3xl", valueColor)}>
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

function renderTrendingIcon(value: number, goodWhenUp: boolean) {
  const isUp = value >= 0;
  const isGood = goodWhenUp ? isUp : !isUp;
  const Icon = isUp ? TrendingUp : TrendingDown;
  const color = isGood ? "text-success" : "text-danger";
  return <Icon className={cn("h-4 w-4", color)} aria-hidden="true" />;
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
    <span className={cn(
      "inline-flex items-center gap-1 text-[11px] font-semibold",
      isGood ? "text-success" : "text-danger",
    )}>
      <span aria-hidden="true">{sign}</span>
      {abs}% <span className="font-normal text-[#4A4A5C]">vs mês ant.</span>
    </span>
  );
}
