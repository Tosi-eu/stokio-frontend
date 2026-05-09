"use client";

import { useSyncExternalStore } from "react";

function subscribeMinWidth(px: number, onStoreChange: () => void) {
  const mql = window.matchMedia(`(min-width: ${px}px)`);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

export function useMinWidth(px: number): boolean {
  return useSyncExternalStore(
    (cb) => subscribeMinWidth(px, cb),
    () => window.matchMedia(`(min-width: ${px}px)`).matches,
    () => false,
  );
}

export const STACK_BELOW_PX = { lg: 1024, xl: 1280 } as const;

export type StackBelowBreakpoint = keyof typeof STACK_BELOW_PX;
