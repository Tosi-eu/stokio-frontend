export const authStorage = {
  getUser: () => {
    const user = sessionStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
  setUser: (user: unknown) =>
    sessionStorage.setItem("user", JSON.stringify(user)),
  clearUser: () => sessionStorage.removeItem("user"),

  getToken: (): string | null => {
    const token = sessionStorage.getItem("authToken");
    return token && token.trim() ? token : null;
  },
  setToken: (token: string) => sessionStorage.setItem("authToken", token),
  clearToken: () => sessionStorage.removeItem("authToken"),

  clearAll: () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("authToken");
  },
};
