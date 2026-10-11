import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Main Axios Instance
export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // cookie (refresh token) automatic send korbe
});

// Request Interceptor
// Har request e access token header e add korbe
axiosInstance.interceptors.request.use((config) => {
  // Zustand store theke token nibo — circular import avoid korte dynamic import
  const token =
    typeof window !== "undefined"
      ? window.__authToken // authStore set korbe ei global
      : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor
// 401 aile → refresh token diye notun access token nao → retry
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // 401 + already retry kora ni + refresh endpoint na
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        // Already refreshing — queue e rakho
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Cookie e thaka refresh token diye new access token nao
        const { data } = await axiosInstance.post("/auth/refresh");
        const newToken = data.data.accessToken;

        // Global e set koro — next requests e use hobe
        if (typeof window !== "undefined") {
          window.__authToken = newToken;
        }

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Refresh o fail korle — logout
        if (typeof window !== "undefined") {
          window.__authToken = undefined;
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// Global type augment — window.__authToken
declare global {
  interface Window {
    __authToken?: string;
  }
}
