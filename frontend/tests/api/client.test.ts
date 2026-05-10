import { apiFetch, ApiError } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import type { ApiUser } from '@/types/api';

const sampleUser: ApiUser = {
  id: '01', email: 'a@b.c', firstName: 'A', lastName: 'B', role: 'ADMIN', region: null,
};

type FetchArgs = [input: string | URL | Request, init?: RequestInit];
type FetchMock = jest.Mock<Promise<Response>, FetchArgs>;

describe('apiFetch', (): void => {
  const fetchMock: FetchMock = jest.fn<Promise<Response>, FetchArgs>();
  beforeEach((): void => {
    useAuthStore.getState().reset();
    fetchMock.mockReset();
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock;
  });

  test('returns parsed json on 200', async (): Promise<void> => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const data = await apiFetch<{ ok: boolean }>('/api/ping');
    expect(data).toEqual({ ok: true });
  });

  test('attaches Authorization header when token is present', async (): Promise<void> => {
    useAuthStore.getState().login('xyz.jwt.token', sampleUser);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200, headers: { 'content-type': 'application/json' } }));
    await apiFetch('/api/secret');
    const call = fetchMock.mock.calls[0];
    if (call === undefined) throw new Error('fetch was not called');
    const init = call[1];
    if (init === undefined) throw new Error('init missing');
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBe('Bearer xyz.jwt.token');
  });

  test('does NOT attach Authorization when token is null', async (): Promise<void> => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200, headers: { 'content-type': 'application/json' } }));
    await apiFetch('/api/public');
    const call = fetchMock.mock.calls[0];
    if (call === undefined) throw new Error('fetch was not called');
    const init = call[1];
    if (init === undefined) throw new Error('init missing');
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBeNull();
  });

  test('on 401 logs out and throws ApiError', async (): Promise<void> => {
    useAuthStore.getState().login('xyz.jwt.token', sampleUser);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'expired' }), { status: 401, headers: { 'content-type': 'application/json' } }));
    await expect(apiFetch('/api/secret')).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  test('on 422 surfaces validation violations', async (): Promise<void> => {
    const body = { violations: [{ propertyPath: 'email', title: 'Invalid' }] };
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status: 422, headers: { 'content-type': 'application/json' } }));
    try {
      await apiFetch('/api/contact', { method: 'POST', body: JSON.stringify({}) });
      throw new Error('should have thrown');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ApiError);
      const e = err as ApiError;
      expect(e.status).toBe(422);
      expect(e.violations).toEqual([{ propertyPath: 'email', message: 'Invalid' }]);
    }
  });

  test('on POST with body sets Content-Type application/json', async (): Promise<void> => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 201, headers: { 'content-type': 'application/json' } }));
    await apiFetch('/api/contact', { method: 'POST', body: JSON.stringify({ a: 1 }) });
    const call = fetchMock.mock.calls[0];
    if (call === undefined) throw new Error('fetch was not called');
    const init = call[1];
    if (init === undefined) throw new Error('init missing');
    const headers = new Headers(init.headers);
    expect(headers.get('Content-Type')).toBe('application/json');
  });
});
