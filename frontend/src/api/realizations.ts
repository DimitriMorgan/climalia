import { apiFetch } from '@/api/client';
import type { ApiRealization, RealizationInput } from '@/types/api';
import type { EquipmentType, RealizationType } from '@/types/enums';

export interface RealizationFilters {
  type?: RealizationType;
  equipmentType?: EquipmentType;
  region?: string;
}

export function listRealizations(filters: RealizationFilters = {}): Promise<ReadonlyArray<ApiRealization>> {
  const qs = new URLSearchParams();
  if (filters.type !== undefined) qs.set('type', filters.type);
  if (filters.equipmentType !== undefined) qs.set('equipmentType', filters.equipmentType);
  if (filters.region !== undefined && filters.region !== '') qs.set('region', filters.region);
  const suffix = qs.toString();
  return apiFetch<ReadonlyArray<ApiRealization>>(`/api/realizations${suffix === '' ? '' : `?${suffix}`}`);
}

export function createRealization(input: RealizationInput): Promise<ApiRealization> {
  return apiFetch<ApiRealization>('/api/realizations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateRealization(id: string, input: RealizationInput): Promise<ApiRealization> {
  return apiFetch<ApiRealization>(`/api/realizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteRealization(id: string): Promise<void> {
  await apiFetch<undefined>(`/api/realizations/${id}`, { method: 'DELETE' });
}
