import type React from 'react';
import { Icon } from '@/components/Icon';
import { RichText } from '@/components/RichText';
import { SectionLabel } from '@/components/SectionLabel';
import { ContactForm } from '@/features/contact/ContactForm';
import { useT } from '@/stores/contentStore';

const HOURS: ReadonlyArray<{ day: string; hours: string }> = [
  { day: 'Lundi — Vendredi', hours: '08h00 — 19h00' },
  { day: 'Samedi', hours: '09h00 — 13h00' },
  { day: 'Dimanche', hours: 'Astreinte 24/7' },
];

export function ContactPage(): React.ReactElement {
  const t = useT();
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <SectionLabel num="01" accent>{t('contact.hero.label')}</SectionLabel>
          <h1 className="page-hero__title"><RichText text={t('contact.hero.title')} /></h1>
        </div>
      </section>

      <section className="container section-pad">
        <div className="contact-layout">
          <ContactForm />

          <aside className="contact-aside">
            <div className="card">
              <div className="aside-card__label">{t('contact.phone.label')}</div>
              <a
                href={`tel:${t('contact.phone.number').replaceAll(' ', '')}`}
                className="aside-card__big"
              >
                {t('contact.phone.number')}
              </a>
              <p style={{ marginTop: '0.75rem', fontSize: 14 }}>
                {t('contact.phone.hours')}
              </p>
            </div>

            <div className="card">
              <div className="aside-card__label">Email</div>
              <a href={`mailto:${t('contact.email')}`} style={{ display: 'block', marginTop: '0.75rem', fontSize: 18, fontWeight: 500 }}>
                {t('contact.email')}
              </a>
              <p style={{ marginTop: '0.75rem', fontSize: 14 }}>
                Réponse écrite sous 24 h ouvrées.
              </p>
            </div>

            <div className="card">
              <div className="aside-card__label">Horaires</div>
              <ul className="aside-card__hours">
                {HOURS.map((h) => (
                  <li key={h.day}>
                    <span>{h.day}</span>
                    <span>{h.hours}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card card--ink">
              <div className="aside-card__label">À noter</div>
              <p style={{ marginTop: '0.75rem', fontSize: 14, color: 'rgba(246, 245, 241, 0.9)' }}>
                Climalia ne propose pas de prise de rendez-vous en ligne automatisée. Chaque
                dossier est traité par un chargé d&apos;études dédié — pour un devis vraiment adapté.
              </p>
              <p style={{ marginTop: '0.75rem', fontSize: 13, color: 'rgba(246, 245, 241, 0.7)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon name="clock" size={13} /> Réponse sous 72 h ouvrées
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
