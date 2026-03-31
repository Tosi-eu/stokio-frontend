import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.hook";
import { useTenant } from "@/hooks/use-tenant.hook";
import { useNotifications } from "@/hooks/use-notification.hook";
import { VerticalLayout } from "@/components/VerticalLayout";
import LogoutConfirmDialog from "@/components/LogoutConfirmDialog";
import { NotificationButton } from "@/components/NotificationButton";
import { NotificationDrawer } from "@/components/NotificationDrawer";
import { GlobalNotificationModals } from "@/components/GlobalNotificationModals";

export function AppShellLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isEnabled, previewMode } = useTenant();
  const { setOpen: setNotificationsOpen } = useNotifications();
  const showNotificationsUi = isEnabled("notifications");

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!showNotificationsUi) setNotificationsOpen(false);
  }, [showNotificationsUi, setNotificationsOpen]);

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = () => {
    logout();
    navigate("/user/login");
  };

  const cancelLogout = () => setShowLogoutModal(false);

  return (
    <>
      <div className="h-screen flex bg-background text-foreground overflow-hidden">
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
                to="/tenant/onboarding"
                className="underline underline-offset-2 font-medium text-amber-900 dark:text-amber-50"
              >
                aqui
              </Link>
              .
            </div>
          ) : null}
          <Outlet />
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
