import type React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listRealizations } from '@/api/realizations';
import { Counter } from '@/components/Counter';
import { Glyph } from '@/components/Glyph';
import type { GlyphKind } from '@/components/Glyph';
import { Icon } from '@/components/Icon';
import { HERO_PHOTO, projectPhotoFor } from '@/components/photos';
import { Reveal } from '@/components/Reveal';
import { RichText } from '@/components/RichText';
import { SectionLabel } from '@/components/SectionLabel';
import { StripedSlot } from '@/components/StripedSlot';
import { Tag } from '@/components/Tag';
import { useT } from '@/stores/contentStore';
import type { ApiRealization } from '@/types/api';

interface ServicePreviewItem {
  id: string;
  name: string;
  tag: string;
  desc: string;
  bullets: ReadonlyArray<string>;
  range: string;
  glyph: GlyphKind;
}

const SERVICES: ReadonlyArray<ServicePreviewItem> = [
  {
    id: 'clim',
    name: 'Climatisation',
    tag: 'Mono & multi-split',
    desc:
      "Études thermiques et installation de systèmes mono-split, multi-split et gainables. Haute efficacité énergétique, faibles nuisances sonores.",
    bullets: [
      'Climatisation réversible Inverter',
      'Cassettes plafond & gainables tertiaire',
      'Bilan thermique et dimensionnement',
      'Mise en service et fluide frigorigène',
    ],
    range: '— de 18 m² à 1 800 m²',
    glyph: 'wave',
  },
  {
    id: 'pac',
    name: 'Pompes à chaleur',
    tag: 'Air-air & air-eau',
    desc:
      "Solutions PAC adaptées à votre logement ou bâtiment, éligibles MaPrimeRénov' et CEE. Conseil indépendant, pose certifiée QualiPAC.",
    bullets: [
      'PAC air-eau haute température',
      'PAC air-air pour rénovation',
      'Couplage avec ballon thermodynamique',
      'Aides à la rénovation accompagnées',
    ],
    range: '— maison, immeuble, ERP',
    glyph: 'thermal',
  },
  {
    id: 'vmc',
    name: 'VMC',
    tag: 'Simple & double flux',
    desc:
      "Ventilation hygiénique et confort thermique : VMC simple flux, hygro B et double flux à haut rendement avec récupération de chaleur.",
    bullets: [
      'VMC double flux jusqu’à 92 % rendement',
      'Hygroréglable B basse consommation',
      'Audit qualité de l’air intérieur',
      'Maintenance filtres & gaines',
    ],
    range: '— résidentiel & tertiaire',
    glyph: 'flow',
  },
  {
    id: 'maintenance',
    name: 'Entretien annuel',
    tag: 'Contrats récurrents',
    desc:
      "Contrats d'entretien obligatoires et préventifs. Rapport d'intervention numérique, rappels automatiques, intervention sous 5 jours.",
    bullets: [
      'Visite annuelle obligatoire (clim > 4 kW)',
      'Contrôle d’étanchéité fluides',
      'Nettoyage filtres et désinfection',
      'Rapport PDF horodaté',
    ],
    range: '— forfait dès 149 €/an',
    glyph: 'check',
  },
  {
    id: 'depan',
    name: 'Dépannage',
    tag: 'Intervention 7j/7',
    desc:
      "Diagnostic rapide, pièces fréquemment en stock dans nos camions-ateliers. Délai moyen national de 28 h.",
    bullets: [
      'Diagnostic à distance possible',
      'Pièces détachées toutes marques',
      'Recharge et tirage au vide',
      'Devis remis sous 24 h',
    ],
    range: '— 7j/7, France entière',
    glyph: 'bolt',
  },
];

interface Testimonial {
  name: string;
  role: string;
  quote: string;
}

const TESTIMONIALS: ReadonlyArray<Testimonial> = [
  {
    name: 'Hélène Bessac',
    role: 'Particulier — Bordeaux (33)',
    quote:
      "Devis clair, pose impeccable en deux jours sur une maison ancienne. La PAC tourne sans qu'on l'entende et la facture d'hiver a fondu.",
  },
  {
    name: 'Cabinet Verlaine & Associés',
    role: 'Syndic — Lyon (69)',
    quote:
      "Climalia gère 14 résidences pour nous depuis 2023. Tableau de bord partenaire très propre, rapports d'intervention impeccables.",
  },
  {
    name: 'Atelier Mathis',
    role: 'Tertiaire — Strasbourg (67)',
    quote:
      "200 m² de bureaux à climatiser dans un bâtiment classé. L'équipe a trouvé une solution élégante, sans toucher aux façades.",
  },
  {
    name: 'Domaine de Préfailles',
    role: 'Hôtellerie — Loire-Atlantique (44)',
    quote:
      "12 chambres équipées en multi-split silencieux. Coordination irréprochable avec notre planning de saison.",
  },
  {
    name: 'Habitat 31',
    role: 'Bailleur — Toulouse (31)',
    quote:
      "Déploiement de VMC double flux sur 320 logements. Climalia a tenu chaque jalon, communication transparente avec les locataires.",
  },
  {
    name: 'Sophie Mercier',
    role: 'Particulier — Annecy (74)',
    quote:
      "On a comparé trois artisans, Climalia était le seul à venir avec un vrai bilan thermique. Différence de niveau évidente.",
  },
];

