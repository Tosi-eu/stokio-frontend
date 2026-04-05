"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { LoadingFallback } from "@/components/LoadingFallback";

const Auth = dynamic(() => import("@/pages/Auth"), { ssr: false });

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando login..." />}>
      <Auth />
    </Suspense>
  );
}
