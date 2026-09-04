/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '@/features/contact/ContactForm';

describe('ContactForm', (): void => {
  beforeEach((): void => {
    global.fetch = jest.fn();
  });

  test('shows validation errors when submitting empty form', async (): Promise<void> => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.click(screen.getByRole('button', { name: /envoyer/i }));
    expect(await screen.findAllByText(/requis|obligatoire/i)).not.toHaveLength(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('submits and shows success on 201', async (): Promise<void> => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'abc', status: 'NEW' }), { status: 201, headers: { 'content-type': 'application/json' } }),
    );
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.type(screen.getByLabelText(/nom/i), 'Jean Dupont');
    await user.type(screen.getByLabelText(/email/i), 'jean@example.com');
    await user.type(screen.getByLabelText(/téléphone/i), '0612345678');
    await user.type(screen.getByLabelText(/code postal/i), '75011');
    await user.click(screen.getByRole('button', { name: /^climatisation$/i }));
    await user.type(screen.getByLabelText(/message/i), 'Bonjour, je souhaite un devis.');
    await user.click(screen.getByRole('button', { name: /envoyer/i }));
    await waitFor((): void => { expect(screen.getByRole('status')).toHaveTextContent(/merci|envoyée/i); });
  });

  test('renders server validation errors on 422', async (): Promise<void> => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ violations: [{ propertyPath: 'email', title: 'Email déjà enregistré' }] }),
        { status: 422, headers: { 'content-type': 'application/json' } },
      ),
    );
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.type(screen.getByLabelText(/nom/i), 'Jean Dupont');
    await user.type(screen.getByLabelText(/email/i), 'jean@example.com');
    await user.type(screen.getByLabelText(/téléphone/i), '0612345678');
    await user.type(screen.getByLabelText(/code postal/i), '75011');
    await user.click(screen.getByRole('button', { name: /^climatisation$/i }));
    await user.type(screen.getByLabelText(/message/i), 'Bonjour.');
    await user.click(screen.getByRole('button', { name: /envoyer/i }));
    expect(await screen.findByText(/email déjà enregistré/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalled();
  });
});
