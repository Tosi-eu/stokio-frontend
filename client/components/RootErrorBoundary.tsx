"use client";

import { reportClientError } from "@/helpers/error-report.helper";
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportClientError(error, {
      category: "unknown",
      context: {
        errorBoundary: true,
        componentStack: info.componentStack?.slice(0, 2000),
      },
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-center">
          <h1 className="text-lg font-semibold">Algo correu mal</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            O erro foi registado. Atualize a página ou volte mais tarde.
          </p>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Atualizar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
