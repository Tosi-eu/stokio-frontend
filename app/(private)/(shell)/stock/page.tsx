"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const Stock = dynamic(() => import("@/pages/Stock"), { ssr: false });

export default function StockPage() {
  return (
    <ModuleRoute moduleKey="stock">
      <Suspense fallback={<LoadingFallback title="Carregando estoque..." />}>
        <Stock />
      </Suspense>
    </ModuleRoute>
  );
}
