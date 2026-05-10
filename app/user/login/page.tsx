"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { AuthSuspenseFallback } from "@/components/auth/AuthSuspenseFallback";

const Auth = dynamic(() => import("@/pages/Auth"), { ssr: false });

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthSuspenseFallback title="Carregando login..." />}>
      <Auth />
    </Suspense>
  );
}
