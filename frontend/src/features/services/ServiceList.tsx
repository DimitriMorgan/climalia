import type React from 'react';
import { Link } from 'react-router';
import { Icon } from '@/components/Icon';
import { SERVICE_PHOTOS } from '@/components/photos';
import { Reveal } from '@/components/Reveal';
import { StripedSlot } from '@/components/StripedSlot';

interface ServiceItem {
  slug: string;
  title: string;
  tag: string;
  description: string;
  bullets: ReadonlyArray<string>;
  range: string;
}

const SERVICES: ReadonlyArray<ServiceItem> = [
  {
    slug: 'clim',
    title: 'Climatisation',
    tag: 'Mono & multi-split',
    description:
      "Études thermiques et installation de systèmes mono-split, multi-split et gainables. Haute efficacité énergétique, faibles nuisances sonores.",
    bullets: [
      'Climatisation réversible Inverter',
      'Cassettes plafond & gainables tertiaire',
      'Bilan thermique et dimensionnement',
      'Mise en service et fluide frigorigène',
    ],
    range: '— de 18 m² à 1 800 m²',
  },
  {
    slug: 'pac-air-eau',
    title: 'Pompes à chaleur air/eau',
    tag: 'Chauffage central',
    description:
      "Chauffage central et eau chaude sanitaire en relève ou remplacement de chaudière fioul/gaz, certifié RGE QualiPAC, éligible MaPrimeRénov.",
    bullets: [
      'PAC air-eau haute température',
      'Couplage avec ballon thermodynamique',
      "Aides MaPrimeRénov' & CEE accompagnées",
      'Garantie pièces et main-d’œuvre',
    ],
    range: '— maison, immeuble, ERP',
  },
  {
    slug: 'pac-air-air',
    title: 'Pompes à chaleur air/air',
    tag: 'Confort réversible',
    description:
      "Confort thermique optimisé toute l'année, pilotage connecté, équipements certifiés et silencieux pour le résidentiel comme le tertiaire.",
    bullets: [
      'Confort été/hiver en un seul système',
      'Pilotage app & domotique compatible',
      'Modèles silencieux Daikin, Mitsubishi',
      'Étude acoustique en zone urbaine',
    ],
    range: '— résidentiel & tertiaire',
  },
  {
    slug: 'vmc',
    title: 'VMC simple & double flux',
    tag: 'Qualité de l’air',
    description:
      "Ventilation hygiénique et confort thermique : VMC simple flux, hygro B et double flux à haut rendement avec récupération de chaleur.",
    bullets: [
      'VMC double flux jusqu’à 92 % rendement',
      'Hygroréglable B basse consommation',
      'Audit qualité de l’air intérieur',
      'Maintenance filtres & gaines',
    ],
    range: '— résidentiel & tertiaire',
  },
  {
    slug: 'maintenance',
    title: 'Entretien & dépannage',
    tag: 'Contrats & astreinte',
    description:
      "Contrats annuels, intervention rapide en cas de panne, traçabilité complète des interventions disponibles dans votre espace pro.",
    bullets: [
      'Visite annuelle obligatoire (clim > 4 kW)',
      "Astreinte dépannage 7j/7",
      'Rapport PDF horodaté',
      'Devis remis sous 24 h',
    ],
    range: '— forfait dès 149 €/an',
  },
];

export function ServiceList(): React.ReactElement {
  return (
    <div className="svc-list">
      {SERVICES.map((s, i) => (
        <Reveal key={s.slug} as="article">
          <div
            id={s.slug}
            className={`svc-block ${i % 2 === 1 ? 'svc-block--reverse' : ''}`}
          >
            <div className="svc-block__media">
              <StripedSlot
                ratio="4-3"
                photo={SERVICE_PHOTOS[s.slug]}
                photoWidth={1000}
                photoAlt={s.title}
              />
            </div>
            <div className="svc-block__body">
              <div className="svc-block__num-row">
                <span className="svc-block__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="svc-block__num-bar" aria-hidden />
                <span>{s.tag}</span>
              </div>
              <h2 className="svc-block__title">{s.title}</h2>
              <p className="svc-block__desc">{s.description}</p>
              <ul className="svc-block__bullets">
                {s.bullets.map((b) => (
                  <li key={b}>
                    <Icon name="check" size={16} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="svc-block__cta">
                <Link to="/contact" className="btn btn--primary btn--sm">
                  Demander un devis <Icon name="arrow-right" size={14} />
                </Link>
                <span className="svc-block__range">{s.range}</span>
              </div>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
