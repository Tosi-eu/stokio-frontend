"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const Cabinets = dynamic(() => import("@/pages/Cabinets"), { ssr: false });

export default function CabinetsPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando armários..." />}>
      <ModuleRoute moduleKey="cabinets">
        <Cabinets />
      </ModuleRoute>
    </Suspense>
  );
}
