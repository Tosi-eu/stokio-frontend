"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { logout } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = () => {
    logout();
    router.push("/user/login");
  };

  const cancelLogout = () => setShowLogoutModal(false);

  if (minimal) {
    return (
      <div className="min-h-screen flex flex-col bg-brand-mesh text-foreground">
        <header className="shrink-0 flex justify-end items-center px-4 sm:px-6 py-3.5 border-b border-border/60 bg-card/90 backdrop-blur-md shadow-sm">
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-muted-foreground hover:text-primary font-medium transition-colors rounded-lg px-2 py-1 hover:bg-accent/60"
          >
            Sair
          </button>
        </header>
        <main className="flex-1 overflow-y-auto bg-brand-mesh" role="main">
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
        <header className="shrink-0 relative border-b border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.06] backdrop-blur-md shadow-sm">
          <div
            className="absolute inset-x-0 bottom-0 h-px bg-brand-strip opacity-[0.35]"
            aria-hidden
          />
          <div className="max-w-[1651px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
            {breadcrumb && breadcrumb.length > 0 && (
              <nav
                aria-label="Navegação"
                className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-2"
              >
                {breadcrumb.map((item, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    )}
                    {item.path ? (
                      <Link
                        href={item.path}
                        className="rounded-md px-1 -mx-1 hover:text-primary hover:bg-primary/5 transition-colors"
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
              <h1 className="font-display text-3xl sm:text-[1.75rem] font-semibold text-foreground tracking-tight text-balance">
                {title}
              </h1>
            )}
          </div>
        </header>
      )}

      <main
        className="min-h-0 flex-1 overflow-y-auto bg-brand-mesh"
        role="main"
      >
        <div className="max-w-[1651px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
