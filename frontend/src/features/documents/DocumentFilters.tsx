import type React from 'react';
import { Icon } from '@/components/Icon';
import { DocumentCategory } from '@/types/enums';
import type { DocumentCategory as DocumentCategoryT } from '@/types/enums';

export interface DocumentFiltersState {
  category: DocumentCategoryT | '';
  dateFrom: string;
  dateTo: string;
  region: string;
  search: string;
}

export const EMPTY_DOCUMENT_FILTERS: DocumentFiltersState = {
  category: '',
  dateFrom: '',
  dateTo: '',
  region: '',
  search: '',
};

const CATEGORY_LABELS: Record<DocumentCategoryT, string> = {
  PLANNING: 'Planning',
  TECHNICAL_SHEET: 'Fiche technique',
  MAINTENANCE_CONTRACT: 'Contrat d’entretien',
  INTERNAL_DOC: 'Document interne',
  INTERVENTION_REPORT: 'Compte-rendu d’intervention',
  MAINTENANCE_CERTIFICATE: 'Attestation d’entretien',
  INVOICE: 'Facture',
};

interface DocumentFiltersProps {
  value: DocumentFiltersState;
  onChange: (next: DocumentFiltersState) => void;
  resultCount?: number;
}

export function DocumentFilters({
  value,
  onChange,
  resultCount,
}: DocumentFiltersProps): React.ReactElement {
  const update = <K extends keyof DocumentFiltersState>(
    key: K,
    v: DocumentFiltersState[K],
  ): void => {
    onChange({ ...value, [key]: v });
  };

  return (
    <div className="card search-card">
      <div className="search-input">
        <Icon name="search" size={16} />
        <input
          id="filter-search"
          type="search"
          placeholder="Rechercher un document, un client, un site…"
          value={value.search}
          onChange={(e): void => {
            update('search', e.target.value);
          }}
        />
      </div>

      <div className="field-group">
        <label htmlFor="filter-category" className="sr-only">Catégorie</label>
        <select
          id="filter-category"
          className="field-select"
          value={value.category}
          onChange={(e): void => {
            update('category', e.target.value as DocumentCategoryT | '');
          }}
        >
          <option value="">Catégorie — toutes</option>
          {Object.values(DocumentCategory).map((cat) => (
            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
          ))}
        </select>
      </div>

      <div className="field-group" style={{ minWidth: 180 }}>
        <label htmlFor="filter-region" className="sr-only">Région</label>
        <input
          id="filter-region"
          type="text"
          className="field"
          style={{ padding: '0.5rem 0.875rem', fontSize: 13 }}
          value={value.region}
          placeholder="Région"
          onChange={(e): void => {
            update('region', e.target.value);
          }}
        />
      </div>

      <div className="field-group">
        <label htmlFor="filter-date-from" className="sr-only">Du</label>
        <input
          id="filter-date-from"
          type="date"
          className="field-select"
          value={value.dateFrom}
          onChange={(e): void => {
            update('dateFrom', e.target.value);
          }}
        />
      </div>

      <div className="field-group">
        <label htmlFor="filter-date-to" className="sr-only">Au</label>
        <input
          id="filter-date-to"
          type="date"
          className="field-select"
          value={value.dateTo}
          onChange={(e): void => {
            update('dateTo', e.target.value);
          }}
        />
      </div>

      {resultCount !== undefined ? (
        <span className="search-card__count">
          {resultCount} document{resultCount > 1 ? 's' : ''}
        </span>
      ) : null}
    </div>
  );
}
