"use client";

import { cn } from "@/lib/utils";

const skipLinkClass = cn(
  "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100]",
  "focus:rounded-lg focus:border focus:border-border focus:bg-background focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-elevated",
  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
);

export function AuthSkipLinks() {
  return (
    <div className="pointer-events-none relative z-[90] [&_a]:pointer-events-auto">
      <a href="#auth-main" className={skipLinkClass}>
        Ir para o formulário de início de sessão
      </a>
      <a href="#contact" className={cn(skipLinkClass, "focus:top-20")}>
        Ir para contato
      </a>
      <a href="#privacy" className={cn(skipLinkClass, "focus:top-36")}>
        Ir para privacidade
      </a>
    </div>
  );
}
