import type React from 'react';
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
}

export function DocumentFilters({ value, onChange }: DocumentFiltersProps): React.ReactElement {
  const update = <K extends keyof DocumentFiltersState>(key: K, v: DocumentFiltersState[K]): void => {
    onChange({ ...value, [key]: v });
  };

  return (
    <fieldset>
      <legend>Filtres</legend>
      <p>
        <label htmlFor="filter-category">Catégorie</label><br />
        <select
          id="filter-category"
          value={value.category}
          onChange={(e): void => { update('category', e.target.value as DocumentCategoryT | ''); }}
        >
          <option value="">Toutes</option>
          {Object.values(DocumentCategory).map((cat): React.ReactElement => (
            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
          ))}
        </select>
      </p>
      <p>
        <label htmlFor="filter-date-from">Du</label><br />
        <input
          id="filter-date-from"
          type="date"
          value={value.dateFrom}
          onChange={(e): void => { update('dateFrom', e.target.value); }}
        />
      </p>
      <p>
        <label htmlFor="filter-date-to">Au</label><br />
        <input
          id="filter-date-to"
          type="date"
          value={value.dateTo}
          onChange={(e): void => { update('dateTo', e.target.value); }}
        />
      </p>
      <p>
        <label htmlFor="filter-region">Région</label><br />
        <input
          id="filter-region"
          type="text"
          value={value.region}
          onChange={(e): void => { update('region', e.target.value); }}
        />
      </p>
      <p>
        <label htmlFor="filter-search">Recherche</label><br />
        <input
          id="filter-search"
          type="search"
          value={value.search}
          onChange={(e): void => { update('search', e.target.value); }}
        />
      </p>
    </fieldset>
  );
}
