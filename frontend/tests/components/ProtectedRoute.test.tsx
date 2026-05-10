/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import type { ApiUser } from '@/types/api';

const user: ApiUser = {
  id: '01',
  email: 'admin@climalia.fr',
  firstName: 'A',
  lastName: 'B',
  role: 'ADMIN',
  region: null,
};

function renderAt(initial: string): void {
  render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/espace-pro/login" element={<div>login-page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/espace-pro/dashboard" element={<div>dashboard-page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', (): void => {
  beforeEach((): void => {
    useAuthStore.getState().reset();
  });

  test('redirects to login when not authenticated', (): void => {
    renderAt('/espace-pro/dashboard');
    expect(screen.getByText('login-page')).toBeInTheDocument();
  });

  test('renders child route when authenticated', (): void => {
    useAuthStore.getState().login('tok', user);
    renderAt('/espace-pro/dashboard');
    expect(screen.getByText('dashboard-page')).toBeInTheDocument();
  });
});
