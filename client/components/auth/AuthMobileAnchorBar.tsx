"use client";

import { cn } from "@/lib/utils";
import type { AuthLandingSectionId } from "@/components/auth/auth-landing.constants";
import { scrollAuthLandingSectionIntoView } from "@/components/auth/auth-landing.utils";

const NAV_ITEMS: { id: AuthLandingSectionId; label: string }[] = [
  { id: "auth", label: "Entrar" },
  { id: "contact", label: "Contacto" },
  { id: "privacy", label: "Privacidade" },
];

type AuthMobileAnchorBarProps = {
  activeSection: AuthLandingSectionId;
};

export function AuthMobileAnchorBar({
  activeSection,
}: AuthMobileAnchorBarProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-border/70 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden",
        "shadow-[0_-4px_24px_-8px_hsl(var(--foreground)/0.08)]",
      )}
      aria-label="Navegação entre secções"
    >
      <div className="mx-auto flex max-w-lg gap-1.5 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "flex-1 rounded-xl border py-2.5 text-xs font-semibold sm:text-sm",
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "border-primary/40 bg-primary/10 text-foreground shadow-sm"
                  : "border-border/70 bg-muted/50 text-foreground shadow-sm hover:border-primary/35 hover:bg-muted/80",
              )}
              onClick={() => scrollAuthLandingSectionIntoView(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
