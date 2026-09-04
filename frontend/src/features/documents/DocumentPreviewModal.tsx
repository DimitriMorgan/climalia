import type React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ApiError } from '@/api/client';
import { updateDocumentDate } from '@/api/documents';
import { Icon } from '@/components/Icon';
import { formatSize } from '@/features/documents/DocumentList';
import { DocumentViewer } from '@/features/documents/DocumentViewer';
import { CATEGORY_LABELS } from '@/features/documents/labels';
import { useAuthStore } from '@/stores/authStore';
import type { ApiDocument } from '@/types/api';

interface DocumentPreviewModalProps {
  doc: ApiDocument;
  onClose: () => void;
  /** Propagation d'une mise à jour (ex. date métier posée par l'admin). */
  onDocUpdated?: (doc: ApiDocument) => void;
}

/**
 * Aperçu d'un document en modale : consultation (zoom, rotation,
 * téléchargement) sans quitter le listing. « Pleine page » ouvre la page
 * détail deep-linkable. L'admin peut y poser/retirer la date métier qui
 * alimente le calendrier.
 */
export function DocumentPreviewModal({ doc, onClose, onDocUpdated }: DocumentPreviewModalProps): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  useEffect((): (() => void) => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return (): void => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-modal-title"
      onClick={onClose}
    >
      <div className="doc-modal" onClick={(e): void => { e.stopPropagation(); }}>
        <div className="doc-modal__head">
          <div style={{ minWidth: 0 }}>
            <h2 id="doc-modal-title" className="viewer__title">{doc.title}</h2>
            <div className="viewer__meta">
              <span className="tag">{CATEGORY_LABELS[doc.category]}</span>
              {doc.region !== null ? <span className="tag">{doc.region}</span> : null}
              <span>{formatSize(doc.sizeBytes)}</span>
              <span>·</span>
              <span>
                Déposé le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </span>
              {doc.documentDate !== null ? (
                <>
                  <span>·</span>
                  <span>
                    <Icon name="calendar" size={12} /> Daté du {new Date(doc.documentDate).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                  </span>
                </>
              ) : null}
            </div>
            {isAdmin ? <DocumentDateEditor doc={doc} onDocUpdated={onDocUpdated} /> : null}
          </div>
          <div className="doc-modal__actions">
            <Link to={`/espace-pro/documents/${doc.id}`} className="btn btn--ghost btn--sm">
              Pleine page <Icon name="arrow-up-right" size={13} />
            </Link>
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              onClick={onClose}
              aria-label="Fermer l'aperçu"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>
        <DocumentViewer key={doc.id} doc={doc} />
      </div>
    </div>
  );
}

interface DocumentDateEditorProps {
  doc: ApiDocument;
  onDocUpdated?: ((doc: ApiDocument) => void) | undefined;
}

/** Contrôle admin : pose, déplace ou retire la date métier du document. */
function DocumentDateEditor({ doc, onDocUpdated }: DocumentDateEditorProps): React.ReactElement {
  const [value, setValue] = useState(doc.documentDate ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = value !== (doc.documentDate ?? '');

  async function save(next: string | null): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateDocumentDate(doc.id, next);
      setValue(updated.documentDate ?? '');
      onDocUpdated?.(updated);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Mise à jour impossible.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="doc-modal__date">
      <label className="doc-modal__date-label" htmlFor="doc-date-input">
        Date au calendrier
      </label>
      <input
        id="doc-date-input"
        type="date"
        className="field"
        style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: 13 }}
        value={value}
        disabled={saving}
        onChange={(e): void => { setValue(e.target.value); }}
      />
      {dirty && value !== '' ? (
        <button type="button" className="btn btn--primary btn--sm" disabled={saving}
          onClick={(): void => { void save(value); }}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      ) : null}
      {doc.documentDate !== null ? (
        <button type="button" className="btn btn--ghost btn--sm" disabled={saving}
          onClick={(): void => { void save(null); }}>
          Retirer du calendrier
        </button>
      ) : null}
      {error !== null ? <span className="doc-modal__date-error" role="alert">{error}</span> : null}
    </div>
  );
}
