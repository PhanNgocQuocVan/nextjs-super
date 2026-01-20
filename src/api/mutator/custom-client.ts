import axios, { AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth-store";
import baseConfig from "@/configs/base";

const axiosInstance = axios.create({
  baseURL: baseConfig.backendDomain,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Request Interceptor: Tự động gắn Token vào mỗi lần gọi API
axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Xử lý lỗi 401
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().resetStore();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export const useCustomClient = <T>(config: AxiosRequestConfig): Promise<T> => {
  return axiosInstance(config).then((res) => res.data);
};
