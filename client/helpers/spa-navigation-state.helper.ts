const KEY = "__spa_nav_state_v1";

export function setSpaNavigationState(state: unknown): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private mode */
  }
}

export function consumeSpaNavigationState<T>(): T | undefined {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return undefined;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}
