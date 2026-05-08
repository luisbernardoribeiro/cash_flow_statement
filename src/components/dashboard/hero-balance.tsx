import { CCSeal } from "./cc-seal";

export function HeroBalance({
  formattedValue,
  isNegative,
  greeting,
  orgName,
  monthName,
}: {
  formattedValue: string;
  isNegative: boolean;
  greeting: string;
  orgName: string;
  monthName: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/60 via-white to-white p-6 shadow-sm md:p-8">
      {/* Acento dourado decorativo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-gradient-to-br from-gold-500/20 to-transparent blur-2xl"
      />
      {/* Linha dourada lateral subtil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-6 bottom-6 w-1 rounded-r bg-gradient-to-b from-gold-500/0 via-gold-500/40 to-gold-500/0"
      />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-8">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-600/80 md:text-[11px]">
            Saldo Total · {orgName}
          </p>
          <h1
            className={`mt-2.5 break-words font-extrabold leading-[1] tracking-tight tabular-nums text-4xl sm:text-5xl xl:text-6xl ${
              isNegative ? "text-danger" : "text-primary-700"
            }`}
          >
            {formattedValue}
          </h1>
          <p className="mt-3 text-sm text-[#4A4A5C]">
            <span className="font-semibold text-ink">{greeting}.</span>{" "}
            Vista geral · <span className="capitalize">{monthName}</span>
          </p>
        </div>

        <div className="shrink-0 self-start md:self-end">
          <CCSeal />
        </div>
      </div>
    </section>
  );
}
