"use client";

import { APP_PUBLIC_NAME } from "@/constants/app-branding";

export function AuthLandingHero() {
  return (
    <div className="space-y-2">
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        Bem-vindo ao {APP_PUBLIC_NAME}
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Inicie sessão ou crie uma conta para gerir o estoque do abrigo com
        clareza e controlo.
      </p>
    </div>
  );
}
