import type React from 'react';
import { Link } from 'react-router';
import { Icon } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { Tag } from '@/components/Tag';
import { useT } from '@/stores/contentStore';

const NAV_LINKS: ReadonlyArray<{ to: string; label: string }> = [
  { to: '/', label: 'Accueil' },
  { to: '/services', label: 'Services' },
  { to: '/realisations', label: 'Réalisations' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/contact', label: 'Contact' },
  { to: '/espace-pro/login', label: 'Espace pro' },
];

const SERVICES_LINKS: ReadonlyArray<string> = [
  'Climatisation',
  'Pompes à chaleur',
  'VMC',
  'Entretien annuel',
  'Dépannage',
];

const CERTIFICATIONS: ReadonlyArray<string> = [
  'RGE QualiPAC',
  'RGE QualiClimaElec',
  'Qualibat 5311',
  'Attestation fluides I',
];

export function Footer(): React.ReactElement {
  const t = useT();
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <Logo size={28} />
          <p className="footer__brand-text">{t('footer.tagline')}</p>
          <div className="footer__certs">
            {CERTIFICATIONS.map((c) => (
              <Tag key={c}>{c}</Tag>
            ))}
          </div>
        </div>

        <nav className="footer__col" aria-label="Navigation">
          <div className="footer__heading">Navigation</div>
          <ul className="footer__list">
            {NAV_LINKS.map((n) => (
              <li key={n.to}>
                <Link to={n.to}>{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer__col">
          <div className="footer__heading">Services</div>
          <ul className="footer__list">
            {SERVICES_LINKS.map((s) => (
              <li key={s}>
                <Link to="/services">{s}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer__col--contact">
          <div className="footer__heading">Contact</div>
          <ul className="footer__contact-list">
            <li><Icon name="phone" size={14} /> {t('footer.phone')}</li>
            <li><Icon name="mail" size={14} /> {t('footer.email')}</li>
            <li><Icon name="pin" size={14} /> {t('footer.address')}</li>
          </ul>
        </div>
      </div>

      <div className="footer__legal">
        <span>© {String(year)} {t('footer.legal')}</span>
        <span className="footer__legal-links">
          <a href="#">Mentions légales</a>
          <a href="#">RGPD</a>
          <a href="#">CGV</a>
        </span>
      </div>
    </footer>
  );
}
