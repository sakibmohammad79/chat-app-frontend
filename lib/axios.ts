import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Main Axios Instance
export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // cookie (refresh token) automatic
});

// Request Interceptor
// Add Authorization header with token from Zustand store (window.__authToken) if available.
axiosInstance.interceptors.request.use((config) => {
  // Get token from global window object (set by Zustand store)
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
// when 401 Unauthorized, try to refresh token using cookie (refresh token) and retry the request
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

    // Check if the error is 401 Unauthorized and the request has not been retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        // If a refresh request is already in progress, queue the current request and wait for the new token
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
        // Refresh token request
        const { data } = await axiosInstance.post("/auth/refresh");
        const newToken = data.data.accessToken;

        // Update the global token in window object
        if (typeof window !== "undefined") {
          window.__authToken = newToken;
        }

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // If refresh fails, clear the token and redirect to login page
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
