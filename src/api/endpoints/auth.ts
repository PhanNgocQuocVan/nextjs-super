// src/api/endpoints/auth.ts
import { useMutation } from "@tanstack/react-query";
import { mainInstance } from "../mutator/custom-instance";
import { LoginResponse } from "../mutator/models/auth";

// Hàm gọi API thuần
export const postLogin = (data: any) => {
  return mainInstance<LoginResponse>({
    url: `/api/v1.0/auth/login`,
    method: "POST",
    data,
  });
};

// Hook mô phỏng Orval
export const usePostLogin = () => {
  return useMutation({
    mutationFn: postLogin,
  });
};
