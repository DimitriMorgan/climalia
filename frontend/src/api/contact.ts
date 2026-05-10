import { apiFetch } from '@/api/client';
import type { ContactRequestInput, ContactRequestResponse } from '@/types/api';

export function submitContactRequest(input: ContactRequestInput): Promise<ContactRequestResponse> {
  return apiFetch<ContactRequestResponse>('/api/contact', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
