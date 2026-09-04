import { apiFetch } from '@/api/client';
import type { ApiManagedUser, ManagedUserInput, UserFlagsInput } from '@/types/api';

export function listUsers(): Promise<ReadonlyArray<ApiManagedUser>> {
  return apiFetch<ReadonlyArray<ApiManagedUser>>('/api/users');
}

export function createUser(input: ManagedUserInput): Promise<ApiManagedUser> {
  return apiFetch<ApiManagedUser>('/api/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateUser(id: string, input: ManagedUserInput): Promise<ApiManagedUser> {
  return apiFetch<ApiManagedUser>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await apiFetch<undefined>(`/api/users/${id}`, { method: 'DELETE' });
}

/** Bascule connexion autorisée / réception des e-mails de notification. */
export function updateUserFlags(id: string, flags: UserFlagsInput): Promise<ApiManagedUser> {
  return apiFetch<ApiManagedUser>(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(flags),
  });
}
