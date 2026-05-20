import { useToast } from "@/hooks/use-toast.hook";
import { ERROR_MESSAGES } from "@/constants/app.constants";
import { sanitizeUserFacingMessage } from "@/helpers/user-facing-error.helper";
import { useCallback } from "react";

interface ErrorHandlerOptions {
  defaultTitle?: string;
  showDetails?: boolean;
  logError?: boolean;
}

export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      const {
        defaultTitle = "Erro",
        showDetails = true,
        logError = true,
      } = options;

      if (logError) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error:", error);
        }
      }

      let message: string = ERROR_MESSAGES.GENERIC;
      let title: string = defaultTitle;

      if (error instanceof Error) {
        message = showDetails
          ? sanitizeUserFacingMessage(error.message)
          : ERROR_MESSAGES.GENERIC;
      } else if (typeof error === "string") {
        message = sanitizeUserFacingMessage(error);
      }

      if (message.includes("network") || message.includes("fetch")) {
        message = ERROR_MESSAGES.NETWORK;
        title = "Erro de Conexão";
      } else if (message.includes("401") || message.includes("unauthorized")) {
        message = ERROR_MESSAGES.UNAUTHORIZED;
        title = "Sessão Expirada";
      } else if (message.includes("404") || message.includes("not found")) {
        message = ERROR_MESSAGES.NOT_FOUND;
        title = "Não Encontrado";
      } else if (
        message.includes("validation") ||
        message.includes("invalid")
      ) {
        title = "Erro de Validação";
      }

      toast({
        title,
        description: message,
        variant: "error",
        duration: 3000,
      });

      return { title, message };
    },
    [toast],
  );

  return { handleError };
}
