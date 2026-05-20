"use client";

import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthSectionFooterLinksProps = {
  primaryHref: string;
  primaryLabel: string;
  showBackToAuth?: boolean;
  className?: string;
};

export function AuthSectionFooterLinks({
  primaryHref,
  primaryLabel,
  showBackToAuth = true,
  className,
}: AuthSectionFooterLinksProps) {
  return (
    <p className={cn("mt-8 space-y-2 text-center", className)}>
      <a
        href={primaryHref}
        className="block text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground"
      >
        {primaryLabel}
      </a>
      {showBackToAuth ? (
        <a
          href="#auth"
          className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowUp className="h-4 w-4 shrink-0" aria-hidden />
          Voltar ao início de sessão
        </a>
      ) : null}
    </p>
  );
}
