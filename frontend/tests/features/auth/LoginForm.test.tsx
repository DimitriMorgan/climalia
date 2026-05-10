/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { LoginForm } from '@/features/auth/LoginForm';
import { useAuthStore } from '@/stores/authStore';

function renderLogin(): void {
  render(
    <MemoryRouter initialEntries={['/espace-pro/login']}>
      <Routes>
        <Route path="/espace-pro/login" element={<LoginForm />} />
        <Route path="/espace-pro/dashboard" element={<div>dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginForm', (): void => {
  beforeEach((): void => {
    useAuthStore.getState().reset();
    global.fetch = jest.fn();
  });

  test('logs in successfully and redirects to dashboard', async (): Promise<void> => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'jwt-token-123' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'user-1',
            email: 'admin@climalia.fr',
            firstName: 'Alice',
            lastName: 'Admin',
            role: 'ADMIN',
            region: null,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );

    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'admin@climalia.fr');
    await user.type(screen.getByLabelText(/mot de passe/i), 'demo');
    await user.click(screen.getByRole('button', { name: /connexion|se connecter/i }));

    await waitFor((): void => {
      expect(screen.getByText('dashboard')).toBeInTheDocument();
    });
    expect(useAuthStore.getState().token).toBe('jwt-token-123');
  });

  test('shows error on bad credentials', async (): Promise<void> => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Invalid credentials.' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'admin@climalia.fr');
    await user.type(screen.getByLabelText(/mot de passe/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /connexion|se connecter/i }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/invalid|incorrect|invalides/i);
    expect(useAuthStore.getState().token).toBeNull();
  });
});
