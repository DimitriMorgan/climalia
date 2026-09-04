import type React from 'react';
import { Route, Routes } from 'react-router';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AboutPage } from '@/pages/AboutPage';
import { CalendarAdminPage } from '@/pages/CalendarAdminPage';
import { ComptesAdminPage } from '@/pages/ComptesAdminPage';
import { ContactPage } from '@/pages/ContactPage';
import { ContentAdminPage } from '@/pages/ContentAdminPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DepotPage } from '@/pages/DepotPage';
import { DevisAdminPage } from '@/pages/DevisAdminPage';
import { DocumentDetailPage } from '@/pages/DocumentDetailPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RealizationsAdminPage } from '@/pages/RealizationsAdminPage';
import { RealizationsPage } from '@/pages/RealizationsPage';
import { ServicesPage } from '@/pages/ServicesPage';

export function App(): React.ReactElement {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="realisations" element={<RealizationsPage />} />
        <Route path="a-propos" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="espace-pro/login" element={<LoginPage />} />
      {/* L'éditeur n'a pas accès aux documents : profil purement éditorial. */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'EMPLOYEE', 'PARTNER', 'CLIENT']} />}>
        <Route path="espace-pro/dashboard" element={<DashboardPage />} />
        <Route path="espace-pro/documents/:id" element={<DocumentDetailPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE', 'ADMIN']} />}>
        <Route path="espace-pro/depot" element={<DepotPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="espace-pro/calendrier" element={<CalendarAdminPage />} />
        <Route path="espace-pro/devis" element={<DevisAdminPage />} />
        <Route path="espace-pro/comptes" element={<ComptesAdminPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['EDITOR', 'ADMIN']} />}>
        <Route path="espace-pro/realisations" element={<RealizationsAdminPage />} />
        <Route path="espace-pro/contenu" element={<ContentAdminPage />} />
      </Route>
    </Routes>
  );
}
