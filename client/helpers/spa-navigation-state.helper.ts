let pendingState: unknown;

export function setSpaNavigationState(state: unknown): void {
  pendingState = state;
}

export function consumeSpaNavigationState<T>(): T | undefined {
  if (pendingState === undefined) return undefined;
  const value = pendingState as T;
  pendingState = undefined;
  return value;
}
