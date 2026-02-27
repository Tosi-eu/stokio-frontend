export const authStorage = {
  getUser: () => {
    const user = sessionStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
  setUser: (user: unknown) => sessionStorage.setItem("user", JSON.stringify(user)),
  clearUser: () => sessionStorage.removeItem("user"),

  clearAll: () => {
    sessionStorage.removeItem("user");
  },
};
