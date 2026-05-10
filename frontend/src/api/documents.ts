import { apiFetch } from '@/api/client';
import type { ApiDocument, ApiDocumentDownload } from '@/types/api';
import type { DocumentCategory } from '@/types/enums';

export interface DocumentFilters {
  category?: DocumentCategory;
  dateFrom?: string;
  dateTo?: string;
  region?: string;
}

export function listDocuments(filters: DocumentFilters = {}): Promise<ReadonlyArray<ApiDocument>> {
  const qs = new URLSearchParams();
  if (filters.category !== undefined) qs.set('category', filters.category);
  if (filters.dateFrom !== undefined && filters.dateFrom !== '') qs.set('dateFrom', filters.dateFrom);
  if (filters.dateTo !== undefined && filters.dateTo !== '') qs.set('dateTo', filters.dateTo);
  if (filters.region !== undefined && filters.region !== '') qs.set('region', filters.region);
  const suffix = qs.toString();
  return apiFetch<ReadonlyArray<ApiDocument>>(`/api/documents${suffix === '' ? '' : `?${suffix}`}`);
}

export function getDocumentDownload(id: string): Promise<ApiDocumentDownload> {
  return apiFetch<ApiDocumentDownload>(`/api/documents/${id}/download`);
}
