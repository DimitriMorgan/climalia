import { apiFetch, ApiError } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import type { ApiDocument, ApiDocumentDownload } from '@/types/api';
import type { DocumentAudience, DocumentCategory } from '@/types/enums';

export interface DocumentFilters {
  category?: DocumentCategory;
  dateFrom?: string;
  dateTo?: string;
  region?: string;
  unassigned?: boolean;
}

export function listDocuments(filters: DocumentFilters = {}): Promise<ReadonlyArray<ApiDocument>> {
  const qs = new URLSearchParams();
  if (filters.category !== undefined) qs.set('category', filters.category);
  if (filters.dateFrom !== undefined && filters.dateFrom !== '') qs.set('dateFrom', filters.dateFrom);
  if (filters.dateTo !== undefined && filters.dateTo !== '') qs.set('dateTo', filters.dateTo);
  if (filters.region !== undefined && filters.region !== '') qs.set('region', filters.region);
  if (filters.unassigned === true) qs.set('unassigned', '1');
  const suffix = qs.toString();
  return apiFetch<ReadonlyArray<ApiDocument>>(`/api/documents${suffix === '' ? '' : `?${suffix}`}`);
}

export function getDocument(id: string): Promise<ApiDocument> {
  return apiFetch<ApiDocument>(`/api/documents/${id}`);
}

export interface UploadDocumentInput {
  file: File;
  title: string;
  category: DocumentCategory;
  audience: DocumentAudience;
  region?: string | undefined;
  /** Date métier optionnelle (YYYY-MM-DD) — alimente le calendrier admin. */
  documentDate?: string | undefined;
  assignedClientIds?: ReadonlyArray<string> | undefined;
  /** Notifier par e-mail les contacts des entreprises affectées. */
  notify?: boolean | undefined;
}

export function uploadDocument(input: UploadDocumentInput): Promise<ApiDocument> {
  const form = new FormData();
  form.set('file', input.file);
  form.set('title', input.title);
  form.set('category', input.category);
  form.set('audience', input.audience);
  if (input.region !== undefined && input.region !== '') form.set('region', input.region);
  if (input.documentDate !== undefined && input.documentDate !== '') form.set('documentDate', input.documentDate);
  for (const id of input.assignedClientIds ?? []) {
    form.append('assignedClientIds[]', id);
  }
  if (input.notify === true) form.set('notify', '1');
  return apiFetch<ApiDocument>('/api/documents', { method: 'POST', body: form });
}

/** Pose, déplace ou retire (null) la date métier d'un document (admin). */
export function updateDocumentDate(id: string, documentDate: string | null): Promise<ApiDocument> {
  return apiFetch<ApiDocument>(`/api/documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ documentDate }),
  });
}

export function assignDocumentClients(
  id: string,
  clientIds: ReadonlyArray<string>,
  notify = false,
): Promise<ApiDocument> {
  return apiFetch<ApiDocument>(`/api/documents/${id}/clients`, {
    method: 'PUT',
    body: JSON.stringify({ clientIds, notify }),
  });
}

/** Fichier stocké, récupéré en blob (le back streame le binaire derrière le voter). */
export interface DocumentFileBlob {
  kind: 'blob';
  blob: Blob;
  mimeType: string;
  filename: string;
}

/** Document hérité sans fichier stocké : le back renvoie son URL externe. */
export interface DocumentFileExternal {
  kind: 'external';
  url: string;
}

export type DocumentFile = DocumentFileBlob | DocumentFileExternal;

function parseDispositionFilename(header: string | null): string | null {
  if (header === null) return null;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  return match?.[1] ?? null;
}

/**
 * Récupère le contenu d'un document. Contrairement à `apiFetch`, la réponse
 * n'est pas du JSON mais le fichier lui-même (sauf documents hérités).
 */
export async function fetchDocumentFile(id: string): Promise<DocumentFile> {
  const headers = new Headers({ Accept: '*/*' });
  const { token } = useAuthStore.getState();
  if (token !== null) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`/api/documents/${id}/download`, { headers });
  if (response.status === 401) {
    useAuthStore.getState().logout();
    throw new ApiError(401, 'Session expirée. Reconnectez-vous.');
  }
  if (!response.ok) {
    throw new ApiError(response.status, `Téléchargement impossible (HTTP ${String(response.status)}).`);
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    const meta = (await response.json()) as ApiDocumentDownload;
    return { kind: 'external', url: meta.fileUrl };
  }

  const blob = await response.blob();
  return {
    kind: 'blob',
    blob,
    mimeType: contentType.split(';')[0] ?? 'application/octet-stream',
    filename: parseDispositionFilename(response.headers.get('Content-Disposition')) ?? 'document',
  };
}

/** Déclenche l'enregistrement d'un blob côté navigateur. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * N'autorise que http(s) : bloque javascript:, data: et autres schemas
 * executables avant toute insertion dans un href ou un window.open.
 */
export function isSafeHttpUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Télécharge un document : fichier stocké → enregistrement direct ;
 * document hérité → ouverture de l'URL externe dans un nouvel onglet.
 * Résout à `null` en cas de succès, sinon au message d'erreur à afficher.
 */
export async function downloadDocument(id: string): Promise<string | null> {
  let file: DocumentFile;
  try {
    file = await fetchDocumentFile(id);
  } catch (err: unknown) {
    return err instanceof ApiError ? err.message : 'Erreur de téléchargement.';
  }

  if (file.kind === 'external') {
    if (!isSafeHttpUrl(file.url)) {
      return 'URL de téléchargement invalide.';
    }
    const opened = window.open(file.url, '_blank', 'noopener,noreferrer');
    return opened === null
      ? 'Le téléchargement a été bloqué. Autorisez les pop-ups pour ce site.'
      : null;
  }

  saveBlob(file.blob, file.filename);
  return null;
}
