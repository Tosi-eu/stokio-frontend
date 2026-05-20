"use client";

import { cn } from "@/lib/utils";
import type { AuthLandingSectionId } from "@/components/auth/auth-landing.constants";
import { scrollAuthLandingSectionIntoView } from "@/components/auth/auth-landing.utils";

const NAV_ITEMS: { id: AuthLandingSectionId; label: string }[] = [
  { id: "auth", label: "Entrar" },
  { id: "contact", label: "Contacto" },
  { id: "privacy", label: "Privacidade" },
];

type AuthDesktopSectionNavProps = {
  activeSection: AuthLandingSectionId;
};

export function AuthDesktopSectionNav({
  activeSection,
}: AuthDesktopSectionNavProps) {
  return (
    <nav className="mt-10 w-full max-w-xs" aria-label="Secções da página">
      <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground/55">
        Navegar
      </p>
      <ul className="flex flex-col gap-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => scrollAuthLandingSectionIntoView(item.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                  isActive
                    ? "bg-white/18 text-white shadow-sm ring-1 ring-white/25"
                    : "text-primary-foreground/80 hover:bg-white/10 hover:text-white",
                )}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
