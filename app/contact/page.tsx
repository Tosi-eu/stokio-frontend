"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { LoadingFallback } from "@/components/LoadingFallback";

const Auth = dynamic(() => import("@/pages/Auth"), { ssr: false });

export default function ContactPage() {
  return (
    <Suspense fallback={<LoadingFallback title="A carregar…" />}>
      <Auth scrollToSection="contact" />
    </Suspense>
  );
}
