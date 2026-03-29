import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
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
  const { isEnabled } = useTenant();
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

        <div className="flex-1 flex flex-col overflow-hidden">
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
