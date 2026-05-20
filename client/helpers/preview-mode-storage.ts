let previewModeActive = false;

export function setPreviewModeStorage(active: boolean): void {
  previewModeActive = active;
}

export function readPreviewModeFromStorage(): boolean {
  return previewModeActive;
}
