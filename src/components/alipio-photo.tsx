"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Foto do Alípio com fallback gracioso para iniciais "AM".
 * - Se /alipio.jpg existir → mostra foto.
 * - Se não existir (ou 404) → fica visível só o círculo índigo com "AM".
 *
 * Sizing/borders via className (suporta Tailwind responsive).
 * `initialsClass` controla o tamanho do texto das iniciais.
 */
export function AlipioPhoto({
  className = "",
  initialsClass = "text-base",
}: {
  className?: string;
  initialsClass?: string;
}) {
  const [error, setError] = useState(false);

  return (
    <span className={cn("relative inline-block overflow-hidden rounded-full", className)}>
      <span
        className={cn(
          "flex h-full w-full items-center justify-center bg-gold-500 font-extrabold leading-none text-ink",
          initialsClass,
        )}
        aria-hidden="true"
      >
        AM
      </span>
      {!error && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/alipio.jpg"
          alt=""
          onError={() => setError(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </span>
  );
}
