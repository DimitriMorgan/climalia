import { apiFetch } from '@/api/client';

export interface UploadedMedia {
  /** Chemin relatif servi par l'app, ex. `/uploads/<uuid>.jpg`. */
  url: string;
  name: string;
}

/**
 * Upload d'une image éditoriale (réalisations, contenu).
 *
 * `apiFetch` ne pose `Content-Type` que pour les corps `string`, donc pour un
 * `FormData` le navigateur définit lui-même le `multipart/form-data; boundary=…`.
 * Le header `Authorization: Bearer` est ajouté automatiquement.
 */
export function uploadImage(file: File): Promise<UploadedMedia> {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<UploadedMedia>('/api/media', {
    method: 'POST',
    body: form,
  });
}
