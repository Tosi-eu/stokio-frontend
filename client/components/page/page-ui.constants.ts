import { cn } from "@/lib/utils";

/** Primary elevated surface — cards, table shells, page panels (recipe a). */
export const pageSurfaceCardClass = cn(
  "rounded-xl border border-border/70 bg-card text-card-foreground shadow-elevated overflow-hidden",
  "ring-1 ring-black/[0.02] dark:ring-white/[0.04]",
  "transition-shadow duration-200",
);

/** Softer surface for filters / secondary panels (recipe b). */
export const pageSurfaceSubtleClass = cn(
  "rounded-xl bg-card/90 ring-1 ring-border/30 border-0 shadow-none",
);

/** Vertical rhythm between major blocks on a route. */
export const pageStackClass = "flex flex-col gap-8";

/** Rhythm inside a card or dense section. */
export const pageSectionInnerStackClass = "flex flex-col gap-4";
