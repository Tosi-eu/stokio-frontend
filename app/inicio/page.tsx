"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function InicioRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/loading");
  }, [router]);

  return null;
}
