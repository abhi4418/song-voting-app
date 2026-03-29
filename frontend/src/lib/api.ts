const DEFAULT_BACKEND_URL = "http://localhost:3001";

export const AUTH_STORAGE_KEY = "song-voting-auth-token";
export const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND_URL).replace(
  /\/$/,
  ""
);

type ApiRequestOptions = RequestInit & {
  json?: unknown;
  token?: string | null;
};

const isBrowser = () => typeof window !== "undefined";

export const getStoredToken = () => {
  if (!isBrowser()) {
    return null;
  }

  return window.sessionStorage.getItem(AUTH_STORAGE_KEY);
};

export const setStoredToken = (token: string) => {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.setItem(AUTH_STORAGE_KEY, token);
};

export const clearStoredToken = () => {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
};

export const withBearerToken = (token?: string | null) => {
  if (!token) {
    return undefined;
  }

  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { json, token, headers, ...init } = options;
  const authorization = withBearerToken(token);
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(authorization ? { Authorization: authorization } : {}),
      ...(headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : init.body,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message ?? "Request failed");
  }

  return data as T;
}
