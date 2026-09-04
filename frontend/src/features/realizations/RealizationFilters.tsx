import type React from 'react';
import { Icon } from '@/components/Icon';
import { EquipmentType, RealizationType } from '@/types/enums';
import type {
  EquipmentType as EquipmentTypeT,
  RealizationType as RealizationTypeT,
} from '@/types/enums';

export interface RealizationFiltersState {
  type: RealizationTypeT | '';
  equipmentType: EquipmentTypeT | '';
  region: string;
}

export interface RealizationFiltersProps {
  value: RealizationFiltersState;
  onChange: (next: RealizationFiltersState) => void;
  resultCount?: number;
  totalCount?: number;
}

export function RealizationFilters({
  value,
  onChange,
  resultCount,
  totalCount,
}: RealizationFiltersProps): React.ReactElement {
  return (
    <div className="filter-bar">
      <div className="filter-bar__inner">
        <span className="filter-bar__label">
          <Icon name="filter" size={14} /> Filtres
        </span>

        <div className="field-group">
          <label htmlFor="real-type" className="sr-only">Type</label>
          <select
            id="real-type"
            className="field-select"
            value={value.type}
            onChange={(e): void => {
              onChange({ ...value, type: e.target.value as RealizationTypeT | '' });
            }}
          >
            <option value="">Type — tous</option>
            <option value={RealizationType.RESIDENTIAL}>Résidentiel</option>
            <option value={RealizationType.TERTIARY}>Tertiaire</option>
          </select>
        </div>

        <div className="field-group">
          <label htmlFor="real-equipment" className="sr-only">Équipement</label>
          <select
            id="real-equipment"
            className="field-select"
            value={value.equipmentType}
            onChange={(e): void => {
              onChange({ ...value, equipmentType: e.target.value as EquipmentTypeT | '' });
            }}
          >
            <option value="">Équipement — tous</option>
            <option value={EquipmentType.AC}>Climatisation</option>
            <option value={EquipmentType.HEAT_PUMP}>Pompe à chaleur</option>
            <option value={EquipmentType.VMC}>VMC</option>
          </select>
        </div>

        <div className="field-group" style={{ minWidth: 180 }}>
          <label htmlFor="real-region" className="sr-only">Région</label>
          <input
            id="real-region"
            type="text"
            className="field"
            style={{ padding: '0.5rem 0.875rem', fontSize: 13 }}
            value={value.region}
            onChange={(e): void => {
              onChange({ ...value, region: e.target.value });
            }}
            placeholder="Région — Île-de-France…"
          />
        </div>

        {resultCount !== undefined && totalCount !== undefined ? (
          <span className="filter-bar__count">
            {resultCount} / {totalCount} résultats
          </span>
        ) : null}
      </div>
    </div>
  );
}
