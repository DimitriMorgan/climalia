import type React from 'react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ApiError } from '@/api/client';
import { getDocument } from '@/api/documents';
import { ProShell } from '@/components/ProShell';
import { formatSize } from '@/features/documents/DocumentList';
import { DocumentViewer } from '@/features/documents/DocumentViewer';
import { CATEGORY_LABELS } from '@/features/documents/labels';
import { useAuthStore } from '@/stores/authStore';
import type { ApiDocument } from '@/types/api';

export function DocumentDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const [meta, setMeta] = useState<ApiDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect((): (() => void) => {
    const state = { cancelled: false };
    async function load(): Promise<void> {
      if (id === undefined) return;
      try {
        const doc = await getDocument(id);
        if (!state.cancelled) setMeta(doc);
      } catch (err: unknown) {
        if (!state.cancelled) {
          setError(err instanceof ApiError ? err.message : 'Document introuvable.');
        }
      }
    }
    void load();
    return (): void => {
      state.cancelled = true;
    };
  }, [id]);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <ProShell>
      <div className="viewer">
        <div className="viewer__head">
          <div className="viewer__head-main">
            <Link to="/espace-pro/dashboard" className="btn btn--ghost btn--sm">
              ← Documents
            </Link>
            <div>
              <h1 className="viewer__title">{meta?.title ?? 'Document'}</h1>
              {meta !== null ? (
                <div className="viewer__meta">
                  <span className="tag">{CATEGORY_LABELS[meta.category]}</span>
                  {meta.region !== null ? <span className="tag">{meta.region}</span> : null}
                  <span>{formatSize(meta.sizeBytes)}</span>
                  <span>·</span>
                  <span>
                    {new Date(meta.uploadedAt).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                  </span>
                  {isAdmin && meta.uploadedBy != null ? (
                    <>
                      <span>·</span>
                      <span>Déposé par {meta.uploadedBy}</span>
                    </>
                  ) : null}
                </div>
              ) : null}
              {isAdmin && meta?.assignedClients !== undefined && meta.assignedClients.length > 0 ? (
                <div className="viewer__meta" style={{ marginTop: '0.35rem' }}>
                  <span style={{ color: 'var(--ink-mute)' }}>Affecté à :</span>
                  {meta.assignedClients.map((c) => (
                    <span key={c.id} className="tag">{c.label}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {error !== null ? (
          <p role="alert" className="alert alert--bad" style={{ margin: '1rem 1.5rem 0' }}>{error}</p>
        ) : null}

        {meta !== null ? (
          <DocumentViewer key={meta.id} doc={meta} />
        ) : error === null ? (
          <p className="empty-state">Chargement…</p>
        ) : null}
      </div>
    </ProShell>
  );
}
