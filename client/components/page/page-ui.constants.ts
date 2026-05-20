import { cn } from "@/lib/utils";
export const pageSurfaceCardClass = cn(
  "rounded-xl border border-border/70 bg-card text-card-foreground shadow-elevated overflow-hidden",
  "ring-1 ring-black/[0.02] dark:ring-white/[0.04]",
  "transition-shadow duration-200",
);
export const pageSurfaceSubtleClass = cn(
  "rounded-xl bg-card/90 ring-1 ring-border/30 border-0 shadow-none",
);
export const pageStackClass = "flex flex-col gap-8";
export const pageSectionInnerStackClass = "flex flex-col gap-4";
