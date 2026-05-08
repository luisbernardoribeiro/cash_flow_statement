import { CCSeal } from "./cc-seal";
import { HeroBackdrop } from "./hero-backdrop";
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
    <HeroBackdrop>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-500 md:text-[11px]">
            Saldo Total · <span className="text-white/85">{orgName}</span>
          </p>
          <div className="mt-3">
            <ShuffleNumber value={value} delta={deltaPct} isNegative={isNegative} inverted />
          </div>
          <p className="mt-3 text-sm text-white/70">
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
    </HeroBackdrop>
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
            <stop offset="0%" stopColor="#C8A951" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#C8A951" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#hero-spark-fill)" />
        <path d={path} fill="none" stroke="#C8A951" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last[0]} cy={last[1]} r={3} fill="#C8A951" />
        <circle cx={last[0]} cy={last[1]} r={5} fill="#C8A951" fillOpacity="0.35">
          <animate attributeName="r" values="5;8;5" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="fill-opacity" values="0.35;0.05;0.35" dur="2.4s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
