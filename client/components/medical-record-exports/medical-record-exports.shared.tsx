import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { pageSurfaceCardClass } from "@/components/page/page-ui.constants";

export type ExportFormat = "pdf" | "xlsx";

export function labelFormatoArquivo(fmt: string | null | undefined): string {
  const f = (fmt ?? "").trim().toLowerCase();
  if (f === "pdf") return "PDF";
  if (f === "xlsx") return "Excel";
  if (f === "csv") return "CSV";
  return fmt?.trim() ? fmt : "PDF";
}
export function textoItensNaCasela(med: number, ins: number): string {
  const m =
    med === 0 ? null : med === 1 ? "1 medicamento" : `${med} medicamentos`;
  const i = ins === 0 ? null : ins === 1 ? "1 insumo" : `${ins} insumos`;
  if (!m && !i) return "Sem linhas na casela";
  if (m && i) return `${m} e ${i}`;
  return m ?? i ?? "";
}

export function FormatBadge({ format }: { format: string | null | undefined }) {
  return (
    <Badge variant="outline" className="font-normal tabular-nums">
      {labelFormatoArquivo(format)}
    </Badge>
  );
}

export function EmptyStateCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Card
      className={cn(
        pageSurfaceCardClass,
        "border-dashed border-border/70 shadow-none ring-0",
      )}
    >
      <CardContent className="flex flex-col items-center px-6 pb-8 pt-8 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="h-6 w-6 shrink-0" aria-hidden />
        </div>
        <p className="mb-2 font-medium text-foreground">{title}</p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {children ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {children}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function AvailableTableSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border/80 p-4">
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 rounded-md" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: 5 }).map((_, c) => (
            <Skeleton key={c} className="h-10 flex-1 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function HistoryTableSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border/80 p-4">
      <div className="flex gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 rounded-md" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, r) => (
        <div key={r} className="flex gap-2">
          {Array.from({ length: 9 }).map((_, c) => (
            <Skeleton key={c} className="h-10 flex-1 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatusLabel({
  status,
  error,
}: {
  status: string;
  error: string | null;
}) {
  const s = status.toLowerCase();
  let cls =
    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground";
  let label = status;

  if (s === "succeeded") {
    cls =
      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-primary/12 text-primary border border-primary/20";
    label = "Concluído";
  } else if (s === "failed") {
    cls =
      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20";
    label = "Falhou";
  } else if (s === "running" || s === "pending" || s === "queued") {
    label = "Em progresso";
  }

  return (
    <span title={error ?? undefined} className={cls}>
      {label}
    </span>
  );
}
