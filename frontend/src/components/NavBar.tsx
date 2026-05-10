import type React from 'react';
import { Link, NavLink } from 'react-router';
import { useAuthStore } from '@/stores/authStore';

export function NavBar(): React.ReactElement {
  const isAuth = useAuthStore((s) => s.token !== null);
  return (
    <nav
      aria-label="Principal"
      style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ccc' }}
    >
      <Link to="/" style={{ fontWeight: 700 }}>
        Climalia
      </Link>
      <NavLink to="/services">Services</NavLink>
      <NavLink to="/realisations">Réalisations</NavLink>
      <NavLink to="/a-propos">À propos</NavLink>
      <NavLink to="/contact">Contact</NavLink>
      <span style={{ marginLeft: 'auto' }}>
        {isAuth ? (
          <NavLink to="/espace-pro/dashboard">Dashboard</NavLink>
        ) : (
          <NavLink to="/espace-pro/login">Espace pro</NavLink>
        )}
      </span>
    </nav>
  );
}
