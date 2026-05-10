import type React from 'react';
import { Outlet } from 'react-router';
import { Footer } from '@/components/Footer';
import { NavBar } from '@/components/NavBar';

export function Layout(): React.ReactElement {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <main style={{ flex: 1, padding: '1rem', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
