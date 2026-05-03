import { useEffect, useMemo, useState, lazy, Suspense } from "react";
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

const NotificationReminderModal = lazy(() =>
  import("@/components/NotificationModal").then((m) => ({
    default: m.default,
  })),
);
const StockReplacementModal = lazy(() =>
  import("@/components/StockReplacementModal").then((m) => ({
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

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState<NotificationListItem[]>([]);
  const [replacementOpen, setReplacementOpen] = useState(false);
  const [replacementItems, setReplacementItems] = useState<
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

      if (todayOutcome.status === "fulfilled") {
        const res = todayOutcome.value;
        if (res.items.length > 0) {
          setNotifList(res.items);
          setNotifOpen(true);
        }
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

      if (
        tomorrowOutcome.status === "fulfilled" &&
        tomorrowOutcome.value.items.length > 0
      ) {
        setReplacementItems(tomorrowOutcome.value.items);
        setReplacementOpen(true);
      }
    }
    void loadStartupReminders();
    return () => {
      cancelled = true;
    };
  }, [canFetch]);

  return (
    <Suspense fallback={null}>
      <NotificationReminderModal
        open={notifOpen}
        events={notifList}
        onClose={() => {
          if (notifList.length > 0) {
            Promise.all(
              notifList.map((n) => updateNotification(n.id, { visto: true })),
            ).catch(() => {});
          }
          setNotifOpen(false);
        }}
      />
      <StockReplacementModal
        open={replacementOpen}
        items={replacementItems}
        onClose={() => {
          if (replacementItems.length > 0) {
            Promise.all(
              replacementItems.map((n) =>
                updateNotification(n.id, { visto: true }),
              ),
            ).catch(() => {});
          }
          setReplacementOpen(false);
        }}
      />
    </Suspense>
  );
}
