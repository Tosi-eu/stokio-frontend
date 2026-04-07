import { AppShellLayout } from "@/components/AppShellLayout";
import type { ReactNode } from "react";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
