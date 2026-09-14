import axios from "axios";
import { API_BASE_URL, API_KEY, STORAGE_KEYS, clearAuthStorage } from "../config/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (API_KEY) {
    config.headers["X-API-Key"] = API_KEY;
  }

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          const res = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken },
            {
              headers: {
                "X-API-Key": API_KEY,
                "Content-Type": "application/json",
              },
            },
          );

          if (res.data.access_token) {
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.data.access_token);
            apiClient.defaults.headers.common["Authorization"] =
              `Bearer ${res.data.access_token}`;
            originalRequest.headers["Authorization"] =
              `Bearer ${res.data.access_token}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        clearAuthStorage();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
