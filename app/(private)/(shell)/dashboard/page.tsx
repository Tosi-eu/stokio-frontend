"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const Dashboard = dynamic(() => import("@/pages/Dashboard"), { ssr: false });

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando dashboard..." />}>
      <ModuleRoute moduleKey="dashboard">
        <Dashboard />
      </ModuleRoute>
    </Suspense>
  );
}
