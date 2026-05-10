import type React from 'react';
import { LoginForm } from '@/features/auth/LoginForm';

export function LoginPage(): React.ReactElement {
  return (
    <section>
      <h1>Espace pro — Connexion</h1>
      <LoginForm />
    </section>
  );
}
