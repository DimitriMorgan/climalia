import type React from 'react';

const REGIONS: ReadonlyArray<string> = [
  'Île-de-France', 'Hauts-de-France', 'Grand Est', 'Normandie',
  'Bretagne', 'Pays de la Loire', 'Centre-Val de Loire', 'Bourgogne-Franche-Comté',
  'Nouvelle-Aquitaine', 'Auvergne-Rhône-Alpes', 'Occitanie', 'Provence-Alpes-Côte d\'Azur',
  'Corse',
];

export interface FranceMapProps {
  onSelect?: (region: string) => void;
  highlighted?: ReadonlyArray<string>;
}

export function FranceMap({ onSelect, highlighted }: FranceMapProps): React.ReactElement {
  const isHighlighted = (r: string): boolean => highlighted === undefined || highlighted.includes(r);
  return (
    <div
      role="group"
      aria-label="Carte de France des régions desservies"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}
    >
      {REGIONS.map((r) => (
        <button
          key={r}
          type="button"
          onClick={(): void => { onSelect?.(r); }}
          aria-pressed={isHighlighted(r)}
          style={{
            padding: '0.75rem',
            border: '1px solid #888',
            background: isHighlighted(r) ? '#cce5ff' : '#f0f0f0',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
