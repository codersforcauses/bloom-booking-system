"use client";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const api = axios.create({ baseURL: BACKEND_URL });

// Add in memory cache for access token to reduce cookie parsing
let inMemoryAccessToken: string | undefined = undefined;

// Helper function to get cookie by name
const getCookie = (name: string) => {
  return decodeURIComponent(
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="))
      ?.split("=")[1] ?? "",
  );
};

const getAccessToken = () => {
  if (typeof window === "undefined") return;
  if (inMemoryAccessToken) return inMemoryAccessToken;
  inMemoryAccessToken = getCookie("accessToken");
  return inMemoryAccessToken;
};

const setAccessToken = (accessToken: string) => {
  if (typeof window === "undefined") return;
  inMemoryAccessToken = accessToken;
  document.cookie = `accessToken=${encodeURIComponent(accessToken)}; path=/; SameSite=Lax`;
};

const getRefreshToken = () => {
  if (typeof window === "undefined") return;
  return getCookie("refreshToken");
};

const clearTokens = () => {
  if (typeof window === "undefined") return;
  const base = "path=/; SameSite=Lax";
  document.cookie = `accessToken=; Max-Age=0; ${base}`;
  document.cookie = `refreshToken=; Max-Age=0; ${base}`;
  inMemoryAccessToken = undefined;
};

// Handle concurrent API calls to refresh tokens
let isRefreshing = false;
let toBeRefreshedQueue: {
  resolve: (accessToken: string) => void;
  reject: (err: unknown) => void;
}[] = [];

const processQueue = (error: AxiosError | null, accessToken?: string) => {
  toBeRefreshedQueue.forEach((promise) =>
    error ? promise.reject(error) : promise.resolve(accessToken!),
  );
  toBeRefreshedQueue = [];
};

// Add bearer token if having access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = getAccessToken();

    if (accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Auto refresh when access token expires
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Prevent infinite loop
    if (error.config?.url?.includes("/users/refresh")) {
      logout();
      return Promise.reject(error);
    }

    // Continue only if 401 error and not already retried
    if (
      !error.config ||
      !error.response ||
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If there are API calls refreshing the token, add it to the queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        toBeRefreshedQueue.push({
          resolve: (accessToken: string) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token found");

      // IMPORTANT: use axios here to avoid interceptor loops
      const res = await axios.post(`${BACKEND_URL}/users/refresh/`, {
        refresh: refreshToken,
      });

      const newAccessToken = res.data.access;
      if (!newAccessToken) throw new Error("No access token returned");

      setAccessToken(newAccessToken);
      processQueue(null, newAccessToken);

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (err) {
      const error = err as AxiosError;
      processQueue(error);

      if (!error.response) {
        console.error("Network error during token refresh");
        return Promise.reject(error);
      }

      const status = error.response.status;

      if (status >= 500) {
        console.warn("Internal server error during token refresh");
        return Promise.reject(error);
      }

      logout();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

const logout = () => {
  clearTokens();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

export default api;
export { setAccessToken };
