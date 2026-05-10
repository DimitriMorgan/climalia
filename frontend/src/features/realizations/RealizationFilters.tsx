import type React from 'react';
import { EquipmentType, RealizationType } from '@/types/enums';
import type { EquipmentType as EquipmentTypeT, RealizationType as RealizationTypeT } from '@/types/enums';

export interface RealizationFiltersState {
  type: RealizationTypeT | '';
  equipmentType: EquipmentTypeT | '';
  region: string;
}

export interface RealizationFiltersProps {
  value: RealizationFiltersState;
  onChange: (next: RealizationFiltersState) => void;
}

export function RealizationFilters({ value, onChange }: RealizationFiltersProps): React.ReactElement {
  return (
    <fieldset style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <legend>Filtres</legend>
      <label>
        Type
        <select
          value={value.type}
          onChange={(e): void => { onChange({ ...value, type: e.target.value as RealizationTypeT | '' }); }}
        >
          <option value="">Tous</option>
          <option value={RealizationType.RESIDENTIAL}>Résidentiel</option>
          <option value={RealizationType.TERTIARY}>Tertiaire</option>
        </select>
      </label>
      <label>
        Équipement
        <select
          value={value.equipmentType}
          onChange={(e): void => { onChange({ ...value, equipmentType: e.target.value as EquipmentTypeT | '' }); }}
        >
          <option value="">Tous</option>
          <option value={EquipmentType.AC}>Climatisation</option>
          <option value={EquipmentType.HEAT_PUMP}>Pompe à chaleur</option>
          <option value={EquipmentType.VMC}>VMC</option>
        </select>
      </label>
      <label>
        Région
        <input
          type="text"
          value={value.region}
          onChange={(e): void => { onChange({ ...value, region: e.target.value }); }}
          placeholder="ex: Île-de-France"
        />
      </label>
    </fieldset>
  );
}
