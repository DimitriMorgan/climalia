import type React from 'react';
import type { ApiRealization } from '@/types/api';

export interface RealizationGridProps {
  items: ReadonlyArray<ApiRealization>;
}

export function RealizationGrid({ items }: RealizationGridProps): React.ReactElement {
  if (items.length === 0) {
    return <p>Aucune réalisation pour ces filtres.</p>;
  }
  return (
    <ul
      data-testid="realization-grid"
      style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}
    >
      {items.map((r) => (
        <li key={r.id} style={{ border: '1px solid #ddd', padding: '1rem' }}>
          <h3>{r.title}</h3>
          <p>{r.description}</p>
          <p><small>{r.region} — {r.type} — {r.equipmentType}</small></p>
        </li>
      ))}
    </ul>
  );
}
