import type React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listRealizations } from '@/api/realizations';
import type { ApiRealization } from '@/types/api';

interface Testimonial {
  author: string;
  text: string;
}

const TESTIMONIALS: ReadonlyArray<Testimonial> = [
  { author: 'Mme Lefèvre — Paris 11', text: 'Installation propre et rapide, équipe sérieuse.' },
  { author: 'Syndic Lyon Vaise', text: 'Suivi des contrats irréprochable depuis 3 ans.' },
  { author: 'Bureau d\'études Marseille', text: 'Devis détaillé, vraie expertise terrain.' },
];

export function HomePage(): React.ReactElement {
  const [latest, setLatest] = useState<ReadonlyArray<ApiRealization>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect((): void => {
    listRealizations()
      .then((all) => { setLatest(all.slice(0, 3)); })
      .catch((e: unknown) => { setError(e instanceof Error ? e.message : 'Erreur'); });
  }, []);

  return (
    <>
      <section aria-labelledby="hero">
        <h1 id="hero">Climalia, votre artisan climaticien — France entière</h1>
        <p>Installation, entretien et dépannage de climatisation, pompes à chaleur et VMC.</p>
        <Link to="/contact">Demander un devis</Link>
      </section>

      <section aria-labelledby="services">
        <h2 id="services">Nos services</h2>
        <p>Climatisation, PAC air/air et air/eau, VMC, entretien, dépannage.</p>
        <Link to="/services">Voir tous les services</Link>
      </section>

      <section aria-labelledby="trust" style={{ background: '#f5f5f5', padding: '1rem' }}>
        <h2 id="trust">Pourquoi nous faire confiance</h2>
        <ul>
          <li>Certifié RGE et QualiPAC</li>
          <li>Intervention sur toute la France</li>
          <li>Plus de 500 chantiers réalisés</li>
        </ul>
      </section>

      <section aria-labelledby="testimonials">
        <h2 id="testimonials">Ils nous font confiance</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {TESTIMONIALS.map((t) => (
            <li key={t.author} style={{ borderLeft: '3px solid #888', padding: '0.5rem 1rem', marginBottom: '0.5rem' }}>
              <blockquote>{t.text}</blockquote>
              <cite>— {t.author}</cite>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="latest">
        <h2 id="latest">Dernières réalisations</h2>
        {error !== null ? <p role="alert">Erreur : {error}</p> : null}
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1rem' }}>
          {latest.map((r) => (
            <li key={r.id} style={{ border: '1px solid #ddd', padding: '1rem' }}>
              <h3>{r.title}</h3>
              <p>{r.description}</p>
              <small>{r.region} — {r.equipmentType}</small>
            </li>
          ))}
        </ul>
        <Link to="/realisations">Toutes les réalisations</Link>
      </section>

      <section aria-labelledby="cta">
        <h2 id="cta">Un projet ? Parlons-en.</h2>
        <Link to="/contact">Contactez-nous</Link>
      </section>
    </>
  );
}
