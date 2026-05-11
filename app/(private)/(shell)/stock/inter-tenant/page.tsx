"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { LoadingFallback } from "@/components/LoadingFallback";

const StockInterTenantTransfer = dynamic(
  () => import("@/pages/StockInterTenantTransfer"),
  { ssr: false },
);

export default function StockInterTenantRoutePage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando transferência…" />}>
      <StockInterTenantTransfer />
    </Suspense>
  );
}
