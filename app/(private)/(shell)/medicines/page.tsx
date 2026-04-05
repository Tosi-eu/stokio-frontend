"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const Medicines = dynamic(() => import("@/pages/Medicines"), { ssr: false });

export default function MedicinesPage() {
  return (
    <Suspense
      fallback={<LoadingFallback title="Carregando medicamentos..." />}
    >
      <ModuleRoute moduleKey="medicines">
        <Medicines />
      </ModuleRoute>
    </Suspense>
  );
}
