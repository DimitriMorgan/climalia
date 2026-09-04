import type React from 'react';
import { RichText } from '@/components/RichText';
import { SectionLabel } from '@/components/SectionLabel';
import { ServiceList } from '@/features/services/ServiceList';
import { useT } from '@/stores/contentStore';

const METHOD: ReadonlyArray<{ n: string; title: string; body: string }> = [
  {
    n: '01',
    title: 'Étude',
    body: "Bilan thermique, dimensionnement et sélection des équipements adaptés à votre logement ou bâtiment.",
  },
  {
    n: '02',
    title: 'Devis',
    body: "Devis détaillé sous 72 h, transparent sur les aides MaPrimeRénov' et CEE auxquelles vous avez droit.",
  },
  {
    n: '03',
    title: 'Pose',
    body: "Installation par notre équipe certifiée, planning communiqué à l'avance, finitions soignées.",
  },
  {
    n: '04',
    title: 'Suivi',
    body: "Mise en service, prise en main, contrat d'entretien optionnel et garantie pièces et main-d’œuvre.",
  },
];

export function ServicesPage(): React.ReactElement {
  const t = useT();
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <SectionLabel num="01" accent>{t('services.hero.label')}</SectionLabel>
          <h1 className="page-hero__title">
            <RichText text={t('services.hero.title')} />
          </h1>
          <p className="page-hero__lede">{t('services.hero.lede')}</p>
        </div>
      </section>

      <section className="container section-pad">
        <ServiceList />
      </section>

      <section className="section-pad section-pad--alt">
        <div className="container">
          <SectionLabel num="06">Notre méthode</SectionLabel>
          <h2 className="section-head__title" style={{ maxWidth: '20ch' }}>
            Un process en quatre temps, du devis à la mise en service.
          </h2>
          <div className="method-grid">
            {METHOD.map((step) => (
              <div key={step.n}>
                <div className="method-step__num">{step.n}</div>
                <div className="method-step__title">{step.title}</div>
                <p className="method-step__body">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
