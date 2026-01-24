"use client";
import { AxiosError } from "axios";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCustomClient } from "../mutator/custom-client";
import { useAuthStore } from "@/stores/auth-store";
import { ApiErrorResponse, LoginResponse } from "../models/auth";

interface LoginParams {
  email: string;
  password: string;
}

export const useLogin = () => {
  const setStore = useAuthStore((state) => state.setStore);

  return useMutation<LoginResponse, AxiosError<ApiErrorResponse>, LoginParams>({
    mutationFn: (body: LoginParams) =>
      useCustomClient<LoginResponse>({
        url: "/auth/login",
        method: "POST",
        data: body,
      }),
    onSuccess: (res) => {
      if (res.data) {
        setStore({
          accessToken: res.data.accessToken,
          account: res.data.account,
        });
      }
    },
  });
};
