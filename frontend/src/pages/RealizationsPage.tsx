import type React from 'react';
import { useEffect, useState } from 'react';
import { listRealizations } from '@/api/realizations';
import { Counter } from '@/components/Counter';
import { RichText } from '@/components/RichText';
import { SectionLabel } from '@/components/SectionLabel';
import { useT } from '@/stores/contentStore';
import {
  RealizationFilters,
  type RealizationFiltersState,
} from '@/features/realizations/RealizationFilters';
import { RealizationGrid } from '@/features/realizations/RealizationGrid';
import type { ApiRealization } from '@/types/api';

const DEBOUNCE_MS = 300;

export function RealizationsPage(): React.ReactElement {
  const t = useT();
  const [filters, setFilters] = useState<RealizationFiltersState>({
    type: '',
    equipmentType: '',
    region: '',
  });
  const [debouncedRegion, setDebouncedRegion] = useState('');
  const [items, setItems] = useState<ReadonlyArray<ApiRealization>>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect((): void => {
    listRealizations()
      .then((all) => {
        setTotal(all.length);
      })
      .catch(() => {
        // total is decorative — fail silently
      });
  }, []);

  useEffect((): (() => void) => {
    const handle = setTimeout((): void => {
      setDebouncedRegion(filters.region.trim());
    }, DEBOUNCE_MS);
    return (): void => {
      clearTimeout(handle);
    };
  }, [filters.region]);

  useEffect((): void => {
    const params: Parameters<typeof listRealizations>[0] = {
      ...(filters.type === '' ? {} : { type: filters.type }),
      ...(filters.equipmentType === '' ? {} : { equipmentType: filters.equipmentType }),
      ...(debouncedRegion === '' ? {} : { region: debouncedRegion }),
    };
    listRealizations(params)
      .then((next) => {
        setItems(next);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Erreur');
      });
  }, [filters.type, filters.equipmentType, debouncedRegion]);

  const totalLabel = total ?? items.length;

  return (
    <>
      <section className="page-hero" style={{ paddingBottom: '3rem' }}>
        <div className="page-hero__inner">
          <SectionLabel num="01" accent>{t('realizations.hero.label')}</SectionLabel>
          <div className="page-hero__split">
            <h1 className="page-hero__title" style={{ maxWidth: '20ch' }}>
              <Counter to={totalLabel || 84} /> <RichText text={t('realizations.hero.title')} />
            </h1>
            <p className="page-hero__lede">{t('realizations.hero.lede')}</p>
          </div>
        </div>
      </section>

      <RealizationFilters
        value={filters}
        onChange={setFilters}
        resultCount={items.length}
        totalCount={total ?? items.length}
      />

      <section className="container section-pad">
        {error !== null ? (
          <p role="alert" className="alert alert--bad">Erreur : {error}</p>
        ) : null}
        <RealizationGrid items={items} />
      </section>
    </>
  );
}
