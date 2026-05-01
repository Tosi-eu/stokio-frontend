import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { toast } from "@/hooks/use-toast.hook";
import { useTenant } from "@/hooks/use-tenant.hook";
import { useNotifications } from "@/hooks/use-notification.hook";
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix";
import {
  getTodayMedicineNotifications,
  getTomorrowReplacementNotifications,
  updateNotification,
} from "@/api/requests";
import type { NotificationListItem } from "@/api/types";
import type { StockReplacementItem } from "@/components/StockReplacementModal";

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
  const { open: notificationsDrawerOpen } = useNotifications();
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
    if (!notificationsDrawerOpen) return;
    async function fetchReminders() {
      try {
        const res = await getTodayMedicineNotifications();
        if (res.items.length > 0) {
          setNotifList(res.items);
          setNotifOpen(true);
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Não foi possível carregar as notificações do dia.";
        toast({
          title: "Erro ao carregar notificações",
          description: errorMessage,
          variant: "error",
          duration: 3000,
        });
      }
    }
    fetchReminders();
  }, [canFetch, notificationsDrawerOpen]);

  useEffect(() => {
    if (!canFetch) return;
    if (!notificationsDrawerOpen) return;
    async function fetchReplacementReminders() {
      try {
        const res = await getTomorrowReplacementNotifications();
        if (res.items.length > 0) {
          setReplacementItems(res.items);
          setReplacementOpen(true);
        }
      } catch {
        /* NO-OP */
      }
    }
    fetchReplacementReminders();
  }, [canFetch, notificationsDrawerOpen]);

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
