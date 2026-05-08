"use client";

import NumberFlow, { useCanAnimate } from "@number-flow/react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";

const MotionNumberFlow = motion.create(NumberFlow);
const MotionArrowUp = motion.create(ArrowUp);

export function ShuffleNumber({
  value,
  delta,
  isNegative,
  className,
}: {
  value: number;
  delta: number | null;
  isNegative?: boolean;
  className?: string;
}) {
  const canAnimate = useCanAnimate();

  return (
    <span className="flex flex-wrap items-center gap-3">
      <NumberFlow
        value={value}
        locales="pt-PT"
        format={{
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }}
        className={cn(
          "font-extrabold leading-[1] tracking-tight tabular-nums text-4xl sm:text-5xl xl:text-6xl",
          isNegative ? "text-danger" : "text-primary-700",
          className,
        )}
      />

      {delta !== null && (
        <motion.span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition-colors",
            delta >= 0 ? "bg-success" : "bg-danger",
          )}
          layout={canAnimate}
          transition={{ layout: { duration: 0.9, bounce: 0, type: "spring" } }}
        >
          <MotionArrowUp
            className="size-3.5"
            absoluteStrokeWidth
            strokeWidth={3}
            transition={{ rotate: { type: "spring", duration: 0.5, bounce: 0 } }}
            animate={{ rotate: delta >= 0 ? 0 : 180 }}
            initial={false}
          />
          <MotionNumberFlow
            value={Math.abs(delta)}
            locales="pt-PT"
            format={{
              style: "percent",
              maximumFractionDigits: 1,
            }}
            layout={canAnimate}
            layoutRoot={canAnimate}
          />
        </motion.span>
      )}
    </span>
  );
}
