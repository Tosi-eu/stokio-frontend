"use client";

import { cn } from "@/lib/utils";

const stepsAdmin = [
  "Nome e logo do abrigo",
  "Setores de estoque (opcional)",
  "Importar planilha (opcional)",
] as const;

const stepsViewer = ["Nome e logo do abrigo"] as const;

export function TenantOnboardingAside({
  canManageModules,
  className,
}: {
  canManageModules: boolean;
  className?: string;
}) {
  const items = canManageModules ? stepsAdmin : stepsViewer;

  return (
    <aside
      className={cn(
        "rounded-xl border border-border bg-muted/30 p-5 lg:sticky lg:top-24",
        className,
      )}
      aria-label="Resumo da configuração"
    >
      <p className="text-sm font-medium text-foreground">O que fazer aqui</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {canManageModules
          ? "Leva poucos minutos. Setores e importação podem ser ajustados aqui; o menu lateral é tratado no Admin Desktop."
          : "Só a identidade do abrigo. O menu lateral é definido no Admin Desktop."}
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ol>
    </aside>
  );
}
