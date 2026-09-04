import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { fetchMe, login } from '@/api/auth';
import { ApiError } from '@/api/client';
import { Icon } from '@/components/Icon';
import { useAuthStore } from '@/stores/authStore';
import type { ApiUser } from '@/types/api';

interface LoginFormProps {
  initialEmail?: string;
  initialPassword?: string;
  onPrefill?: (email: string) => void;
}

export function LoginForm({
  initialEmail = '',
  initialPassword = '',
}: LoginFormProps): React.ReactElement {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const setSession = useAuthStore((s) => s.login);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
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
      const destination =
        me.role === 'EDITOR' ? '/espace-pro/realisations' : '/espace-pro/dashboard';
      void navigate(destination, { replace: true });
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
    <form className="login__form" onSubmit={handleSubmit} noValidate>
      <div className="field-group">
        <label htmlFor="email" className="field-group__label">Email professionnel</label>
        <input
          id="email"
          type="email"
          className="field field--lg"
          autoComplete="email"
          required
          value={email}
          placeholder="vous@climalia.fr"
          onChange={(e): void => {
            setEmail(e.target.value);
          }}
        />
      </div>
      <div className="field-group">
        <label htmlFor="password" className="field-group__label">Mot de passe</label>
        <input
          id="password"
          type="password"
          className="field field--lg"
          autoComplete="current-password"
          required
          value={password}
          placeholder="••••••"
          onChange={(e): void => {
            setPassword(e.target.value);
          }}
        />
      </div>

      {error !== null ? (
        <p role="alert" className="alert alert--bad">{error}</p>
      ) : null}

      <div className="login__row">
        <label>
          <input type="checkbox" /> Se souvenir de moi
        </label>
        <a href="#">Mot de passe oublié ?</a>
      </div>

      <button
        type="submit"
        className="btn btn--primary btn--lg"
        disabled={submitting}
        style={{ marginTop: '0.5rem', justifyContent: 'center' }}
      >
        {submitting ? 'Connexion…' : (
          <>
            Se connecter <Icon name="arrow-right" size={14} />
          </>
        )}
      </button>
    </form>
  );
}
