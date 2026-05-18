"use client";

import { cn } from "@/lib/utils";

function scrollSectionIntoView(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
}

export function AuthMobileAnchorBar() {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-border/70 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden",
        "shadow-[0_-4px_24px_-8px_hsl(var(--foreground)/0.08)]",
      )}
      aria-label="Navegação entre secções"
    >
      <div className="mx-auto flex max-w-lg gap-1.5 px-3 py-2">
        <button
          type="button"
          className="flex-1 rounded-xl border border-border/70 bg-muted/50 py-2.5 text-xs sm:text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/35 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => scrollSectionIntoView("auth")}
        >
          Entrar
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl border border-border/70 bg-muted/50 py-2.5 text-xs sm:text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/35 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => scrollSectionIntoView("contact")}
        >
          Contacto
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl border border-border/70 bg-muted/50 py-2.5 text-xs sm:text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/35 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => scrollSectionIntoView("privacy")}
        >
          Privacidade
        </button>
      </div>
    </nav>
  );
}
