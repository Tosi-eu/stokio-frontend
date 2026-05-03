"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { LoadingFallback } from "@/components/LoadingFallback";

const ForgotPassword = dynamic(() => import("@/pages/ForgotPassword"), {
  ssr: false,
});

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando..." />}>
      <ForgotPassword />
    </Suspense>
  );
}
