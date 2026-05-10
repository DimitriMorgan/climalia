import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { fetchMe, login } from '@/api/auth';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import type { ApiUser } from '@/types/api';

export function LoginForm(): React.ReactElement {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const setSession = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function performLogin(): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      const { token } = await login({ email: email.trim(), password });
      setToken(token);
      let me: ApiUser;
      try {
        me = await fetchMe();
      } catch (innerErr: unknown) {
        useAuthStore.getState().logout();
        throw innerErr;
      }
      setSession(token, me);
      void navigate('/espace-pro/dashboard', { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.status === 401 ? 'Identifiants invalides.' : err.message);
      } else {
        setError('Erreur réseau, veuillez réessayer.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void performLogin();
  };

  return (
    <form onSubmit={handleSubmit} aria-describedby="login-help" noValidate>
      <p id="login-help">
        Démo : employe.idf@climalia.fr / syndic@partner.fr / admin@climalia.fr — mot de passe demo
      </p>
      {error !== null ? <p role="alert">{error}</p> : null}
      <p>
        <label htmlFor="email">Email</label><br />
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e): void => { setEmail(e.target.value); }}
          required
        />
      </p>
      <p>
        <label htmlFor="password">Mot de passe</label><br />
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e): void => { setPassword(e.target.value); }}
          required
        />
      </p>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}
