import { useEffect, useState, lazy, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth.hook";
import { toast } from "@/hooks/use-toast.hook";
import {
  getTodayMedicineNotifications,
  getTomorrowReplacementNotifications,
  updateNotification,
} from "@/api/requests";
import type { NotificationListItem } from "@/api/types";
import type { StockReplacementItem } from "@/components/StockReplacementModal";

const NotificationReminderModal = lazy(() =>
  import("@/components/NotificationModal").then((m) => ({ default: m.default })),
);
const StockReplacementModal = lazy(() =>
  import("@/components/StockReplacementModal").then((m) => ({
    default: m.default,
  })),
);

export function GlobalNotificationModals() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState<NotificationListItem[]>([]);
  const [replacementOpen, setReplacementOpen] = useState(false);
  const [replacementItems, setReplacementItems] = useState<
    StockReplacementItem[]
  >([]);

  useEffect(() => {
    if (!isAdmin) return;
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
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
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
  }, [isAdmin]);

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
