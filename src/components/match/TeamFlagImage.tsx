"use client";

import Image from "next/image";
import { useState } from "react";

export function TeamFlagImage({
  team,
  className,
  fallbackClassName,
}: {
  team: { name: string; code: string; flagUrl?: string };
  className?: string;
  fallbackClassName?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !team.flagUrl) {
    return (
      <span className={fallbackClassName ?? "font-heading text-lg font-black text-white drop-shadow"}>
        {team.code}
      </span>
    );
  }

  return (
    <Image
      src={team.flagUrl}
      alt={team.name}
      width={80}
      height={80}
      className={className ?? "h-full w-full object-cover"}
      unoptimized
      onError={() => setHasError(true)}
    />
  );
}
