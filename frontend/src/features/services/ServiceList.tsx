import type React from 'react';
import { Link } from 'react-router';

interface ServiceItem {
  slug: string;
  title: string;
  description: string;
}

const SERVICES: ReadonlyArray<ServiceItem> = [
  { slug: 'clim', title: 'Climatisation mono / multi-split', description: 'Installation, mise en service, contrats d\'entretien.' },
  { slug: 'pac-air-air', title: 'Pompes à chaleur air/air', description: 'Confort thermique optimisé toute l\'année.' },
  { slug: 'pac-air-eau', title: 'Pompes à chaleur air/eau', description: 'Chauffage central + ECS, certifié RGE QualiPAC.' },
  { slug: 'vmc', title: 'VMC simple et double flux', description: 'Renouvellement d\'air et économies d\'énergie.' },
  { slug: 'maintenance', title: 'Entretien & dépannage', description: 'Contrats annuels, intervention rapide en cas de panne.' },
];

export function ServiceList(): React.ReactElement {
  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1rem' }}>
      {SERVICES.map((s) => (
        <li key={s.slug} style={{ border: '1px solid #ddd', padding: '1rem' }}>
          <h3>{s.title}</h3>
          <p>{s.description}</p>
          <Link to="/contact">Demander un devis</Link>
        </li>
      ))}
    </ul>
  );
}
