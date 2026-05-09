import { create } from 'zustand';
import type { ApiUser } from '@/types/api';

interface AuthState {
  token: string | null;
  user: ApiUser | null;
  login: (token: string, user: ApiUser) => void;
  logout: () => void;
  reset: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  login: (token, user): void => {
    set({ token, user });
  },
  logout: (): void => {
    set({ token: null, user: null });
  },
  reset: (): void => {
    set({ token: null, user: null });
  },
  isAuthenticated: (): boolean => get().token !== null,
}));
