"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const StockOut = dynamic(() => import("@/pages/StockOut"), { ssr: false });

export default function StockOutPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando saída..." />}>
      <ModuleRoute moduleKey="stock">
        <StockOut />
      </ModuleRoute>
    </Suspense>
  );
}
