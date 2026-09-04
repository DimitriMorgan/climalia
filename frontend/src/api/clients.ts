import { apiFetch } from '@/api/client';
import type {
  ApiClientCompany,
  ApiClientOption,
  ClientCompanyInput,
  ClientContactInput,
} from '@/types/api';

/** Liste complète (admin) : entreprises + contacts. */
export function listClientCompanies(): Promise<ReadonlyArray<ApiClientCompany>> {
  return apiFetch<ReadonlyArray<ApiClientCompany>>('/api/clients');
}

/** Liste légère id/libellé pour la pré-affectation (employés + admin). */
export function listClientOptions(): Promise<ReadonlyArray<ApiClientOption>> {
  return apiFetch<ReadonlyArray<ApiClientOption>>('/api/clients/options');
}

export function createClientCompany(input: ClientCompanyInput): Promise<ApiClientCompany> {
  return apiFetch<ApiClientCompany>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateClientCompany(id: string, input: ClientCompanyInput): Promise<ApiClientCompany> {
  return apiFetch<ApiClientCompany>(`/api/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function addClientContact(companyId: string, input: ClientContactInput): Promise<ApiClientCompany> {
  return apiFetch<ApiClientCompany>(`/api/clients/${companyId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
