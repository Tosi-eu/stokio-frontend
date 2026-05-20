"use client";

import { APP_PUBLIC_NAME } from "@/constants/app-branding";
import { AuthBrandLogoImage } from "@/components/auth/AuthBrandLogoImage";

type AuthMobileHeaderProps = {
  logoSrc: string;
  onLogoFallback: () => void;
};

export function AuthMobileHeader({
  logoSrc,
  onLogoFallback,
}: AuthMobileHeaderProps) {
  return (
    <header className="shrink-0 border-b border-border/60 bg-card/80 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-5 sm:px-6 lg:max-w-none lg:justify-end lg:px-10 lg:py-8">
        <AuthBrandLogoImage
          src={logoSrc}
          alt={APP_PUBLIC_NAME}
          width={200}
          height={80}
          priority
          onFallback={onLogoFallback}
          className="h-10 w-auto max-w-[200px] object-contain object-left drop-shadow-sm lg:hidden"
        />
        <div className="min-w-0 flex-1 lg:hidden">
          <p className="font-display truncate text-base font-semibold text-foreground">
            {APP_PUBLIC_NAME}
          </p>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground line-clamp-2">
            Medicamentos e estoque organizados para o seu abrigo.
          </p>
        </div>
      </div>
    </header>
  );
}
