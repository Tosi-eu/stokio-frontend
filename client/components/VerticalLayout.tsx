import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Pill,
  FlaskConical,
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
import { APP_PUBLIC_NAME } from "@/constants/app-branding";
import { getDefaultHomePath } from "@/helpers/default-home-route.helper";
import { useTenantBrandLogoSrc } from "@/hooks/use-tenant-brand-logo-src.hook";

const baseNavigationTabs = [
  {
    name: "Painel",
    href: "/dashboard",
    icon: LayoutDashboard,
    module: "dashboard",
  },
  {
    name: "Movimentações",
    href: "/movements",
    icon: ArrowLeftRight,
    module: "movements",
  },
  { name: "Medicamentos", href: "/medicines", icon: Pill, module: "medicines" },
  { name: "Insumos", href: "/inputs", icon: FlaskConical, module: "inputs" },
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
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant, isEnabled, loading: tenantLoading } = useTenant();
  const { displaySrc: sidebarLogoSrc, isLogoResolved } = useTenantBrandLogoSrc(
    tenant,
    { tenantConfigLoading: tenantLoading },
  );

  const navigationTabs = [
    ...(user?.role === "admin" && isEnabled("admin")
      ? [{ name: "Painel administrativo", href: "/admin", icon: ShieldCheck }]
      : []),
    ...baseNavigationTabs.filter((t) =>
      typeof (t as { module?: string }).module === "string"
        ? isEnabled((t as { module: string }).module)
        : true,
    ),
  ];

  const homeHref = getDefaultHomePath(isEnabled, user) ?? "/loading";

  return (
    <aside
      className="h-screen w-64 flex flex-col border-r border-sidebar-border bg-sidebar bg-gradient-to-b from-sidebar via-background/30 to-sidebar"
      aria-label="Navegação principal"
    >
      <div className="h-36 shrink-0 flex items-center justify-center px-4 border-b border-sidebar-border bg-brand-hero shadow-[inset_0_-1px_0_0_hsl(160_20%_90%/0.6)]">
        <button
          type="button"
          onClick={() => navigate(homeHref)}
          className="cursor-pointer rounded-xl p-2 transition-all hover:opacity-95 hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Ir para o início"
        >
          {isLogoResolved && sidebarLogoSrc ? (
            <img
              key={sidebarLogoSrc}
              src={sidebarLogoSrc}
              alt={tenant?.brandName || tenant?.name || APP_PUBLIC_NAME}
              className="h-32 w-auto max-w-[200px] object-contain drop-shadow-sm"
              referrerPolicy="no-referrer"
            />
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
            location.pathname === item.href ||
            (item.href !== homeHref && location.pathname.startsWith(item.href));

          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
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
        <div className="p-3 border-t border-sidebar-border bg-background/40 backdrop-blur-[2px] space-y-2">
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
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
