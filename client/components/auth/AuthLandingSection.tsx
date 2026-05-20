"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  authLandingFadeInClass,
  authLandingSectionShellClass,
  authLandingSectionToneClass,
} from "@/components/auth/auth-landing.constants";

type AuthLandingSectionProps = {
  id: string;
  ariaLabel: string;
  tone?: "default" | "muted" | "subtle";
  /** start = content near top of viewport; center = vertical center (default) */
  align?: "center" | "start";
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AuthLandingSection({
  id,
  ariaLabel,
  tone = "default",
  align = "center",
  children,
  className,
  contentClassName,
}: AuthLandingSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setRevealed(true);
        }
      },
      { threshold: 0.12, rootMargin: "-6% 0px -10% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-label={ariaLabel}
      className={cn(
        authLandingSectionShellClass,
        authLandingSectionToneClass(tone),
        align === "start" ? "justify-start" : "justify-center",
        "border-t border-border/25 first:border-t-0",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"
        aria-hidden
      />
      <div
        className={cn(
          "relative mx-auto w-full max-w-lg",
          authLandingFadeInClass,
          revealed ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
