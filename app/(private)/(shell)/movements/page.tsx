"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const Movements = dynamic(() => import("@/pages/Movements"), { ssr: false });

export default function MovementsPage() {
  return (
    <Suspense
      fallback={<LoadingFallback title="Carregando movimentações..." />}
    >
      <ModuleRoute moduleKey="movements">
        <Movements />
      </ModuleRoute>
    </Suspense>
  );
}
