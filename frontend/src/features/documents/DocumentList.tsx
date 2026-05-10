import type React from 'react';
import type { ApiDocument } from '@/types/api';

interface DocumentListProps {
  items: ReadonlyArray<ApiDocument>;
  onDownload: (id: string) => void;
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
  return new Date(ms).toLocaleDateString('fr-FR');
}

export function DocumentList({ items, onDownload }: DocumentListProps): React.ReactElement {
  if (items.length === 0) {
    return <p>Aucun document à afficher.</p>;
  }
  return (
    <table>
      <thead>
        <tr>
          <th>Titre</th>
          <th>Catégorie</th>
          <th>Date</th>
          <th>Taille</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {items.map((doc): React.ReactElement => (
          <tr key={doc.id}>
            <td>
              {doc.title}
              {isRecent(doc.uploadedAt) ? (
                <span aria-label="Nouveau document" style={{ marginLeft: '0.5rem', backgroundColor: '#22c55e', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                  Nouveau
                </span>
              ) : null}
            </td>
            <td>{doc.category}</td>
            <td>{formatDate(doc.uploadedAt)}</td>
            <td>{formatSize(doc.sizeBytes)}</td>
            <td>
              <button type="button" onClick={(): void => { onDownload(doc.id); }}>
                Télécharger
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
