"use client";

import Image from "next/image";
import { useCallback } from "react";

type AuthBrandLogoImageProps = {
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
  priority?: boolean;
  onFallback: () => void;
};
export function AuthBrandLogoImage({
  src,
  alt,
  className,
  width,
  height,
  priority,
  onFallback,
}: AuthBrandLogoImageProps) {
  const handleError = useCallback(() => {
    onFallback();
  }, [onFallback]);

  return (
    <Image
      key={src}
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      referrerPolicy="no-referrer"
      onError={handleError}
      sizes={priority ? `${width}px` : `(max-width: 1024px) 200px, ${width}px`}
    />
  );
}
