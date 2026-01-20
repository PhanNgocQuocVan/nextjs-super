import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encrypt, decrypt } from '@/utils/authEncryption';

interface AuthState {
  accessToken: string | null;
  account: { id: number; name: string; email: string; role: string } | null;
  setStore: (data: { accessToken: string; account: any }) => void;
  resetStore: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      account: null,
      setStore: (data) => set({ accessToken: data.accessToken, account: data.account }),
      resetStore: () => set({ accessToken: null, account: null }),
    }),
    {
      name: 'auth-client',
      // Sử dụng hàm mã hóa của công ty để bảo vệ Token trong localStorage
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          const val = localStorage.getItem(name);
          return val ? decrypt(val) : null;
        },
        setItem: (name, value) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(name, encrypt(value));
          }
        },
        removeItem: (name) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(name);
          }
        },
      })),
    }
  )
);
