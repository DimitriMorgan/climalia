import type React from 'react';
import { useState } from 'react';
import { FranceMap } from '@/components/FranceMap';

export function AboutPage(): React.ReactElement {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <section>
      <h1>À propos de Climalia</h1>
      <article>
        <h2>Notre histoire</h2>
        <p>Artisan climaticien, intervention sur tout le territoire français depuis plus de 10 ans.</p>
      </article>
      <article>
        <h2>Nos valeurs</h2>
        <ul>
          <li>Conseil sincère, sans sur-vente.</li>
          <li>Travail propre et durable.</li>
          <li>Suivi long terme avec contrats d&apos;entretien.</li>
        </ul>
      </article>
      <article>
        <h2>Certifications</h2>
        <ul>
          <li>RGE — Reconnu Garant de l&apos;Environnement</li>
          <li>QualiPAC — Pompes à chaleur</li>
        </ul>
      </article>
      <article>
        <h2>Couverture France</h2>
        <FranceMap onSelect={setSelected} />
        {selected !== null ? <p>Région sélectionnée : <strong>{selected}</strong></p> : null}
      </article>
    </section>
  );
}
