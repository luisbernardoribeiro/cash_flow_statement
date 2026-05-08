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
    tone === "success" ? "text-emerald-400" :
    tone === "danger"  ? "text-rose-400"    :
                         "text-white";

  const iconBg =
    tone === "success" ? "bg-emerald-500/15 border-emerald-500/30" :
    tone === "danger"  ? "bg-rose-500/15 border-rose-500/30"       :
                         "bg-primary-500/20 border-primary-500/40";

  const iconColor =
    tone === "success" ? "text-emerald-400" :
    tone === "danger"  ? "text-rose-400"    :
                         "text-primary-300";

  const trendingIcon = !isEmpty && delta.kind === "pct"
    ? renderTrendingIcon(delta.value, goodWhenUp)
    : null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#15151E] p-4 shadow-sm transition-colors hover:bg-[#1A1A24] md:p-5">
      <div className="mb-3 flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg border", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} aria-hidden="true" />
        </div>
        {trendingIcon}
      </div>

      <div className="text-[11px] font-bold uppercase tracking-wider text-white/50">
        {label}
      </div>

      {isEmpty ? (
        <div className="mt-2">
          <div className="text-sm font-medium text-white/40">Sem movimentos este mês</div>
          <Link
            href="/movimentos/novo"
            className="mt-1.5 inline-block text-xs font-semibold text-gold-500 hover:text-gold-400 hover:underline"
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
  const color = isGood ? "text-emerald-400" : "text-rose-400";
  return <Icon className={cn("h-4 w-4", color)} aria-hidden="true" />;
}

function DeltaPill({ delta, goodWhenUp }: { delta: KpiDelta; goodWhenUp: boolean }) {
  if (delta.kind === "none") return null;

  if (delta.kind === "first-month") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-gold-500/40 bg-gold-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-500">
        Primeiro mês
      </span>
    );
  }

  if (delta.kind === "new") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-gold-500/40 bg-gold-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-500">
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
      isGood ? "text-emerald-400" : "text-rose-400",
    )}>
      <span aria-hidden="true">{sign}</span>
      {abs}% <span className="font-normal text-white/40">vs mês ant.</span>
    </span>
  );
}
