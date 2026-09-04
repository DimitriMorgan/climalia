/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentList } from '@/features/documents/DocumentList';
import type { ApiDocument } from '@/types/api';

function makeDoc(partial: Partial<ApiDocument>): ApiDocument {
  return {
    id: 'doc-1',
    title: 'Document title',
    category: 'INVOICE',
    audience: 'INTERNAL',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    region: 'IDF',
    uploadedAt: new Date().toISOString(),
    documentDate: null,
    hasFile: true,
    ...partial,
  };
}

function renderList(
  items: ReadonlyArray<ApiDocument>,
  onPreview: (doc: ApiDocument) => void = (): void => {},
): void {
  render(<DocumentList items={items} onDownload={(): void => {}} onPreview={onPreview} />);
}

describe('DocumentList', (): void => {
  test('renders empty state when no documents', (): void => {
    renderList([]);
    expect(screen.getByText(/aucun document/i)).toBeInTheDocument();
  });

  test('renders documents with download and preview buttons', (): void => {
    const items: ReadonlyArray<ApiDocument> = [
      makeDoc({ id: 'a', title: 'Facture A' }),
      makeDoc({ id: 'b', title: 'Facture B' }),
    ];
    renderList(items);
    const buttons = screen.getAllByRole('button', { name: /télécharger/i });
    expect(buttons).toHaveLength(2);
    const previews = screen.getAllByRole('button', { name: /^aperçu$/i });
    expect(previews).toHaveLength(2);
  });

  test('clicking the title opens the preview for that document', async (): Promise<void> => {
    const onPreview = jest.fn();
    const items: ReadonlyArray<ApiDocument> = [
      makeDoc({ id: 'a', title: 'Facture A' }),
      makeDoc({ id: 'b', title: 'Facture B' }),
    ];
    renderList(items, onPreview);
    await userEvent.click(screen.getByRole('button', { name: 'Facture B' }));
    expect(onPreview).toHaveBeenCalledTimes(1);
    expect(onPreview).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
  });

  test('flags documents uploaded less than 7 days ago as new', (): void => {
    const recentISO = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const oldISO = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const items: ReadonlyArray<ApiDocument> = [
      makeDoc({ id: 'recent', title: 'Récent', uploadedAt: recentISO }),
      makeDoc({ id: 'old', title: 'Ancien', uploadedAt: oldISO }),
    ];
    renderList(items);
    const badges = screen.getAllByText(/nouveau/i);
    expect(badges).toHaveLength(1);
  });
});
