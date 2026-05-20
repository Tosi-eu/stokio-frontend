export const PREVIEW_UI_MODULE_KEYS = new Set([
  "dashboard",
  "movements",
  "medicines",
  "inputs",
  "stock",
  "residents",
  "cabinets",
  "drawers",
  "profile",
  "admin",
  "notifications",
  "reports",
  "audit",
  "medical_record_exports",
]);

export function isPreviewUiModuleKey(key: string): boolean {
  return PREVIEW_UI_MODULE_KEYS.has(key);
}
