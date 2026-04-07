"use client";

import { useAuth } from "@/hooks/use-auth.hook";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace("/user/login");
  }, [user, router]);

  if (!user) return null;
  return <>{children}</>;
}
