/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

// ** React Imports
import { ReactNode, ReactElement, useEffect } from 'react';

// ** Stores & Hooks
import useAuthStore from '@/stores/auth-store';
import { useRouter, usePathname } from 'next/navigation';

interface AuthGuardProps {
  children: ReactNode;
  fallback: ReactElement | null;
}

const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
  const auth = useAuthStore();
  const resetStore = useAuthStore((state) => state.resetStore);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('AuthGuard useEffect - checking auth', auth.username, hasHydrated);
    if (!hasHydrated) return;

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth-client')
        : null;

    if (!auth.email || !token) {
      // clear auth
      resetStore();
      localStorage.removeItem('auth-client');

      if (pathname !== '/login') {
        router.replace(
          `/login?returnUrl=${encodeURIComponent(pathname)}`
        );
      }
    }
  }, [auth.email, pathname, router, resetStore, hasHydrated]);

  if (!hasHydrated || !auth.email) {
    return fallback;
  }

  return <>{children}</>;
};

export default AuthGuard;
