import type React from 'react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { Icon } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { useAuthStore } from '@/stores/authStore';

const NAV: ReadonlyArray<{ to: string; label: string }> = [
  { to: '/', label: 'Accueil' },
  { to: '/services', label: 'Services' },
  { to: '/realisations', label: 'Réalisations' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/contact', label: 'Contact' },
];

export function NavBar(): React.ReactElement {
  const isAuth = useAuthStore((s) => s.token !== null);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect((): (() => void) => {
    const onScroll = (): void => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return (): void => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header className={`navbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="navbar__inner">
        <Link to="/" aria-label="Accueil Climalia">
          <Logo />
        </Link>

        <nav className="navbar__nav" aria-label="Principal">
          {NAV.slice(1).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }): string =>
                `navbar__link ${isActive ? 'is-active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__actions">
          <NavLink
            to={isAuth ? '/espace-pro/dashboard' : '/espace-pro/login'}
            className="navbar__pro"
          >
            <Icon name="lock" size={14} /> Espace pro
          </NavLink>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={(): void => {
              void navigate('/contact');
            }}
          >
            Demander un devis
            <Icon name="arrow-right" size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
