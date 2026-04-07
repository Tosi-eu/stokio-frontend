export const PREVIEW_MODE_STORAGE_KEY = "abrigo.previewMode";

export function setPreviewModeStorage(active: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (active) sessionStorage.setItem(PREVIEW_MODE_STORAGE_KEY, "1");
    else sessionStorage.removeItem(PREVIEW_MODE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function readPreviewModeFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(PREVIEW_MODE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}
