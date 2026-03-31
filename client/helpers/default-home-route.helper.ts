const HOME_ROUTE_CANDIDATES: { module: string; path: string }[] = [
  { module: "dashboard", path: "/dashboard" },
  { module: "admin", path: "/admin" },
  { module: "movements", path: "/movements" },
  { module: "medicines", path: "/medicines" },
  { module: "inputs", path: "/inputs" },
  { module: "stock", path: "/stock" },
  { module: "residents", path: "/residents" },
  { module: "cabinets", path: "/cabinets" },
  { module: "drawers", path: "/drawers" },
  { module: "reports", path: "/reports/transfers" },
  { module: "profile", path: "/user/profile" },
];

type UserContext = {
  role?: "user" | "admin";
};

export function getDefaultHomePath(
  isEnabled: (key: string) => boolean,
  user: UserContext | null,
): string | null {
  for (const { module, path } of HOME_ROUTE_CANDIDATES) {
    if (module === "admin") {
      if (user?.role === "admin" && isEnabled("admin")) return path;
      continue;
    }
    if (isEnabled(module)) return path;
  }
  return null;
}
