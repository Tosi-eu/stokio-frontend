import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getDisplayConfig } from "@/api/requests";
import {
  DEFAULT_UI_DISPLAY,
  type UiDisplayConfig,
} from "@/helpers/ui-display.helper";
import { useAuth } from "@/hooks/use-auth.hook";

type UiDisplayContextValue = {
  uiDisplay: UiDisplayConfig;
  loading: boolean;
  refetch: () => Promise<void>;
};

const UiDisplayContext = createContext<UiDisplayContextValue | undefined>(
  undefined,
);

export function UiDisplayProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [uiDisplay, setUiDisplay] =
    useState<UiDisplayConfig>(DEFAULT_UI_DISPLAY);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!user) {
      setUiDisplay(DEFAULT_UI_DISPLAY);
      return;
    }
    setLoading(true);
    try {
      const { uiDisplay: next } = await getDisplayConfig();
      setUiDisplay({ ...DEFAULT_UI_DISPLAY, ...next });
    } catch {
      setUiDisplay(DEFAULT_UI_DISPLAY);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const onUpdated = () => {
      void refetch();
    };
    window.addEventListener("ui-display-updated", onUpdated);
    return () => window.removeEventListener("ui-display-updated", onUpdated);
  }, [refetch]);

  const value = useMemo(
    () => ({ uiDisplay, loading, refetch }),
    [uiDisplay, loading, refetch],
  );

  return (
    <UiDisplayContext.Provider value={value}>
      {children}
    </UiDisplayContext.Provider>
  );
}

export function useUiDisplay(): UiDisplayContextValue {
  const ctx = useContext(UiDisplayContext);
  if (!ctx)
    throw new Error("useUiDisplay must be used within UiDisplayProvider");
  return ctx;
}
