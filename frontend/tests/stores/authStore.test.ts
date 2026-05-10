import { useAuthStore } from '@/stores/authStore';
import type { ApiUser } from '@/types/api';

const sampleUser: ApiUser = {
  id: '0190abcd-1234-7000-8000-000000000001',
  email: 'admin@climalia.fr',
  firstName: 'Admin',
  lastName: 'Test',
  role: 'ADMIN',
  region: null,
};

describe('authStore', (): void => {
  beforeEach((): void => {
    useAuthStore.getState().reset();
  });

  test('starts logged out', (): void => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  test('login sets token and user', (): void => {
    useAuthStore.getState().login('jwt.token.here', sampleUser);
    const state = useAuthStore.getState();
    expect(state.token).toBe('jwt.token.here');
    expect(state.user).toEqual(sampleUser);
    expect(state.token).not.toBeNull();
  });

  test('setToken updates only the token, leaving user untouched', (): void => {
    useAuthStore.getState().setToken('new-token');
    expect(useAuthStore.getState().token).toBe('new-token');
    expect(useAuthStore.getState().user).toBeNull();
  });

  test('logout clears state', (): void => {
    useAuthStore.getState().login('jwt.token.here', sampleUser);
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  test('does NOT touch localStorage or sessionStorage', (): void => {
    const lsSpy = jest.spyOn(Storage.prototype, 'setItem');
    useAuthStore.getState().login('jwt.token.here', sampleUser);
    useAuthStore.getState().logout();
    expect(lsSpy).not.toHaveBeenCalled();
    lsSpy.mockRestore();
  });
});
