"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Pill,
  Bandage,
  Boxes,
  Users,
  Archive,
  Grid,
  User,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth.hook";
import { useTenant } from "@/hooks/use-tenant.hook";
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix";
import type { PermissionResourceKey } from "@/domain/permission-matrix.types";
import { APP_PUBLIC_NAME } from "@/constants/app-branding";
import { getDefaultHomePath } from "@/helpers/default-home-route.helper";
import { useTenantBrandLogoSrc } from "@/hooks/use-tenant-brand-logo-src.hook";
import { LocalBrandLogoImage } from "@/components/LocalBrandLogoImage";

const baseNavigationTabs = [
  {
    name: "Painel",
    href: "/dashboard",
    icon: LayoutDashboard,
    module: "dashboard",
  },
  { name: "Medicamentos", href: "/medicines", icon: Pill, module: "medicines" },
  { name: "Insumos", href: "/inputs", icon: Bandage, module: "inputs" },
  { name: "Estoque", href: "/stock", icon: Boxes, module: "stock" },
  { name: "Residentes", href: "/residents", icon: Users, module: "residents" },
  {
    name: "Armários",
    href: "/cabinets",
    icon: Archive,
    module: "cabinets",
  },
  {
    name: "Gavetas",
    href: "/drawers",
    icon: Grid,
    module: "drawers",
  },
  { name: "Perfil", href: "/user/profile", icon: User, module: "profile" },
];

interface SidebarProps {
  onLogout: () => void;
}

export function VerticalLayout({ onLogout }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { can } = usePermissionMatrix();
  const {
    tenant,
    isEnabled,
    loading: tenantLoading,
    previewMode,
  } = useTenant();
  const { displaySrc: sidebarLogoSrc, isLogoResolved } = useTenantBrandLogoSrc(
    tenant,
    { tenantConfigLoading: tenantLoading },
  );
  const isViewerTenant =
    (tenant?.slug ?? "").toLowerCase() === "viewer" || previewMode;
  const sidebarLogoToShow = isViewerTenant
    ? "/default_logo.png"
    : sidebarLogoSrc;
  const sidebarLogoReady = isViewerTenant ? true : isLogoResolved;

  const navigationTabs = [
    ...((previewMode || user?.role === "admin") && isEnabled("admin")
      ? [{ name: "Painel administrativo", href: "/admin", icon: ShieldCheck }]
      : []),
    ...baseNavigationTabs.filter((t) => {
      const mod = (t as { module?: string }).module;
      if (typeof mod !== "string") return true;
      if (!isEnabled(mod)) return false;
      return can(mod as PermissionResourceKey, "read");
    }),
  ];

  const homeHref =
    getDefaultHomePath(
      isEnabled,
      user,
      (m) => can(m as PermissionResourceKey, "read"),
      previewMode,
    ) ?? "/loading";

  return (
    <aside
      className="h-screen w-64 flex flex-col shrink-0 rounded-r-2xl border border-border/50 border-l-0 shadow-elevated bg-sidebar bg-gradient-to-b from-sidebar via-sidebar to-background/25 overflow-hidden"
      aria-label="Navegação principal"
    >
      <div className="h-36 shrink-0 flex items-center justify-center px-4 border-b border-border/50 bg-brand-hero shadow-[inset_0_-1px_0_0_hsl(214_22%_88%/0.5)]">
        <button
          type="button"
          onClick={() => router.push(homeHref)}
          className="cursor-pointer rounded-xl p-2 transition-all hover:opacity-95 hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Ir para o início"
        >
          {sidebarLogoReady && sidebarLogoToShow ? (
            sidebarLogoToShow === "/default_logo.png" ? (
              <LocalBrandLogoImage
                key={sidebarLogoToShow}
                alt={tenant?.brandName || tenant?.name || APP_PUBLIC_NAME}
              />
            ) : (
              <img
                key={sidebarLogoToShow}
                src={sidebarLogoToShow}
                alt={tenant?.brandName || tenant?.name || APP_PUBLIC_NAME}
                className="h-32 w-auto max-w-[200px] object-contain drop-shadow-sm"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.endsWith("/default_logo.png")) return;
                  target.src = "/default_logo.png";
                }}
              />
            )
          ) : (
            <div className="h-32 w-[200px] shrink-0" aria-busy={true} />
          )}
        </button>
      </div>

      <nav
        className="flex-1 overflow-y-auto px-2 py-4 space-y-1"
        aria-label="Menu de navegação"
      >
        {navigationTabs.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== homeHref && pathname.startsWith(item.href));

          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                ${
                  isActive
                    ? "bg-primary/12 text-primary shadow-sm border border-primary/15"
                    : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="p-3 border-t border-border/50 bg-background/50 backdrop-blur-sm space-y-2">
          <p
            className="px-3 py-1 text-xs text-muted-foreground truncate"
            title={user.login}
          >
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`.trim()
              : (user.login ?? "Usuário")}
          </p>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:ring-offset-2"
            aria-label="Sair da conta"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      )}
    </aside>
  );
}
