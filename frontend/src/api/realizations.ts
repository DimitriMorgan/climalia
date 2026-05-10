import { apiFetch } from '@/api/client';
import type { ApiRealization } from '@/types/api';
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
