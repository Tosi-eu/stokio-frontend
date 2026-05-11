"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth.hook";
import { useTenant } from "@/hooks/use-tenant.hook";
import { useNotifications } from "@/hooks/use-notification.hook";
import { VerticalLayout } from "@/components/VerticalLayout";
import { TenantSwitcherBar } from "@/components/tenant/TenantSwitcherBar";
import LogoutConfirmDialog from "@/components/LogoutConfirmDialog";
import { NotificationButton } from "@/components/NotificationButton";
import { NotificationDrawer } from "@/components/NotificationDrawer";
import { GlobalNotificationModals } from "@/components/GlobalNotificationModals";

export function AppShellLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { logout, user } = useAuth();
  const { isEnabled, previewMode } = useTenant();
  const { setOpen: setNotificationsOpen } = useNotifications();
  const showNotificationsUi = previewMode || isEnabled("notifications");

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!showNotificationsUi) setNotificationsOpen(false);
  }, [showNotificationsUi, setNotificationsOpen]);

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = () => {
    logout();
    router.push("/user/login");
  };

  const cancelLogout = () => setShowLogoutModal(false);

  return (
    <>
      <div className="h-screen flex bg-muted/30 text-foreground overflow-hidden">
        <VerticalLayout onLogout={handleLogout} />

        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {previewMode ? (
            <div
              role="status"
              className="shrink-0 border-b border-amber-200/80 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
            >
              <span className="font-medium">Modo de visualização.</span>{" "}
              Configure o abrigo{" "}
              <Link
                href="/tenant/onboarding"
                className="underline underline-offset-2 font-medium text-amber-900 dark:text-amber-50"
              >
                aqui
              </Link>
              .
            </div>
          ) : null}
          {user ? (
            <div className="shrink-0 flex flex-wrap items-center justify-end gap-3 px-4 py-2 border-b border-border/50 bg-card/50 backdrop-blur-sm">
              <TenantSwitcherBar />
            </div>
          ) : null}
          {children}
        </div>

        {showNotificationsUi ? (
          <>
            <NotificationButton />
            <NotificationDrawer />
            <GlobalNotificationModals />
          </>
        ) : null}
      </div>

      <LogoutConfirmDialog
        open={showLogoutModal}
        onCancel={cancelLogout}
        onConfirm={confirmLogout}
      />
    </>
  );
}
