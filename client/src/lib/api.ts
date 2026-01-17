"use client";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import type { RefreshResponse } from "./apiTypes";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error(
    "Backend URL is not defined. Please set NEXT_PUBLIC_BACKEND_URL environment variable.",
  );
}

const api = axios.create({ baseURL: BACKEND_URL });

const getAccessToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

const setAccessToken = (accessToken: string) =>
  typeof window !== "undefined"
    ? localStorage.setItem("accessToken", accessToken)
    : null;

const getRefreshToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

const clearTokens = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

// Handle concurrent API calls to refresh tokens
let isRefreshing = false;
let toBeRefreshedQueue: {
  resolve: (accessToken: string) => void;
  reject: (err: unknown) => void;
}[] = [];

const processQueue = (
  error: AxiosError | Error | null,
  accessToken?: string,
) => {
  toBeRefreshedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (typeof accessToken === "string") {
      promise.resolve(accessToken);
    } else {
      promise.reject(
        new Error("Access token is missing while processing queue"),
      );
    }
  });
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
    if (error.config?.url?.includes("/users/refresh"))
      return handleEarlyLogout("Token refresh failed", error);

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
      if (!refreshToken) {
        console.warn("No refresh token available, logging out");
        return handleEarlyLogout("No refresh token available");
      }

      // IMPORTANT: use axios here to avoid interceptor loops
      // CHANGED: type the refresh response
      const res = await axios.post<RefreshResponse>(
        `${BACKEND_URL}/users/refresh/`,
        { refresh: refreshToken },
      );

      const newAccessToken = res.data.access;
      if (!newAccessToken) {
        console.warn("No access token returned, logging out");
        return handleEarlyLogout("No access token returned");
      }

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

// Helper function to handle refresh failure
const handleEarlyLogout = (errMsg: string, err?: AxiosError) => {
  isRefreshing = false;
  processQueue(new Error(errMsg));
  logout();
  return Promise.reject(err || new Error(errMsg));
};

const logout = () => {
  clearTokens();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

export default api;
export { setAccessToken };

// Helper functions for typed API calls
export async function apiGet<T>(url: string, config?: object): Promise<T> {
  const res = await api.get<T>(url, config);
  return res.data;
}

export async function apiPost<T, B = unknown>(
  url: string,
  body?: B,
  config?: object,
): Promise<T> {
  const res = await api.post<T>(url, body, config);
  return res.data;
}
