"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

export function HeroBackdrop({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement | null>(null);

  // Spotlight x/y in % (0–100) of the section.
  const mx = useMotionValue(70);
  const my = useMotionValue(30);

  // Initial fall-back position so the spotlight is visible before the user moves.
  useEffect(() => {
    mx.set(72);
    my.set(28);
  }, [mx, my]);

  function onMove(e: MouseEvent<HTMLElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width) * 100);
    my.set(((e.clientY - rect.top) / rect.height) * 100);
  }

  const spotlight = useMotionTemplate`radial-gradient(circle 520px at ${mx}% ${my}%, rgba(120, 113, 255, 0.45), transparent 65%)`;

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      className="group/hero relative overflow-hidden rounded-2xl bg-[#08071A] p-6 shadow-2xl ring-1 ring-white/10 md:p-8"
    >
      {/* Mouse-follow spotlight (top layer of interactivity) */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{ background: spotlight }}
      />

      {/* Aurora orbs — slow, looping movement */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-gold-500/35 blur-3xl"
        animate={{
          x: [0, 30, -10, 0],
          y: [0, 20, -10, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -bottom-24 h-96 w-96 rounded-full bg-primary-500/40 blur-3xl"
        animate={{
          x: [0, -20, 25, 0],
          y: [0, 15, -15, 0],
          scale: [1, 1.08, 0.92, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute right-1/4 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-violet-500/25 blur-3xl"
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -25, 20, 0],
          opacity: [0.4, 0.7, 0.45, 0.4],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      {/* Vertical gold stripe accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-gold-500/0 via-gold-500/80 to-gold-500/0"
      />

      {/* Subtle dot grid for texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]"
      />

      {/* Top hairline highlight (premium glass feel) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />

      <div className="relative">{children}</div>
    </section>
  );
}
