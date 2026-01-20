"use client";
import { useLogin } from "@/api/endpoints/auth";

export default function Home() {
  const { mutate } = useLogin();
  return (
    <button
      onClick={() => mutate({ email: "admin@order.com", password: "123456" })}
    >
      Đăng nhập
    </button>
  );
}
