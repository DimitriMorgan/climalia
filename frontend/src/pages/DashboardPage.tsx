import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/api/client';
import { downloadDocument, listDocuments } from '@/api/documents';
import type { DocumentFilters as DocumentFiltersInput } from '@/api/documents';
import { Counter } from '@/components/Counter';
import { ProShell, ROLE_BADGE_LABEL } from '@/components/ProShell';
import {
  DocumentFilters,
  EMPTY_DOCUMENT_FILTERS,
} from '@/features/documents/DocumentFilters';
import type { DocumentFiltersState } from '@/features/documents/DocumentFilters';
import { DocumentList } from '@/features/documents/DocumentList';
import { DocumentPreviewModal } from '@/features/documents/DocumentPreviewModal';
import { CATEGORY_LABELS } from '@/features/documents/labels';
import { useAuthStore } from '@/stores/authStore';
import type { ApiDocument } from '@/types/api';
import type { DocumentCategory } from '@/types/enums';

export function DashboardPage(): React.ReactElement {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [filters, setFilters] = useState<DocumentFiltersState>(EMPTY_DOCUMENT_FILTERS);
  const [docs, setDocs] = useState<ReadonlyArray<ApiDocument>>([]);
  const [newCount, setNewCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ApiDocument | null>(null);

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
          const now = Date.now();
          const recent = result.filter((d) => {
            const ms = Date.parse(d.uploadedAt);
            return !Number.isNaN(ms) && now - ms < 7 * 24 * 60 * 60 * 1000;
          }).length;
          setDocs(result);
          setNewCount(recent);
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
    return (): void => {
      state.cancelled = true;
    };
  }, [filters.category, filters.dateFrom, filters.dateTo, filters.region]);

  const visibleDocs = useMemo(
    () =>
      filters.search.trim() === ''
        ? docs
        : docs.filter((d) =>
          d.title.toLowerCase().includes(filters.search.trim().toLowerCase()),
        ),
    [docs, filters.search],
  );

  async function handleDownload(id: string): Promise<void> {
    setError(await downloadDocument(id));
  }

  const cats = useMemo(() => {
    const m = new Map<DocumentCategory, number>();
    for (const d of docs) m.set(d.category, (m.get(d.category) ?? 0) + 1);
    return [...m.entries()];
  }, [docs]);

  if (user === null) {
    return (
      <section className="container section-pad">
        <p className="empty-state">Chargement…</p>
      </section>
    );
  }

  const isPartner = user.role === 'PARTNER';
  const isEmployee = user.role === 'EMPLOYEE';

  return (
    <ProShell>
      {/* Banner */}
      <div className={`dash__banner ${isPartner ? 'dash__banner--partner' : ''}`}>
        <div className="dash__banner-pattern" aria-hidden />
        <div className="dash__banner-inner">
          <div>
            <div className="dash__banner-eyebrow">
              {ROLE_BADGE_LABEL[user.role]} {user.region !== null ? `· ${user.region}` : ''}
            </div>
            <h1 className="dash__banner-title">
              Bonjour, {user.firstName}.
            </h1>
            <p className="dash__banner-desc">
              {isEmployee
                ? "Vos plannings, fiches techniques équipement, contrats des clients qui vous sont assignés et ressources internes."
                : isPartner
                  ? "Vos rapports d'intervention, certificats d'entretien, factures et contrats de maintenance pour les sites que vous gérez."
                  : "Vue d'ensemble : utilisateurs, documents, contrats et activité de l'organisation."}
            </p>
          </div>
          <div className="dash__banner-stats">
            <DashStat
              label={isEmployee ? 'Interventions' : isPartner ? 'Sites gérés' : 'Utilisateurs'}
              value={isEmployee ? 12 : isPartner ? 14 : 240}
            />
            <DashStat label="Documents" value={docs.length} />
            <DashStat label="Nouveaux" value={newCount} accent />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="dash__body">
        <aside>
          <div className="dash__rail-label">Catégories</div>
          <div className="dash__rail-list">
            <CatBtn
              label="Tous les documents"
              count={docs.length}
              active={filters.category === ''}
              onClick={(): void => {
                setFilters({ ...filters, category: '' });
              }}
            />
            {cats.map(([cat, count]) => (
              <CatBtn
                key={cat}
                label={CATEGORY_LABELS[cat]}
                count={count}
                active={filters.category === cat}
                onClick={(): void => {
                  setFilters({ ...filters, category: cat as DocumentFiltersState['category'] });
                }}
              />
            ))}
          </div>

          <div className="card card--ink" style={{ marginTop: '2rem', padding: '1.25rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)' }}>
              {isPartner ? 'Vue partenaire' : isEmployee ? 'Vue employé' : 'Vue admin'}
            </div>
            <p style={{ marginTop: '0.5rem', fontSize: 14 }}>
              {isPartner
                ? "Vous ne voyez que les documents des sites que vous gérez."
                : isEmployee
                  ? "Accès aux ressources internes, fiches techniques équipement et contrats clients qui vous sont assignés."
                  : "Vue complète sur tous les documents de l'organisation."}
            </p>
          </div>
        </aside>

        <main className="dash__main">
          <DocumentFilters
            value={filters}
            onChange={setFilters}
            resultCount={visibleDocs.length}
          />

          {error !== null ? (
            <p role="alert" className="alert alert--bad">{error}</p>
          ) : null}

          <DocumentList
            items={visibleDocs}
            onDownload={(id): void => {
              void handleDownload(id);
            }}
            onPreview={setPreviewDoc}
          />
        </main>
      </div>

      {previewDoc !== null ? (
        <DocumentPreviewModal
          doc={previewDoc}
          onClose={(): void => { setPreviewDoc(null); }}
          onDocUpdated={(updated): void => {
            setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
            setPreviewDoc(updated);
          }}
        />
      ) : null}
    </ProShell>
  );
}

interface DashStatProps {
  label: string;
  value: number;
  accent?: boolean;
}

function DashStat({ label, value, accent }: DashStatProps): React.ReactElement {
  return (
    <div className="dash-stat">
      <div className="dash-stat__label">{label}</div>
      <div className={`dash-stat__value ${accent === true ? 'dash-stat__value--accent' : ''}`}>
        <Counter to={value} />
      </div>
    </div>
  );
}

interface CatBtnProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function CatBtn({ label, count, active, onClick }: CatBtnProps): React.ReactElement {
  return (
    <button type="button" onClick={onClick} className={`cat-btn ${active ? 'is-active' : ''}`}>
      <span className="cat-btn__name">
        <span>{label}</span>
      </span>
      <span className="cat-btn__count num">{count}</span>
    </button>
  );
}

