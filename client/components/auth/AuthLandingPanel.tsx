"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { authLandingPanelClass } from "@/components/auth/auth-landing.constants";

type AuthLandingPanelProps = {
  children: ReactNode;
  className?: string;
};

export function AuthLandingPanel({
  children,
  className,
}: AuthLandingPanelProps) {
  return (
    <div className={cn(authLandingPanelClass, "p-6 sm:p-8 lg:p-9", className)}>
      {children}
    </div>
  );
}
