import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  token: string | null;
  fullName: string | null;
  isAuthenticated: boolean;
  login: (token: string, fullName: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      fullName: null,
      isAuthenticated: false,

      login: (token, fullName) => {
        localStorage.setItem('adminToken', token);
        set({ token, fullName, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('adminToken');
        set({ token: null, fullName: null, isAuthenticated: false });
      },
    }),
    {
      name: 'hagiga-auth',
    }
  )
);
