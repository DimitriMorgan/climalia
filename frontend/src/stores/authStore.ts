import { create } from 'zustand';
import type { ApiUser } from '@/types/api';

interface AuthState {
  token: string | null;
  user: ApiUser | null;
  setToken: (token: string | null) => void;
  login: (token: string, user: ApiUser) => void;
  logout: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
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
}));
