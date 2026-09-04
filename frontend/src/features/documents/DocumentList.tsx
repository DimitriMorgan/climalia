import type React from 'react';
import { Icon } from '@/components/Icon';
import { Tag } from '@/components/Tag';
import { CATEGORY_LABELS } from '@/features/documents/labels';
import type { ApiDocument } from '@/types/api';

interface DocumentListProps {
  items: ReadonlyArray<ApiDocument>;
  onDownload: (id: string) => void;
  /** Ouvre l'aperçu en modale (on reste sur le listing). */
  onPreview: (doc: ApiDocument) => void;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function isRecent(iso: string): boolean {
  const uploaded = Date.parse(iso);
  if (Number.isNaN(uploaded)) return false;
  return Date.now() - uploaded < SEVEN_DAYS_MS;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  return new Date(ms).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export function DocumentList({ items, onDownload, onPreview }: DocumentListProps): React.ReactElement {
  if (items.length === 0) {
    return <p className="empty-state">Aucun document à afficher.</p>;
  }
  return (
    <div className="doc-table-wrap">
      <table className="doc-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th
              colSpan={2}
              style={{
                textAlign: 'left',
                padding: '0.75rem 1.25rem',
                background: 'var(--paper-2)',
                borderBottom: '1px solid var(--line)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--ink-mute)',
                fontWeight: 500,
              }}
            >
              Document
            </th>
            <th style={thStyle}>Région</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Taille</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((doc) => (
            <tr key={doc.id} style={{ borderBottom: '1px solid var(--line)' }}>
              <td style={{ width: 56, padding: '1rem 0 1rem 1.25rem', verticalAlign: 'middle' }}>
                <div className="doc-row__icon">
                  <Icon name="doc" size={16} />
                </div>
              </td>
              <td style={{ padding: '1rem 0.75rem', verticalAlign: 'middle' }}>
                <div className="doc-row__title-line">
                  <button
                    type="button"
                    className="doc-row__title doc-row__title--btn"
                    title="Aperçu du document"
                    onClick={(): void => {
                      onPreview(doc);
                    }}
                  >
                    {doc.title}
                  </button>
                  {isRecent(doc.uploadedAt) ? (
                    <Tag accent dot>Nouveau</Tag>
                  ) : null}
                </div>
                <div className="doc-row__sub">
                  <span className="doc-row__cat">
                    {CATEGORY_LABELS[doc.category]}
                  </span>
                  <span>·</span>
                  <span>{formatSize(doc.sizeBytes)}</span>
                </div>
              </td>
              <td
                style={{
                  padding: '1rem 0.75rem',
                  fontSize: 12,
                  color: 'var(--ink-mute)',
                  verticalAlign: 'middle',
                }}
              >
                {doc.region ?? '—'}
              </td>
              <td
                className="num"
                style={{
                  padding: '1rem 0.75rem',
                  fontSize: 12,
                  color: 'var(--ink-mute)',
                  fontFamily: 'var(--font-mono)',
                  verticalAlign: 'middle',
                }}
              >
                {formatDate(doc.uploadedAt)}
              </td>
              <td
                className="num"
                style={{
                  padding: '1rem 0.75rem',
                  fontSize: 12,
                  color: 'var(--ink-mute)',
                  fontFamily: 'var(--font-mono)',
                  verticalAlign: 'middle',
                }}
              >
                {formatSize(doc.sizeBytes)}
              </td>
              <td style={{ padding: '1rem 1.25rem 1rem 0.75rem', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  title="Aperçu sans quitter le listing"
                  onClick={(): void => {
                    onPreview(doc);
                  }}
                >
                  <Icon name="search" size={14} />
                  Aperçu
                </button>{' '}
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={(): void => {
                    onDownload(doc.id);
                  }}
                >
                  <Icon name="download" size={14} />
                  Télécharger
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.75rem',
  background: 'var(--paper-2)',
  borderBottom: '1px solid var(--line)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-mute)',
  fontWeight: 500,
};
