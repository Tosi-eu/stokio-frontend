import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";

export const COL_WIDTH_MIN = 80;
export const COL_WIDTH_MAX = 800;

const STORAGE_PREFIX = "abrigo.tableWidths.";

export function clampColumnWidth(px: number): number {
  return Math.min(COL_WIDTH_MAX, Math.max(COL_WIDTH_MIN, px));
}

function parseStoredWidths(raw: string | null): Record<string, number> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed ?? {})) {
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isFinite(n) && n >= COL_WIDTH_MIN && n <= COL_WIDTH_MAX)
        next[k] = n;
    }
    return next;
  } catch {
    return {};
  }
}
export function usePersistedColumnWidths(storageSuffix: string) {
  const storageKey = `${STORAGE_PREFIX}${storageSuffix}`;

  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const colWidthsRef = useRef(colWidths);

  const pendingRef = useRef<Record<string, number>>({});
  const resizeRef = useRef<{
    key: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setColWidths(parseStoredWidths(window.localStorage.getItem(storageKey)));
  }, [storageKey]);

  useEffect(() => {
    colWidthsRef.current = colWidths;
  }, [colWidths]);

  const persistColWidths = useCallback(
    (next: Record<string, number>) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const startResize = useCallback(
    (key: string, e: ReactMouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const prev = colWidthsRef.current;
      const th = (e.currentTarget as HTMLElement).closest("th");
      const measured = th
        ? Math.max(COL_WIDTH_MIN, Math.floor(th.getBoundingClientRect().width))
        : 160;
      const startWidth = prev[key] ?? measured;
      resizeRef.current = { key, startX: e.clientX, startWidth };
      pendingRef.current = { ...prev };

      const onMove = (ev: MouseEvent) => {
        const st = resizeRef.current;
        if (!st) return;
        const dx = ev.clientX - st.startX;
        const nextW = clampColumnWidth(st.startWidth + dx);
        setColWidths((p) => {
          const next = { ...p, [st.key]: nextW };
          pendingRef.current = next;
          return next;
        });
      };

      const onUp = () => {
        resizeRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        persistColWidths(pendingRef.current);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [persistColWidths],
  );

  const resetColumnWidth = useCallback(
    (key: string, e: ReactMouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setColWidths((prev) => {
        const next = { ...prev };
        delete next[key];
        persistColWidths(next);
        return next;
      });
    },
    [persistColWidths],
  );

  const hasCustomWidths = useMemo(
    () => Object.keys(colWidths).length > 0,
    [colWidths],
  );

  return {
    colWidths,
    startResize,
    resetColumnWidth,
    hasCustomWidths,
  };
}
