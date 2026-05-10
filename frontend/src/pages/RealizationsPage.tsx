import type React from 'react';
import { useEffect, useState } from 'react';
import { listRealizations } from '@/api/realizations';
import { RealizationFilters, type RealizationFiltersState } from '@/features/realizations/RealizationFilters';
import { RealizationGrid } from '@/features/realizations/RealizationGrid';
import type { ApiRealization } from '@/types/api';

const DEBOUNCE_MS = 300;

export function RealizationsPage(): React.ReactElement {
  const [filters, setFilters] = useState<RealizationFiltersState>({ type: '', equipmentType: '', region: '' });
  const [debouncedRegion, setDebouncedRegion] = useState('');
  const [items, setItems] = useState<ReadonlyArray<ApiRealization>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect((): (() => void) => {
    const handle = setTimeout((): void => {
      setDebouncedRegion(filters.region.trim());
    }, DEBOUNCE_MS);
    return (): void => { clearTimeout(handle); };
  }, [filters.region]);

  useEffect((): void => {
    const params: Parameters<typeof listRealizations>[0] = {
      ...(filters.type === '' ? {} : { type: filters.type }),
      ...(filters.equipmentType === '' ? {} : { equipmentType: filters.equipmentType }),
      ...(debouncedRegion === '' ? {} : { region: debouncedRegion }),
    };
    listRealizations(params)
      .then((next) => { setItems(next); setError(null); })
      .catch((e: unknown) => { setError(e instanceof Error ? e.message : 'Erreur'); });
  }, [filters.type, filters.equipmentType, debouncedRegion]);

  return (
    <section>
      <h1>Réalisations</h1>
      <RealizationFilters value={filters} onChange={setFilters} />
      {error !== null ? <p role="alert">Erreur : {error}</p> : null}
      <RealizationGrid items={items} />
    </section>
  );
}
