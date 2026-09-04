import type React from 'react';
import { useState } from 'react';
import { Counter } from '@/components/Counter';
import { FranceMap } from '@/components/FranceMap';
import { Icon } from '@/components/Icon';
import type { IconName } from '@/components/Icon';
import { Reveal } from '@/components/Reveal';
import { RichText } from '@/components/RichText';
import { SectionLabel } from '@/components/SectionLabel';
import { useT } from '@/stores/contentStore';

interface TimelineEntry {
  year: string;
  title: string;
  body: string;
}

const TIMELINE: ReadonlyArray<TimelineEntry> = [
  {
    year: '2014',
    title: 'Atelier fondateur',
    body: "Climalia naît à Lyon autour d'une équipe de cinq frigoristes, avec une obsession : rendre l'installation thermique aussi soignée qu'une menuiserie d'art.",
  },
  {
    year: '2017',
    title: 'Réseau Sud-Est',
    body: "Ouverture des agences de Marseille et Grenoble. Premier contrat-cadre avec un bailleur social régional.",
  },
  {
    year: '2020',
    title: 'Cap PAC',
    body: "Climalia se positionne sur la pompe à chaleur résidentielle. Certification QualiPAC pour l'ensemble des techniciens.",
  },
  {
    year: '2022',
    title: 'Couverture nationale',
    body: "Maillage de 14 agences et d'un réseau de 38 artisans partenaires sélectionnés sur charte qualité.",
  },
  {
    year: '2026',
    title: "Aujourd'hui",
    body: "Plus de 12 400 interventions par an, présent dans 96 départements, équipe de 240 collaborateurs.",
  },
];

interface ValueEntry {
  icon: IconName;
  title: string;
  body: string;
}

const VALUES: ReadonlyArray<ValueEntry> = [
  {
    icon: 'tools',
    title: 'Geste artisan',
    body: "Chaque chantier est mené par un binôme dédié. Pas de sous-traitance déguisée, pas de relais anonyme.",
  },
  {
    icon: 'leaf',
    title: 'Sobriété énergétique',
    body: "Nous dimensionnons au plus juste, recommandons des PAC à fluides faibles GWP, et privilégions la rénovation à la pose neuve.",
  },
  {
    icon: 'shield',
    title: 'Engagements écrits',
    body: "Délais, prix et garantie inscrits noir sur blanc. Pénalités contractuelles en cas de dépassement de notre fait.",
  },
  {
    icon: 'spark',
    title: 'Maillage local',
    body: "240 collaborateurs et 38 artisans partenaires implantés dans 96 départements. Le SAV reste à portée de camion.",
  },
];

const REGIONS: ReadonlyArray<string> = [
  'Île-de-France',
  'Auvergne-Rhône-Alpes',
  "Provence-Alpes-Côte d'Azur",
  'Hauts-de-France',
  'Grand Est',
  'Bretagne',
  'Nouvelle-Aquitaine',
  'Occitanie',
];

const CERTIFICATIONS: ReadonlyArray<{ code: string; label: string }> = [
  { code: 'RGE QualiPAC', label: 'Pompes à chaleur' },
  { code: 'RGE QualiClimaElec', label: 'Climatisation' },
  { code: 'Qualibat 5311', label: 'Génie climatique' },
  { code: 'Attestation de capacité', label: 'Fluides frigorigènes I' },
  { code: 'ISO 9001', label: 'Management qualité' },
  { code: 'Mention RGE', label: 'Reconnu Garant Environnement' },
];

export function AboutPage(): React.ReactElement {
  const t = useT();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner page-hero__split">
          <div>
            <SectionLabel num="01" accent>{t('about.hero.label')}</SectionLabel>
            <h1 className="page-hero__title">
              <RichText text={t('about.hero.title')} />
            </h1>
          </div>
          <p className="page-hero__lede">{t('about.hero.lede')}</p>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-pad section-pad--alt">
        <div className="container">
          <SectionLabel num="02">Histoire</SectionLabel>
          <h2 className="section-head__title" style={{ maxWidth: '24ch', marginBottom: '1rem' }}>
            Douze ans à essayer de mieux poser que les autres.
          </h2>
          <div className="timeline">
            {TIMELINE.map((t, i) => (
              <Reveal key={t.year} delay={i * 60}>
                <div className="timeline__step">
                  <div className={`timeline__dot ${i === TIMELINE.length - 1 ? 'timeline__dot--accent' : ''}`} />
                  <div className="timeline__year">{t.year}</div>
                  <div className="timeline__title">{t.title}</div>
                  <p className="timeline__body">{t.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-pad">
        <div className="container">
          <div className="grid-12">
            <div style={{ gridColumn: 'span 4' }}>
              <SectionLabel num="03">Valeurs</SectionLabel>
              <h2 className="section-head__title" style={{ marginTop: '1.25rem' }}>
                Quatre principes <em>qui ne bougent pas</em>.
              </h2>
            </div>
            <div style={{ gridColumn: 'span 8' }}>
              <div className="values-grid">
                {VALUES.map((v) => (
                  <div key={v.title} className="values-grid__cell">
                    <Icon name={v.icon} size={22} className="values-grid__icon" />
                    <div className="values-grid__title">{v.title}</div>
                    <p className="values-grid__body">{v.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="section-pad section-pad--alt" id="coverage">
        <div className="container">
          <SectionLabel num="04">Couverture nationale</SectionLabel>
          <h2 className="section-head__title" style={{ maxWidth: '20ch' }}>
            14 agences, 38 artisans partenaires, <em>96 départements</em>.
          </h2>

          <div className="grid-12" style={{ marginTop: '3rem', alignItems: 'center' }}>
            <div style={{ gridColumn: 'span 8' }}>
              <FranceMap
                onSelect={setSelected}
                highlighted={selected !== null ? [selected] : []}
                height={620}
              />
            </div>
            <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card">
                <div className="aside-card__label">Délai d&apos;intervention moyen</div>
                <div style={{ marginTop: '0.5rem', fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 500, letterSpacing: '-0.04em' }}>
                  <Counter to={5} /> <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-mute)' }}>jours ouvrés</span>
                </div>
                <p style={{ marginTop: '0.75rem', fontSize: 14 }}>
                  Toutes régions confondues, hors astreinte dépannage 24/7.
                </p>
              </div>

              <div className="card">
                <div className="aside-card__label">Régions couvertes</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0', display: 'grid', gap: '0.5rem', fontSize: 14 }}>
                  {REGIONS.map((r) => (
                    <li
                      key={r}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: selected === r ? 'var(--accent)' : 'var(--ink)',
                        fontWeight: selected === r ? 500 : 400,
                      }}
                    >
                      <span>{r}</span>
                      <Icon name="check" size={14} style={{ color: 'var(--accent)' }} />
                    </li>
                  ))}
                  <li style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--line)', color: 'var(--ink-mute)' }}>
                    + 4 autres régions
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="section-pad">
        <div className="container">
          <SectionLabel num="05">Certifications</SectionLabel>
          <h2 className="section-head__title" style={{ maxWidth: '24ch', marginBottom: '3rem' }}>
            Six labels, audités chaque année.
          </h2>
          <div className="cert-grid">
            {CERTIFICATIONS.map((c) => (
              <div key={c.code} className="cert-grid__cell">
                <div>
                  <div className="cert-grid__title">{c.code}</div>
                  <div className="cert-grid__sub">{c.label}</div>
                </div>
                <Icon name="shield" size={22} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
