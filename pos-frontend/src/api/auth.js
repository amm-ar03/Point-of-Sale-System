import { http, jsonBody, setAuth, clearAuth } from "./client";

export async function login(username, password) {
  setAuth(username, password);
  try {
    return await http("/auth/me");
  } catch (e) {
    clearAuth();
    throw e;
  }
}

export const logout = clearAuth;
export const listUsers = () => http("/users");
export const createUser = (u) => http("/users", jsonBody("POST", u));
export const setUserActive = (id, active) => http(`/users/${id}/active`, jsonBody("PUT", { active }));