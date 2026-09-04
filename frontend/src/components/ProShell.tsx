import type React from 'react';
import { NavLink } from 'react-router';
import { logout as apiLogout } from '@/api/auth';
import { Icon } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types/enums';

export const ROLE_BADGE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  EMPLOYEE: 'Salarié',
  PARTNER: 'Partenaire',
  EDITOR: 'Éditeur',
  CLIENT: 'Client',
};

interface ProNavItem {
  to: string;
  label: string;
  roles: ReadonlyArray<UserRole>;
}

const NAV_ITEMS: ReadonlyArray<ProNavItem> = [
  { to: '/espace-pro/dashboard', label: 'Documents', roles: ['ADMIN', 'EMPLOYEE', 'PARTNER', 'CLIENT'] },
  { to: '/espace-pro/depot', label: 'Dépôt', roles: ['ADMIN', 'EMPLOYEE'] },
  { to: '/espace-pro/calendrier', label: 'Calendrier', roles: ['ADMIN'] },
  { to: '/espace-pro/devis', label: 'Devis', roles: ['ADMIN'] },
  { to: '/espace-pro/comptes', label: 'Clients & comptes', roles: ['ADMIN'] },
  { to: '/espace-pro/realisations', label: 'Réalisations', roles: ['ADMIN', 'EDITOR'] },
  { to: '/espace-pro/contenu', label: 'Contenu du site', roles: ['ADMIN', 'EDITOR'] },
];

interface ProShellProps {
  children: React.ReactNode;
}

/**
 * Coquille commune des pages espace pro : topbar (marque, badge de rôle,
 * utilisateur, déconnexion) + navigation par onglets selon le rôle.
 */
export function ProShell({ children }: ProShellProps): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const storeLogout = useAuthStore((s) => s.logout);

  async function handleLogout(): Promise<void> {
    try {
      await apiLogout();
    } catch {
      // JWT stateless — on ignore.
    }
    storeLogout();
  }

  const role = user?.role ?? null;
  const items = role === null ? [] : NAV_ITEMS.filter((item) => item.roles.includes(role));
  const initials =
    user !== null
      ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
      : '··';

  return (
    <div className="dash">
      <header className="dash__topbar">
        <div className="dash__topbar-inner">
          <div className="dash__topbar-brand">
            <Logo size={22} />
            <span className="dash__topbar-divider" aria-hidden />
            <div className="dash__topbar-context">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>
                Espace pro
              </span>
              {role !== null ? (
                <span className={`role-badge role-badge--${role}`}>
                  {ROLE_BADGE_LABEL[role]}
                </span>
              ) : null}
            </div>
          </div>
          <div className="dash__topbar-actions">
            <div className="dash__user">
              <div
                className="dash__avatar"
                style={{ background: role === 'PARTNER' || role === 'CLIENT' ? 'var(--accent)' : 'var(--ink)' }}
              >
                {initials}
              </div>
              {user !== null ? (
                <div className="dash__user-meta">
                  <div className="dash__user-name">{user.firstName} {user.lastName}</div>
                  <div className="dash__user-role">{ROLE_BADGE_LABEL[user.role]}</div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              onClick={(): void => { void handleLogout(); }}
              title="Déconnexion"
              aria-label="Déconnexion"
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        </div>
        {items.length > 1 ? (
          <nav className="pro-nav" aria-label="Sections de l'espace pro">
            <div className="pro-nav__inner">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }): string => `pro-nav__link ${isActive ? 'is-active' : ''}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        ) : null}
      </header>
      {children}
    </div>
  );
}
