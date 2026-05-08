import { CCSeal } from "./cc-seal";
import { ShuffleNumber } from "@/components/ui/shuffle-number";

export function HeroBalance({
  value,
  isNegative,
  deltaPct,
  greeting,
  orgName,
  sparklineData,
}: {
  value: number;
  isNegative: boolean;
  deltaPct: number | null;
  greeting: string;
  orgName: string;
  sparklineData?: number[];
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-700 p-6 shadow-xl ring-1 ring-primary-700/40 md:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-500/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 bottom-0 h-64 w-64 rounded-full bg-primary-400/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-gold-500/0 via-gold-500/80 to-gold-500/0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]"
      />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-500 md:text-[11px]">
            Saldo Total · <span className="text-white/85">{orgName}</span>
          </p>
          <div className="mt-3">
            <ShuffleNumber value={value} delta={deltaPct} isNegative={isNegative} inverted />
          </div>
          <p className="mt-3 text-sm text-white/75">
            <span className="font-semibold text-white">{greeting}.</span>{" "}
            Aqui está onde estás hoje.
          </p>
        </div>

        <div className="flex shrink-0 items-end gap-5 md:flex-col md:items-end">
          {sparklineData && sparklineData.length >= 2 && (
            <Sparkline data={sparklineData} />
          )}
          <CCSeal />
        </div>
      </div>
    </section>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const w = 132;
  const h = 44;
  const pad = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const stepX = (w - pad * 2) / (data.length - 1);
  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (h - pad * 2) * (1 - (v - min) / range);
    return [x, y] as const;
  });

  const path = points
    .map(([x, y], i) => (i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `L ${x.toFixed(1)} ${y.toFixed(1)}`))
    .join(" ");

  const areaPath = `${path} L ${points[points.length - 1][0].toFixed(1)} ${h} L ${points[0][0].toFixed(1)} ${h} Z`;

  const last = points[points.length - 1];

  return (
    <div className="hidden md:block" aria-hidden="true">
      <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55">
        Últimos 6 meses
      </p>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        <defs>
          <linearGradient id="hero-spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C8A951" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#C8A951" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#hero-spark-fill)" />
        <path d={path} fill="none" stroke="#C8A951" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last[0]} cy={last[1]} r={3} fill="#C8A951" />
        <circle cx={last[0]} cy={last[1]} r={5} fill="#C8A951" fillOpacity="0.3" />
      </svg>
    </div>
  );
}
