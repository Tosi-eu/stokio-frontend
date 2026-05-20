"use client";

import { useCookieConsent } from "@/context/cookie-consent-context";
import { cn } from "@/lib/utils";

type ManageCookiesLinkProps = {
  className?: string;
};

export function ManageCookiesLink({ className }: ManageCookiesLinkProps) {
  const { openPreferences } = useCookieConsent();

  return (
    <button
      type="button"
      onClick={openPreferences}
      className={cn(
        "text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline",
        className,
      )}
    >
      Gerir cookies
    </button>
  );
}