const CERTIFICATIONS: ReadonlyArray<{ code: string; label: string }> = [
  { code: 'RGE QualiPAC', label: 'Pompes à chaleur' },
  { code: 'RGE QualiClimaElec', label: 'Climatisation' },
  { code: 'Qualibat 5311', label: 'Génie climatique' },
  { code: 'Attestation de capacité', label: 'Fluides frigorigènes I' },
  { code: 'ISO 9001', label: 'Management qualité' },
  { code: 'Mention RGE', label: 'Reconnu Garant Environnement' },
];

function HeroSection(): React.ReactElement {
  const t = useT();
  return (
    <section className="hero">
      <div className="hero__inner">
        <div>
          <SectionLabel num="01" accent>{t('home.hero.label')}</SectionLabel>
          <h1 className="hero__title">
            <RichText text={t('home.hero.title')} />
          </h1>
          <p className="hero__lede">{t('home.hero.lede')}</p>
          <div className="hero__cta">
            <Link to="/contact" className="btn btn--accent btn--lg">
              {t('home.hero.cta')} <Icon name="arrow-right" size={16} />
            </Link>
            <Link to="/services" className="btn btn--ghost btn--lg">
              {t('home.hero.cta2')}
            </Link>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__orb" aria-hidden />
          <div className="hero__visual-card">
            <StripedSlot
              ratio="4-5"
              caption={t('home.hero.photo.caption')}
              photo={HERO_PHOTO}
              photoWidth={1200}
              photoAlt="Pompe à chaleur extérieure installée par Climalia"
            />
            <div className="hero__chip">
              <div className="hero__chip-tag">
                <span className="hero__chip-dot" aria-hidden />
                {t('home.hero.chip.title')}
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: 13, color: 'var(--ink)' }}>
                {t('home.hero.chip.text')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar(): React.ReactElement {
  const items = [
    { num: 12400, suffix: '+', label: 'Interventions / an' },
    { num: 96, label: 'Départements desservis' },
    { num: 240, label: 'Frigoristes & techniciens' },
    { num: 12, suffix: ' ans', label: "D'expérience terrain" },
  ];
  return (
    <section className="trust">
      <div className="trust__inner">
        <div className="trust__stats">
          {items.map((it, i) => (
            <Reveal key={it.label} delay={i * 80}>
              <div>
                <div className="stat__value">
                  <Counter to={it.num} suffix={it.suffix ?? ''} />
                </div>
                <div className="stat__label">{it.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="trust__certs">
          <span className="trust__certs-label">Certifications & qualifications</span>
          <div className="trust__certs-list">
            {CERTIFICATIONS.map((c) => (
              <div key={c.code} className="trust__cert">
                <span className="trust__cert-code">{c.code}</span>
                <span className="trust__cert-label">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const FIRST_SERVICE: ServicePreviewItem = SERVICES[0] ?? {
  id: 'fallback',
  name: '',
  tag: '',
  desc: '',
  bullets: [],
  range: '',
  glyph: 'wave',
};

function ServicesPreview(): React.ReactElement {
  const t = useT();
  const [active, setActive] = useState(0);
  const current = SERVICES[active] ?? FIRST_SERVICE;
  return (
    <section className="container section-pad">
      <div className="section-head">
        <div>
          <SectionLabel num="02">{t('home.services.label')}</SectionLabel>
          <h2 className="section-head__title"><RichText text={t('home.services.title')} /></h2>
        </div>
        <Link to="/services" className="link-arrow">
          {t('home.services.link')} <Icon name="arrow-right" size={14} />
        </Link>
      </div>

      <div className="svc-preview">
        <div className="svc-rail" role="tablist">
          {SERVICES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active === i}
              onMouseEnter={(): void => {
                setActive(i);
              }}
              onClick={(): void => {
                setActive(i);
              }}
              className={`svc-rail__btn ${active === i ? 'is-active' : ''}`}
            >
              <div className="svc-rail__head">
                <div>
                  <div className="svc-rail__num">
                    {String(i + 1).padStart(2, '0')} / {s.tag}
                  </div>
                  <div className="svc-rail__name">{s.name}</div>
                </div>
                <Icon
                  name="arrow-right"
                  size={16}
                  style={{
                    color: active === i ? 'var(--accent)' : 'var(--ink-mute)',
                    transform: active === i ? 'translateX(2px)' : 'none',
                    transition: 'all .2s',
                  }}
                />
              </div>
            </button>
          ))}
        </div>

        <div className="card card--elevated svc-detail">
          <div className="svc-detail__head">
            <div style={{ flex: 1, minWidth: 240 }}>
              <Tag accent dot>{current.tag}</Tag>
              <h3 className="svc-detail__title">{current.name}</h3>
              <p className="svc-detail__desc">{current.desc}</p>
            </div>
            <Glyph kind={current.glyph} size={120} />
          </div>
          <ul className="svc-detail__bullets">
            {current.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <div className="svc-detail__foot">
            <span className="svc-detail__range">{current.range}</span>
            <Link to="/services" className="btn btn--primary btn--sm">
              Détail prestation <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsMarquee(): React.ReactElement {
  const t = useT();
  const all = [...TESTIMONIALS, ...TESTIMONIALS];
  return (
    <section className="marquee-section section-pad">
      <div className="container" style={{ marginBottom: '3rem' }}>
        <div className="section-head" style={{ marginBottom: 0 }}>
          <div>
            <SectionLabel num="03">{t('home.testimonials.label')}</SectionLabel>
            <h2 className="section-head__title">
              <RichText text={t('home.testimonials.title')} />
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tag dot>Note moyenne 4,9 / 5</Tag>
            <Tag dot>Plus de 1 800 avis</Tag>
          </div>
        </div>
      </div>
      <div className="marquee">
        <div className="marquee__track">
          {all.map((t, i) => (
            <article key={`${t.name}-${String(i)}`} className="testimonial">
              <Icon name="star" size={16} className="testimonial__star" />
              <blockquote>{t.quote}</blockquote>
              <div className="testimonial__foot">
                <div className="testimonial__author">{t.name}</div>
                <div className="testimonial__role">{t.role}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectsPreview(): React.ReactElement {
  const t = useT();
  const [items, setItems] = useState<ReadonlyArray<ApiRealization>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect((): void => {
    listRealizations()
      .then((all) => {
        setItems(all.slice(0, 4));
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Erreur');
      });
  }, []);

  return (
    <section className="container section-pad">
      <div className="section-head">
        <div>
          <SectionLabel num="04">{t('home.projects.label')}</SectionLabel>
          <h2 className="section-head__title"><RichText text={t('home.projects.title')} /></h2>
        </div>
        <Link to="/realisations" className="link-arrow">
          {t('home.projects.link')} <Icon name="arrow-right" size={14} />
        </Link>
      </div>

      {error !== null ? (
        <p role="alert" className="alert alert--bad">Erreur : {error}</p>
      ) : null}

      {items.length === 0 && error === null ? (
        <p className="empty-state">Chargement…</p>
      ) : (
        <ul className="real-grid real-grid--4" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((p, i) => (
            <Reveal key={p.id} delay={i * 80} as="li">
              <Link to="/realisations" className="real-card" style={{ display: 'block', color: 'inherit' }}>
                <StripedSlot
                  photo={projectPhotoFor(i)}
                  src={p.afterImageUrl ?? p.beforeImageUrl}
                  photoWidth={800}
                  photoAlt={p.title}
                  ratio="4-5"
                  className="real-card__slot"
                >
                  <div className="real-card__slot-tag-tr">
                    <Tag accent>{p.equipmentType}</Tag>
                  </div>
                </StripedSlot>
                <div className="real-card__body">
                  <div className="real-card__meta">{p.region}</div>
                  <div className="real-card__title">{p.title}</div>
                  <div className="real-card__sub">
                    <span>{p.type}</span>
                    <span aria-hidden />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </section>
  );
}

function CTA(): React.ReactElement {
  const t = useT();
  return (
    <section className="cta-section">
      <div className="cta-section__inner">
        <div>
          <div className="cta-section__eyebrow">{t('home.cta.eyebrow')}</div>
          <h2 className="cta-section__title">
            <RichText text={t('home.cta.title')} />
          </h2>
        </div>
        <div className="cta-section__col">
          <Link to="/contact" className="btn btn--accent btn--lg">
            {t('home.cta.button')} <Icon name="arrow-right" size={16} />
          </Link>
          <span className="cta-section__phone">
            <Icon name="phone" size={14} /> {t('home.cta.phone')}
          </span>
        </div>
      </div>
    </section>
  );
}

export function HomePage(): React.ReactElement {
  return (
    <>
      <HeroSection />
      <TrustBar />
      <ServicesPreview />
      <TestimonialsMarquee />
      <ProjectsPreview />
      <CTA />
    </>
  );
}
