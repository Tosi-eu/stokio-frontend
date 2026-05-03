"use client";

import { useAuth } from "@/hooks/use-auth.hook";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace("/user/login");
    else router.replace("/loading");
  }, [user, router]);

  return null;
}
