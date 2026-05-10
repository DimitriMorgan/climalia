/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { DocumentList } from '@/features/documents/DocumentList';
import type { ApiDocument } from '@/types/api';

function makeDoc(partial: Partial<ApiDocument>): ApiDocument {
  return {
    id: 'doc-1',
    title: 'Document title',
    category: 'INVOICE',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    region: 'IDF',
    uploadedAt: new Date().toISOString(),
    ...partial,
  };
}

describe('DocumentList', (): void => {
  test('renders empty state when no documents', (): void => {
    render(<DocumentList items={[]} onDownload={(): void => {}} />);
    expect(screen.getByText(/aucun document/i)).toBeInTheDocument();
  });

  test('renders documents with download button', (): void => {
    const items: ReadonlyArray<ApiDocument> = [
      makeDoc({ id: 'a', title: 'Facture A' }),
      makeDoc({ id: 'b', title: 'Facture B' }),
    ];
    render(<DocumentList items={items} onDownload={(): void => {}} />);
    const buttons = screen.getAllByRole('button', { name: /télécharger/i });
    expect(buttons).toHaveLength(2);
  });

  test('flags documents uploaded less than 7 days ago as new', (): void => {
    const recentISO = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const oldISO = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const items: ReadonlyArray<ApiDocument> = [
      makeDoc({ id: 'recent', title: 'Récent', uploadedAt: recentISO }),
      makeDoc({ id: 'old', title: 'Ancien', uploadedAt: oldISO }),
    ];
    render(<DocumentList items={items} onDownload={(): void => {}} />);
    const badges = screen.getAllByText(/nouveau/i);
    expect(badges).toHaveLength(1);
  });
});
