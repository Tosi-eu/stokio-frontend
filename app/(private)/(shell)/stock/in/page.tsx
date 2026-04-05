"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const StockEntry = dynamic(() => import("@/pages/StockIn"), { ssr: false });

export default function StockInPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando entrada..." />}>
      <ModuleRoute moduleKey="stock">
        <StockEntry />
      </ModuleRoute>
    </Suspense>
  );
}
