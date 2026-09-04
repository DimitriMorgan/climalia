import type React from 'react';
import { useEffect, useState } from 'react';
import { ApiError } from '@/api/client';
import { downloadDocument, fetchDocumentFile } from '@/api/documents';
import { Icon } from '@/components/Icon';
import type { ApiDocument } from '@/types/api';

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

type PreviewState =
  | { status: 'loading' }
  | { status: 'ready'; url: string; kind: 'image' | 'pdf' | 'other' }
  | { status: 'external'; url: string }
  | { status: 'unavailable' };

interface DocumentViewerProps {
  doc: ApiDocument;
}

/**
 * Visionneuse de document : toolbar (zoom, rotation, téléchargement) + zone
 * d'affichage. Le fichier est streamé derrière le voter (blob), les documents
 * hérités renvoient leur URL externe. Utilisée par la page détail et par la
 * modale d'aperçu du listing.
 *
 * Monter avec `key={doc.id}` : l'état (chargement, zoom, rotation) est
 * réinitialisé par remontage quand on change de document.
 */
export function DocumentViewer({ doc }: DocumentViewerProps): React.ReactElement {
  const [preview, setPreview] = useState<PreviewState>({ status: 'loading' });
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect((): (() => void) => {
    const state = { cancelled: false, objectUrl: null as string | null };
    async function load(): Promise<void> {
      try {
        const file = await fetchDocumentFile(doc.id);
        if (state.cancelled) return;
        if (file.kind === 'external') {
          setPreview({ status: 'external', url: file.url });
          return;
        }
        const url = URL.createObjectURL(file.blob);
        state.objectUrl = url;
        const kind = file.mimeType.startsWith('image/')
          ? 'image'
          : file.mimeType === 'application/pdf'
            ? 'pdf'
            : 'other';
        setPreview({ status: 'ready', url, kind });
      } catch (err: unknown) {
        if (!state.cancelled) {
          setError(err instanceof ApiError ? err.message : 'Aperçu indisponible.');
          setPreview({ status: 'unavailable' });
        }
      }
    }
    void load();
    return (): void => {
      state.cancelled = true;
      if (state.objectUrl !== null) URL.revokeObjectURL(state.objectUrl);
    };
  }, [doc.id]);

  async function handleDownload(): Promise<void> {
    setError(await downloadDocument(doc.id));
  }

  const zoomOut = (): void => { setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100)); };
  const zoomIn = (): void => { setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100)); };
  const rotateLeft = (): void => { setRotation((r) => (r + 270) % 360); };
  const rotateRight = (): void => { setRotation((r) => (r + 90) % 360); };
  const resetView = (): void => { setZoom(1); setRotation(0); };

  return (
    <div className="viewer__pane">
      <div className="viewer__bar">
        <div className="viewer__toolbar" role="toolbar" aria-label="Affichage du document">
          <button type="button" className="btn btn--ghost btn--icon" onClick={zoomOut}
            disabled={zoom <= ZOOM_MIN} title="Zoom arrière" aria-label="Zoom arrière">
            −
          </button>
          <button type="button" className="viewer__zoom-label" onClick={resetView}
            title="Réinitialiser l'affichage">
            {Math.round(zoom * 100)} %
          </button>
          <button type="button" className="btn btn--ghost btn--icon" onClick={zoomIn}
            disabled={zoom >= ZOOM_MAX} title="Zoom avant" aria-label="Zoom avant">
            +
          </button>
          <span className="viewer__toolbar-sep" aria-hidden />
          <button type="button" className="btn btn--ghost btn--icon" onClick={rotateLeft}
            title="Pivoter à gauche" aria-label="Pivoter à gauche">
            ⟲
          </button>
          <button type="button" className="btn btn--ghost btn--icon" onClick={rotateRight}
            title="Pivoter à droite" aria-label="Pivoter à droite">
            ⟳
          </button>
          <span className="viewer__toolbar-sep" aria-hidden />
          <button type="button" className="btn btn--primary btn--sm"
            onClick={(): void => { void handleDownload(); }}>
            <Icon name="download" size={14} /> Télécharger
          </button>
        </div>
      </div>

      {error !== null ? (
        <p role="alert" className="alert alert--bad" style={{ margin: '0.75rem 1.5rem 0' }}>{error}</p>
      ) : null}

      <div className="viewer__stage">
        {preview.status === 'loading' ? (
          <p className="empty-state">Chargement de l&apos;aperçu…</p>
        ) : preview.status === 'external' ? (
          <div className="viewer__placeholder">
            <Icon name="doc" size={40} />
            <p>Ce document est hébergé en dehors de la plateforme.</p>
            <a href={preview.url} target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--sm">
              Ouvrir le document <Icon name="arrow-up-right" size={14} />
            </a>
          </div>
        ) : preview.status === 'unavailable' ? (
          <div className="viewer__placeholder">
            <Icon name="doc" size={40} />
            <p>Aperçu indisponible pour ce document.</p>
          </div>
        ) : preview.kind === 'other' ? (
          <div className="viewer__placeholder">
            <Icon name="doc" size={40} />
            <p>Pas d&apos;aperçu pour ce type de fichier ({doc.mimeType}).</p>
            <button type="button" className="btn btn--primary btn--sm"
              onClick={(): void => { void handleDownload(); }}>
              <Icon name="download" size={14} /> Télécharger
            </button>
          </div>
        ) : (
          <div
            className="viewer__content"
            style={{ transform: `scale(${String(zoom)}) rotate(${String(rotation)}deg)` }}
          >
            {preview.kind === 'image' ? (
              <img src={preview.url} alt={doc.title} className="viewer__img" />
            ) : (
              <iframe src={preview.url} title={doc.title} className="viewer__pdf" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
