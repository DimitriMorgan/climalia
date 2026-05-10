import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { logout as apiLogout } from '@/api/auth';
import { ApiError } from '@/api/client';
import { getDocumentDownload, listDocuments } from '@/api/documents';
import type { DocumentFilters as DocumentFiltersInput } from '@/api/documents';
import { DocumentFilters, EMPTY_DOCUMENT_FILTERS } from '@/features/documents/DocumentFilters';
import type { DocumentFiltersState } from '@/features/documents/DocumentFilters';
import { DocumentList } from '@/features/documents/DocumentList';
import { useAuthStore } from '@/stores/authStore';
import type { ApiDocument } from '@/types/api';
import type { UserRole } from '@/types/enums';

const ROLE_BADGE_COLOR: Record<UserRole, string> = {
  ADMIN: '#dc2626',
  EMPLOYEE: '#16a34a',
  PARTNER: '#2563eb',
};

const ROLE_BADGE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  EMPLOYEE: 'Salarié',
  PARTNER: 'Partenaire',
};

export function DashboardPage(): React.ReactElement {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const storeLogout = useAuthStore((s) => s.logout);

  const [filters, setFilters] = useState<DocumentFiltersState>(EMPTY_DOCUMENT_FILTERS);
  const [docs, setDocs] = useState<ReadonlyArray<ApiDocument>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect((): void => {
    if (token === null) {
      void navigate('/espace-pro/login', { replace: true });
    }
  }, [token, navigate]);

  useEffect((): (() => void) => {
    const state = { cancelled: false };
    async function load(): Promise<void> {
      try {
        const apiFilters: DocumentFiltersInput = {
          ...(filters.category === '' ? {} : { category: filters.category }),
          ...(filters.dateFrom === '' ? {} : { dateFrom: filters.dateFrom }),
          ...(filters.dateTo === '' ? {} : { dateTo: filters.dateTo }),
          ...(filters.region === '' ? {} : { region: filters.region }),
        };
        const result = await listDocuments(apiFilters);
        if (!state.cancelled) {
          setDocs(result);
          setError(null);
        }
      } catch (err: unknown) {
        if (!state.cancelled) {
          const message = err instanceof ApiError ? err.message : 'Erreur de chargement.';
          setError(message);
        }
      }
    }
    void load();
    return (): void => { state.cancelled = true; };
  }, [filters.category, filters.dateFrom, filters.dateTo, filters.region]);

  const visibleDocs = filters.search.trim() === ''
    ? docs
    : docs.filter((d): boolean => d.title.toLowerCase().includes(filters.search.trim().toLowerCase()));

  async function handleDownload(id: string): Promise<void> {
    try {
      const meta = await getDocumentDownload(id);
      window.open(meta.fileUrl, '_blank', 'noopener,noreferrer');
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'Erreur de téléchargement.';
      setError(message);
    }
  }

  async function handleLogout(): Promise<void> {
    try {
      await apiLogout();
    } catch {
      // JWT logout is stateless — ignore errors.
    }
    storeLogout();
    void navigate('/espace-pro/login');
  }

  if (user === null) {
    return <p>Chargement…</p>;
  }

  const badgeColor = ROLE_BADGE_COLOR[user.role];
  const badgeLabel = ROLE_BADGE_LABEL[user.role];

  return (
    <section>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Bonjour, {user.firstName} {user.lastName}</h1>
        <span
          aria-label={`Rôle: ${badgeLabel}`}
          style={{
            backgroundColor: badgeColor,
            color: '#fff',
            padding: '0.25rem 0.6rem',
            borderRadius: '0.375rem',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          {badgeLabel}
        </span>
        <button
          type="button"
          onClick={(): void => { void handleLogout(); }}
          style={{ marginLeft: 'auto' }}
        >
          Se déconnecter
        </button>
      </header>

      <DocumentFilters value={filters} onChange={setFilters} />

      {error !== null ? <p role="alert">{error}</p> : null}

      <DocumentList
        items={visibleDocs}
        onDownload={(id): void => { void handleDownload(id); }}
      />
    </section>
  );
}
