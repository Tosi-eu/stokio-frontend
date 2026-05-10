"use client";

import { cn } from "@/lib/utils";

const stepsAdmin = [
  "Nome e logo do abrigo",
  "Quais áreas do sistema ficam no menu",
  "Importar planilha (se quiser)",
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
          ? "Leva poucos minutos. Você pode mudar depois no painel."
          : "Só a identidade do abrigo. O menu é definido pelo administrador."}
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ol>
    </aside>
  );
}
