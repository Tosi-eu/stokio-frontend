"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { LoadingFallback } from "@/components/LoadingFallback";

const PostLoginRedirect = dynamic(() => import("@/pages/PostLoginRedirect"), {
  ssr: false,
});

export default function LoadingRoutePage() {
  return (
    <Suspense fallback={<LoadingFallback title="A carregar…" />}>
      <PostLoginRedirect />
    </Suspense>
  );
}
