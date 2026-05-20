"use client";

import { reportClientError } from "@/helpers/error-report.helper";
import { subscribeErrorReporting } from "@/helpers/analytics-loader.helper";
import { useEffect } from "react";

export function GlobalErrorListeners(): null {
  useEffect(() => {
    const onWindowError = (ev: ErrorEvent): void => {
      reportClientError(ev.error ?? ev.message, {
        context: {
          type: "window.onerror",
          filename: ev.filename,
          lineno: ev.lineno,
          colno: ev.colno,
        },
      });
    };

    const onUnhandledRejection = (ev: PromiseRejectionEvent): void => {
      reportClientError(ev.reason, {
        context: { type: "unhandledrejection" },
      });
    };

    const attach = (): (() => void) => {
      window.addEventListener("error", onWindowError);
      window.addEventListener("unhandledrejection", onUnhandledRejection);
      return () => {
        window.removeEventListener("error", onWindowError);
        window.removeEventListener("unhandledrejection", onUnhandledRejection);
      };
    };

    return subscribeErrorReporting(() => attach());
  }, []);

  return null;
}
