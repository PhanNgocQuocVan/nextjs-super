"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
// ** React Imports
import useAuthStore from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { ReactElement, ReactNode, useEffect } from "react";
interface GuestGuardProps {
  children: ReactNode;
  fallback: ReactElement | null;
}

const GuestGuard = (props: GuestGuardProps) => {
  const { children, fallback } = props;
  const router = useRouter();
  const auth = useAuthStore();
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  useEffect(() => {
    if (!hasHydrated) return;
    const token = localStorage.getItem("auth-client");
    if (auth.email || token) {
      router.replace("/user");
    }
  }, [router, auth.email, hasHydrated]);
  if (!hasHydrated || auth.email) {
    return fallback;
  }
  return <>{children}</>;
};

export default GuestGuard;
