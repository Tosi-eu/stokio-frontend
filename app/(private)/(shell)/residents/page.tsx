"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const Resident = dynamic(() => import("@/pages/Residents"), { ssr: false });

export default function ResidentsPage() {
  return (
    <Suspense
      fallback={<LoadingFallback title="Carregando residentes..." />}
    >
      <ModuleRoute moduleKey="residents">
        <Resident />
      </ModuleRoute>
    </Suspense>
  );
}
