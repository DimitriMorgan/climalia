import { apiFetch } from '@/api/client';
import type { ApiContactRequest, ContactRequestInput, ContactRequestResponse } from '@/types/api';
import type { ContactStatus } from '@/types/enums';

export function submitContactRequest(input: ContactRequestInput): Promise<ContactRequestResponse> {
  return apiFetch<ContactRequestResponse>('/api/contact', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Liste des demandes de devis (admin). */
export function listContactRequests(status?: ContactStatus): Promise<ReadonlyArray<ApiContactRequest>> {
  const suffix = status === undefined ? '' : `?status=${status}`;
  return apiFetch<ReadonlyArray<ApiContactRequest>>(`/api/contact${suffix}`);
}

export function updateContactStatus(id: string, status: ContactStatus): Promise<ApiContactRequest> {
  return apiFetch<ApiContactRequest>(`/api/contact/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/** Envoie la réponse de l'admin par e-mail au prospect (statut NEW → CONTACTED). */
export function replyToContactRequest(
  id: string,
  input: { subject: string; message: string },
): Promise<ApiContactRequest> {
  return apiFetch<ApiContactRequest>(`/api/contact/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
