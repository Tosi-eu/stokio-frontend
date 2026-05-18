export const authStorage = {
  getUser: (): null => null,
  setUser: (_user: unknown): void => {
    void _user;
  },
  clearUser: (): void => undefined,

  getToken: (): string | null => null,
  setToken: (_token: string): void => {
    void _token;
  },
  clearToken: (): void => undefined,

  clearAll: (): void => undefined,
};
