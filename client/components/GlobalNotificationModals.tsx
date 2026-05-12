import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast.hook";
import { useTenant } from "@/hooks/use-tenant.hook";
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix";
import {
  getTodayMedicineNotifications,
  getTomorrowReplacementNotifications,
  updateNotification,
} from "@/api/requests";
import type { NotificationListItem } from "@/api/types";
import type { StockReplacementItem } from "@/components/StockReplacementModal";
import { getErrorMessage } from "@/helpers/validation.helper";

const StartupRemindersModal = lazy(() =>
  import("@/components/StartupRemindersModal").then((m) => ({
    default: m.default,
  })),
);

export function GlobalNotificationModals() {
  const { previewMode, isEnabled } = useTenant();
  const { can } = usePermissionMatrix();

  const canFetch = useMemo(() => {
    if (previewMode) return false;
    if (!isEnabled("notifications")) return false;
    return can("notifications", "read");
  }, [can, isEnabled, previewMode]);

  const [startupOpen, setStartupOpen] = useState(false);
  const [medicineList, setMedicineList] = useState<NotificationListItem[]>([]);
  const [replacementList, setReplacementList] = useState<
    StockReplacementItem[]
  >([]);

  useEffect(() => {
    if (!canFetch) return;
    let cancelled = false;
    async function loadStartupReminders() {
      const [todayOutcome, tomorrowOutcome] = await Promise.allSettled([
        getTodayMedicineNotifications(),
        getTomorrowReplacementNotifications(),
      ]);
      if (cancelled) return;

      let med: NotificationListItem[] = [];
      let rep: StockReplacementItem[] = [];

      if (todayOutcome.status === "fulfilled") {
        med = todayOutcome.value.items;
      } else {
        const err = todayOutcome.reason;
        const errorMessage = getErrorMessage(
          err,
          "Não foi possível carregar as notificações do dia.",
          "GlobalNotificationModals:today",
        );
        toast({
          title: "Erro ao carregar notificações",
          description: errorMessage,
          variant: "error",
          duration: 3000,
        });
      }

      if (tomorrowOutcome.status === "fulfilled") {
        rep = tomorrowOutcome.value.items;
      }

      if (cancelled) return;

      if (med.length > 0 || rep.length > 0) {
        setMedicineList(med);
        setReplacementList(rep);
        setStartupOpen(true);
      }
    }
    void loadStartupReminders();
    return () => {
      cancelled = true;
    };
  }, [canFetch]);

  const markAllSeenAndClose = () => {
    const ids = [
      ...new Set([
        ...medicineList.map((n) => n.id),
        ...replacementList.map((n) => n.id),
      ]),
    ];
    if (ids.length > 0) {
      Promise.all(
        ids.map((id) => updateNotification(id, { visto: true })),
      ).catch(() => {});
    }
    setStartupOpen(false);
  };

  return (
    <Suspense fallback={null}>
      <StartupRemindersModal
        open={startupOpen}
        medicineEvents={medicineList}
        replacementItems={replacementList}
        onClose={markAllSeenAndClose}
      />
    </Suspense>
  );
}
