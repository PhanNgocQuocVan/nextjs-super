"use client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCustomClient } from "../mutator/custom-client";
import { useAuthStore } from "@/stores/auth-store";

// Hook Đăng nhập
export const useLogin = () => {
  const setStore = useAuthStore((state) => state.setStore);

  return useMutation({
    mutationFn: (body: any) =>
      useCustomClient<any>({ url: "/auth/login", method: "POST", data: body }),
    onSuccess: (res) => {
      if (res.data) {
        console.log(res);

        setStore({
          accessToken: res.data.accessToken,
          account: res.data.account,
        });
      }
    },
  });
};
