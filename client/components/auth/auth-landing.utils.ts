import type { AuthLandingSectionId } from "@/components/auth/auth-landing.constants";

export function scrollAuthLandingSectionIntoView(
  sectionId: AuthLandingSectionId | string,
): void {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
}
