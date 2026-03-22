import { useNavigate, Link } from "react-router-dom";
import { LayoutProps } from "@/interfaces/interfaces";
import { useAuth } from "@/hooks/use-auth.hook";
import { useState, useEffect } from "react";
import LogoutConfirmDialog from "./LogoutConfirmDialog";
import { NotificationButton } from "@/components/NotificationButton";
import { NotificationDrawer } from "./NotificationDrawer";
import { GlobalNotificationModals } from "./GlobalNotificationModals";
import { VerticalLayout } from "./VerticalLayout";
import { ChevronRight } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant.hook";
import { useNotifications } from "@/hooks/use-notification.hook";

export default function Layout({
  children,
  title,
  breadcrumb,
  minimal = false,
}: LayoutProps) {
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

  if (minimal) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <header className="shrink-0 flex justify-end items-center px-4 sm:px-6 py-3 border-b border-border/80 bg-card/80 backdrop-blur-md">
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-muted-foreground hover:text-primary font-medium transition-colors"
          >
            Sair
          </button>
        </header>
        <main className="flex-1 overflow-y-auto" role="main">
          <div className="max-w-[1651px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
        <LogoutConfirmDialog
          open={showLogoutModal}
          onCancel={cancelLogout}
          onConfirm={confirmLogout}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      <VerticalLayout onLogout={handleLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {(breadcrumb?.length || title) && (
          <div className="shrink-0 border-b border-border/70 bg-card/85 backdrop-blur-md shadow-sm">
            <div className="max-w-[1651px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
              {breadcrumb && breadcrumb.length > 0 && (
                <nav
                  aria-label="Navegação"
                  className="flex items-center gap-1 text-sm text-slate-500 mb-1"
                >
                  {breadcrumb.map((item, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && (
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      )}
                      {item.path ? (
                        <Link
                          to={item.path}
                          className="hover:text-primary transition-colors"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span className="text-slate-700 font-medium">
                          {item.label}
                        </span>
                      )}
                    </span>
                  ))}
                </nav>
              )}
              {title && (
                <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">
                  {title}
                </h1>
              )}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto" role="main">
          <div className="max-w-[1651px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      {showNotificationsUi ? (
        <>
          <NotificationButton />
          <NotificationDrawer />
          <GlobalNotificationModals />
        </>
      ) : null}

      <LogoutConfirmDialog
        open={showLogoutModal}
        onCancel={cancelLogout}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
