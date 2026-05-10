import type React from 'react';
import { useEffect, useState } from 'react';
import { listRealizations } from '@/api/realizations';
import { RealizationFilters, type RealizationFiltersState } from '@/features/realizations/RealizationFilters';
import { RealizationGrid } from '@/features/realizations/RealizationGrid';
import type { ApiRealization } from '@/types/api';

export function RealizationsPage(): React.ReactElement {
  const [filters, setFilters] = useState<RealizationFiltersState>({ type: '', equipmentType: '', region: '' });
  const [items, setItems] = useState<ReadonlyArray<ApiRealization>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect((): void => {
    listRealizations({
      ...(filters.type === '' ? {} : { type: filters.type }),
      ...(filters.equipmentType === '' ? {} : { equipmentType: filters.equipmentType }),
      ...(filters.region.trim() === '' ? {} : { region: filters.region.trim() }),
    })
      .then((next) => { setItems(next); setError(null); })
      .catch((e: unknown) => { setError(e instanceof Error ? e.message : 'Erreur'); });
  }, [filters]);

  return (
    <section>
      <h1>Réalisations</h1>
      <RealizationFilters value={filters} onChange={setFilters} />
      {error !== null ? <p role="alert">Erreur : {error}</p> : null}
      <RealizationGrid items={items} />
    </section>
  );
}
