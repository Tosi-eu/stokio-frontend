const HOME_ROUTE_CANDIDATES: { module: string; path: string }[] = [
  { module: "dashboard", path: "/dashboard" },
  { module: "admin", path: "/admin" },
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
  canReadModule?: (moduleKey: string) => boolean,
  previewMode?: boolean,
): string | null {
  const readable = (moduleKey: string) =>
    canReadModule ? canReadModule(moduleKey) : true;

  for (const { module, path } of HOME_ROUTE_CANDIDATES) {
    if (module === "admin") {
      if (!isEnabled("admin")) continue;
      if (previewMode) return path;
      if (user?.role === "admin") return path;
      continue;
    }
    if (isEnabled(module) && readable(module)) return path;
  }
  return null;
}
