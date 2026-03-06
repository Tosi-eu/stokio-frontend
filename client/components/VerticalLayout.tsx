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

const baseNavigationTabs = [
  { name: "Painel", href: "/dashboard", icon: LayoutDashboard },
  { name: "Movimentações", href: "/movements", icon: ArrowLeftRight },
  { name: "Medicamentos", href: "/medicines", icon: Pill },
  { name: "Insumos", href: "/inputs", icon: FlaskConical },
  { name: "Estoque", href: "/stock", icon: Boxes },
  { name: "Residentes", href: "/residents", icon: Users },
  { name: "Armários", href: "/cabinets", icon: Archive },
  { name: "Gavetas", href: "/drawers", icon: Grid },
  { name: "Perfil", href: "/user/profile", icon: User },
];

interface SidebarProps {
  onLogout: () => void;
}

export function VerticalLayout({ onLogout }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navigationTabs = [
    ...(user?.role === "admin"
      ? [{ name: "Painel administrativo", href: "/admin", icon: ShieldCheck }]
      : []),
    ...baseNavigationTabs,
  ];

  return (
    <aside
      className="h-screen w-64 flex flex-col border-r border-sky-200 bg-sky-50"
      aria-label="Navegação principal"
    >
      <div className="h-24 shrink-0 flex items-center justify-center px-4 border-b border-sky-200 bg-sky-100">
        <button
          onClick={() => navigate("/dashboard")}
          className="cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 rounded"
          aria-label="Ir para o painel principal"
        >
          <img
            src="/logo.png"
            alt="Logo Abrigo Helena Dornfeld"
            className="h-24 w-auto"
          />
        </button>
      </div>

      <nav
        className="flex-1 overflow-y-auto px-2 py-4 space-y-1"
        aria-label="Menu de navegação"
      >
        {navigationTabs.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/dashboard" &&
              location.pathname.startsWith(item.href));

          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2
                ${
                  isActive
                    ? "bg-sky-200 text-sky-900 shadow-sm"
                    : "text-slate-700 hover:bg-sky-100 hover:text-sky-900"
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
        <div className="p-3 border-t border-sky-200 space-y-2">
          <p
            className="px-3 py-1 text-xs text-slate-500 truncate"
            title={user.login}
          >
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`.trim()
              : user.login ?? "Usuário"}
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
