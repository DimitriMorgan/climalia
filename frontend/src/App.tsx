import type React from 'react';
import { Route, Routes } from 'react-router';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
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
        <Route path="espace-pro/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="espace-pro/dashboard" element={<DashboardPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
