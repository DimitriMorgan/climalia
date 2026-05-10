import type React from 'react';
import { Link } from 'react-router';

export function NotFoundPage(): React.ReactElement {
  return (
    <section>
      <h1>404 — Page introuvable</h1>
      <Link to="/">Retour à l&apos;accueil</Link>
    </section>
  );
}
