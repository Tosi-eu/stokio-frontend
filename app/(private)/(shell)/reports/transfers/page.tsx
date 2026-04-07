"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const TransferReport = dynamic(() => import("@/pages/TransferReport"), {
  ssr: false,
});

export default function TransferReportPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando relatório..." />}>
      <ModuleRoute moduleKey="reports">
        <TransferReport />
      </ModuleRoute>
    </Suspense>
  );
}
