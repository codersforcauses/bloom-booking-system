"use client";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const api = axios.create({ baseURL: BACKEND_URL });

// If access token & refresh token in localStorage
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

const processQueue = (error: unknown, accessToken?: string) => {
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

    // Send refresh request
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

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
  window.location.href = "/login";
};

export default api;
