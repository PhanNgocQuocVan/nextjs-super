import { useAuthStore } from "@/stores/auth-store";
import { useEffect, useState } from "react";

export function useAuth() {
  const account = useAuthStore((state) => state.account);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Chỉ cập nhật state sau khi component đã mount
    // Điều này giúp tránh hydration mismatch giữa server và client
    setIsAuth(!!account);
  }, [account]);

  return {
    isAuth,
    account,
  };
}
