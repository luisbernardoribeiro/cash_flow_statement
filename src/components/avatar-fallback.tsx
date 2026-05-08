"use client";

import { useState } from "react";

export function AvatarFallback({
  src, alt, initials, size = 180,
}: {
  src: string;
  alt: string;
  initials: string;
  size?: number;
}) {
  const [error, setError] = useState(false);

  return (
    <div
      className="relative mx-auto overflow-hidden rounded-full ring-4 ring-primary-100 shadow-lg lg:mx-0"
      style={{ width: size, height: size }}
      aria-label={alt}
    >
      <div className="flex h-full w-full items-center justify-center bg-primary-600 font-extrabold text-white" style={{ fontSize: size * 0.34 }}>
        {initials}
      </div>
      {!error && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
