import { apiFetch } from '@/api/client';
import type { ContentOverrides } from '@/types/api';

export function fetchContentOverrides(): Promise<ContentOverrides> {
  return apiFetch<ContentOverrides>('/api/content');
}

export interface ContentEntryInput {
  key: string;
  /** `null` ou chaîne vide → suppression de l'override (retour au défaut). */
  value: string | null;
}

export function saveContentOverrides(
  entries: ReadonlyArray<ContentEntryInput>,
): Promise<ContentOverrides> {
  return apiFetch<ContentOverrides>('/api/content', {
    method: 'PUT',
    body: JSON.stringify({ entries }),
  });
}
