"use client";

import { APP_PUBLIC_NAME } from "@/constants/app-branding";

export function AuthLandingHero() {
  return (
    <div className="space-y-2">
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        {APP_PUBLIC_NAME}
      </p>
    </div>
  );
}
