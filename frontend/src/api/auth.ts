import { apiFetch } from '@/api/client';
import type { ApiUser, LoginRequest, LoginResponse } from '@/types/api';

export function login(body: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function fetchMe(): Promise<ApiUser> {
  return apiFetch<ApiUser>('/api/auth/me');
}

export async function logout(): Promise<void> {
  await apiFetch<undefined>('/api/auth/logout', { method: 'POST' });
}
