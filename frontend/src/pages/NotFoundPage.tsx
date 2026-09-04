import type React from 'react';
import { Link } from 'react-router';
import { Icon } from '@/components/Icon';
import { SectionLabel } from '@/components/SectionLabel';

export function NotFoundPage(): React.ReactElement {
  return (
    <section className="notfound">
      <div>
        <SectionLabel num="·" accent>Erreur 404</SectionLabel>
        <h1>
          4<em>0</em>4
        </h1>
        <p>Cette page n&apos;existe pas — ou plus.</p>
        <Link to="/" className="btn btn--ghost notfound__cta">
          <Icon name="arrow-right" size={14} style={{ transform: 'rotate(180deg)' }} />
          Retour à l&apos;accueil
        </Link>
      </div>
    </section>
  );
}
