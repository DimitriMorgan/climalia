import { create } from 'zustand';
import { fetchContentOverrides } from '@/api/content';
import { CONTENT_DEFAULTS } from '@/content/defaults';
import type { ContentKey } from '@/content/defaults';
import type { ContentOverrides } from '@/types/api';

interface ContentState {
  overrides: ContentOverrides;
  loaded: boolean;
  load: () => Promise<void>;
  setOverrides: (overrides: ContentOverrides) => void;
}

export const useContentStore = create<ContentState>()((set, get) => ({
  overrides: {},
  loaded: false,
  load: async (): Promise<void> => {
    if (get().loaded) return;
    try {
      const overrides = await fetchContentOverrides();
      set({ overrides, loaded: true });
    } catch {
      // API indisponible → on garde les textes par défaut.
      set({ loaded: true });
    }
  },
  setOverrides: (overrides): void => {
    set({ overrides });
  },
}));

/**
 * Hook de lecture d'une clé de contenu : override éditorial si présent,
 * sinon texte par défaut. Utilisable sans provider (défauts immédiats).
 */
export function useT(): (key: ContentKey) => string {
  const overrides = useContentStore((s) => s.overrides);
  return (key): string => overrides[key] ?? CONTENT_DEFAULTS[key];
}
