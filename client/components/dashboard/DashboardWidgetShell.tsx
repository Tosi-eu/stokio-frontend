"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2, X } from "lucide-react";
import type { DashboardWidgetId } from "@/constants/dashboard-widgets";

type Props = {
  id: DashboardWidgetId;
  editMode: boolean;
  wide: boolean;
  onHide: () => void;
  onToggleWide: () => void;
  /** Permite esconder o botão de largura (ex.: KPIs). */
  allowWide?: boolean;
  children: ReactNode;
  className?: string;
};

export function DashboardWidgetShell({
  id,
  editMode,
  wide,
  onHide,
  onToggleWide,
  allowWide = true,
  children,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "relative min-w-0",
        wide && "lg:col-span-2",
        editMode &&
          "rounded-xl ring-2 ring-primary/25 ring-offset-2 ring-offset-background",
        className,
      )}
      data-dashboard-widget={id}
    >
      {editMode ? (
        <div className="absolute right-2 top-2 z-20 flex gap-1">
          {allowWide ? (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8 shadow-sm"
              title={wide ? "Metade da largura" : "Largura total"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleWide();
              }}
            >
              {wide ? (
                <Minimize2 className="h-4 w-4" aria-hidden />
              ) : (
                <Maximize2 className="h-4 w-4" aria-hidden />
              )}
            </Button>
          ) : null}
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="h-8 w-8 shadow-sm"
            title="Remover do painel"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onHide();
            }}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : null}
      <div className={cn(editMode && "pt-10")}>{children}</div>
    </div>
  );
}
