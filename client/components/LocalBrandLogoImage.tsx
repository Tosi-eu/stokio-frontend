"use client";

import Image from "next/image";
import type { ComponentProps } from "react";

type Props = {
  alt: string;
  className?: string;
  priority?: boolean;
} & Pick<ComponentProps<typeof Image>, "sizes">;

/**
 * Logo padrão em `/public` — usa `next/image` (otimização + LCP quando `priority`).
 */
export function LocalBrandLogoImage({
  alt,
  className,
  priority = false,
  sizes = "(max-width: 768px) 160px, 200px",
}: Props) {
  return (
    <span className={`relative inline-block h-32 w-[200px] ${className ?? ""}`}>
      <Image
        src="/default_logo.png"
        alt={alt}
        fill
        className="object-contain object-center drop-shadow-sm"
        sizes={sizes}
        priority={priority}
      />
    </span>
  );
}
