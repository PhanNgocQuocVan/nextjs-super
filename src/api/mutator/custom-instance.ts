// src/api/mutator/custom-instance.ts
import axios, { AxiosError, AxiosRequestConfig } from "axios";

const mainAxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // Ví dụ: http://localhost:8080
  withCredentials: true, // QUAN TRỌNG: Để trình duyệt tự gửi/nhận Cookie HttpOnly
  headers: {
    "Content-Type": "application/json",
  },
});

// Xử lý phản hồi và lỗi tập trung
mainAxiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth-client"); // Xóa info user (không phải token)
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export function mainInstance<T>(config: AxiosRequestConfig): Promise<T> {
  return mainAxiosInstance(config).then((res) => res.data);
}
