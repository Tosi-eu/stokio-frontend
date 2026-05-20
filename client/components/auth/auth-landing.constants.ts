import { cn } from "@/lib/utils";
import { pageSurfaceCardClass } from "@/components/page/page-ui.constants";

export const AUTH_LANDING_SECTION_IDS = ["auth", "contact", "privacy"] as const;
export type AuthLandingSectionId = (typeof AUTH_LANDING_SECTION_IDS)[number];

export const authLandingPanelClass = cn(
  pageSurfaceCardClass,
  "bg-card/92 backdrop-blur-md shadow-elevated",
  "border-border/60 ring-1 ring-black/[0.03] dark:ring-white/[0.05]",
);

export const authLandingSectionShellClass = cn(
  "relative flex min-h-[100dvh] snap-start scroll-mt-24 flex-col",
  "px-4 pb-28 pt-10 sm:px-6 sm:pt-12 lg:min-h-[100dvh] lg:scroll-mt-28 lg:px-10 lg:pb-32 lg:pt-14",
);

export const authLandingFadeInClass = cn(
  "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
  "motion-reduce:translate-y-0 motion-reduce:opacity-100",
);

export function authLandingSectionToneClass(
  tone: "default" | "muted" | "subtle",
): string {
  switch (tone) {
    case "muted":
      return "bg-muted/30";
    case "subtle":
      return "bg-background";
    default:
      return "bg-gradient-to-b from-background via-brand-mesh/80 to-muted/25";
  }
}
