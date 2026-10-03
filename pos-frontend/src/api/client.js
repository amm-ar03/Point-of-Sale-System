const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

let authHeader = null;
export const setAuth = (username, password) => {
  authHeader = "Basic " + btoa(`${username}:${password}`);
};
export const clearAuth = () => { authHeader = null; };

export async function http(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...(options.headers ?? {}), ...(authHeader ? { Authorization: authHeader } : {}) },
  });
  if (res.status === 401) throw new Error("Invalid credentials or session expired");
  if (res.status === 403) throw new Error("You don't have permission to do that");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const jsonBody = (method, data) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});