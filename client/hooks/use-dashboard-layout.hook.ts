import { useCallback, useEffect, useMemo, useState } from "react";
import type { DashboardWidgetId } from "@/constants/dashboard-widgets";
import {
  readDashboardLayout,
  writeDashboardLayout,
  type DashboardLayoutV1,
} from "@/helpers/dashboard-layout-storage";

export function useDashboardLayout(tenantId: number | null) {
  const [layout, setLayout] = useState<DashboardLayoutV1>(() =>
    readDashboardLayout(tenantId),
  );
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    setLayout(readDashboardLayout(tenantId));
  }, [tenantId]);

  const persist = useCallback(
    (next: DashboardLayoutV1) => {
      setLayout(next);
      writeDashboardLayout(tenantId, next);
    },
    [tenantId],
  );

  const isVisible = useCallback(
    (id: DashboardWidgetId) => !layout.hidden.includes(id),
    [layout.hidden],
  );

  const hide = useCallback(
    (id: DashboardWidgetId) => {
      if (layout.hidden.includes(id)) return;
      persist({ ...layout, hidden: [...layout.hidden, id] });
    },
    [layout, persist],
  );

  const show = useCallback(
    (id: DashboardWidgetId) => {
      persist({
        ...layout,
        hidden: layout.hidden.filter((h) => h !== id),
      });
    },
    [layout, persist],
  );

  const isWide = useCallback(
    (id: DashboardWidgetId) => Boolean(layout.wide[id]),
    [layout.wide],
  );

  const toggleWide = useCallback(
    (id: DashboardWidgetId) => {
      const nextWide = { ...layout.wide };
      if (nextWide[id]) delete nextWide[id];
      else nextWide[id] = true;
      persist({ ...layout, wide: nextWide });
    },
    [layout, persist],
  );

  const hiddenForPicker = useMemo(() => layout.hidden, [layout.hidden]);

  return useMemo(
    () => ({
      layout,
      editMode,
      setEditMode,
      isVisible,
      hide,
      show,
      isWide,
      toggleWide,
      hiddenForPicker,
    }),
    [
      layout,
      editMode,
      isVisible,
      hide,
      show,
      isWide,
      toggleWide,
      hiddenForPicker,
    ],
  );
}
