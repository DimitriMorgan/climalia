import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApiUser } from '@/types/api';

interface AuthState {
  token: string | null;
  user: ApiUser | null;
  setToken: (token: string | null) => void;
  login: (token: string, user: ApiUser) => void;
  logout: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token): void => {
        set({ token });
      },
      login: (token, user): void => {
        set({ token, user });
      },
      logout: (): void => {
        set({ token: null, user: null });
      },
      reset: (): void => {
        set({ token: null, user: null });
      },
    }),
    {
      name: 'climalia-auth',
      // On ne persiste que la session (token + user), pas les actions.
      partialize: (state): Pick<AuthState, 'token' | 'user'> => ({
        token: state.token,
        user: state.user,
      }),
    },
  ),
);
