import { useNavigate, Link } from "react-router-dom";
import { LayoutProps } from "@/interfaces/interfaces";
import { useAuth } from "@/hooks/use-auth.hook";
import { useState } from "react";
import LogoutConfirmDialog from "./LogoutConfirmDialog";
import { ChevronRight } from "lucide-react";

export default function Layout({
  children,
  title,
  breadcrumb,
  minimal = false,
}: LayoutProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
      {(breadcrumb?.length || title) && (
        <div className="shrink-0 border-b border-border/70 bg-card/85 backdrop-blur-md shadow-sm">
          <div className="max-w-[1651px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {breadcrumb && breadcrumb.length > 0 && (
              <nav
                aria-label="Navegação"
                className="flex items-center gap-1 text-sm text-muted-foreground mb-1"
              >
                {breadcrumb.map((item, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                    )}
                    {item.path ? (
                      <Link
                        to={item.path}
                        className="hover:text-primary transition-colors"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-foreground font-medium">
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

      <main className="min-h-0 flex-1 overflow-y-auto" role="main">
        <div className="max-w-[1651px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
