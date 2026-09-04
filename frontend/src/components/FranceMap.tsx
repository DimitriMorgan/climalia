import type React from 'react';
import { useState } from 'react';

const FRANCE_PATH =
  'M 200 80 L 280 70 L 340 90 L 410 100 L 450 130 L 470 180 L 480 240 L 490 310 L 470 380 L 440 440 L 380 480 L 320 510 L 250 520 L 180 510 L 130 470 L 110 410 L 100 340 L 110 270 L 130 200 L 160 130 Z';

interface City {
  name: string;
  x: number;
  y: number;
  region: string;
  big?: boolean;
}

const CITIES: ReadonlyArray<City> = [
  { name: 'Paris', x: 290, y: 175, region: 'Île-de-France', big: true },
  { name: 'Lille', x: 310, y: 95, region: 'Hauts-de-France', big: true },
  { name: 'Strasbourg', x: 460, y: 165, region: 'Grand Est' },
  { name: 'Lyon', x: 380, y: 320, region: 'Auvergne-Rhône-Alpes', big: true },
  { name: 'Marseille', x: 395, y: 460, region: "Provence-Alpes-Côte d'Azur", big: true },
  { name: 'Toulouse', x: 245, y: 445, region: 'Occitanie' },
  { name: 'Bordeaux', x: 175, y: 380, region: 'Nouvelle-Aquitaine', big: true },
  { name: 'Nantes', x: 155, y: 250, region: 'Pays de la Loire' },
  { name: 'Rennes', x: 145, y: 195, region: 'Bretagne' },
  { name: 'Rouen', x: 245, y: 145, region: 'Normandie' },
  { name: 'Dijon', x: 380, y: 240, region: 'Bourgogne-Franche-Comté' },
  { name: 'Clermont', x: 310, y: 320, region: 'Auvergne-Rhône-Alpes' },
  { name: 'Nice', x: 460, y: 450, region: "Provence-Alpes-Côte d'Azur" },
  { name: 'Montpellier', x: 320, y: 445, region: 'Occitanie' },
  { name: 'Reims', x: 360, y: 145, region: 'Grand Est' },
  { name: 'Tours', x: 230, y: 245, region: 'Centre-Val de Loire' },
  { name: 'Limoges', x: 240, y: 330, region: 'Nouvelle-Aquitaine' },
  { name: 'Brest', x: 75, y: 195, region: 'Bretagne' },
  { name: 'Grenoble', x: 410, y: 350, region: 'Auvergne-Rhône-Alpes' },
];

export interface FranceMapProps {
  onSelect?: (region: string) => void;
  highlighted?: ReadonlyArray<string>;
  height?: number;
}

export function FranceMap({
  onSelect,
  highlighted,
  height = 540,
}: FranceMapProps): React.ReactElement {
  const [hover, setHover] = useState<string | null>(null);

  const isHighlighted = (region: string): boolean =>
    highlighted !== undefined && highlighted.includes(region);

  return (
    <div className="france-map" style={{ height }}>
      <svg
        viewBox="0 0 600 580"
        className="france-map__svg"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Carte de France des villes desservies par Climalia"
      >
        <defs>
          <pattern id="map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="color-mix(in oklab, var(--ink) 5%, transparent)" strokeWidth="0.5" />
          </pattern>
          <clipPath id="france-clip"><path d={FRANCE_PATH} /></clipPath>
        </defs>

        <path d={FRANCE_PATH} fill="color-mix(in oklab, var(--ink) 4%, var(--paper))" stroke="var(--line-strong)" strokeWidth="0.8" />
        <rect width="600" height="580" fill="url(#map-grid)" clipPath="url(#france-clip)" />

        {CITIES.map((c, i) => {
          const isActive = hover === c.name || isHighlighted(c.region);
          const isBig = c.big === true;
          const r = isBig ? 5 : 3;
          return (
            <g
              key={c.name}
              onMouseEnter={(): void => {
                setHover(c.name);
              }}
              onMouseLeave={(): void => {
                setHover(null);
              }}
              onClick={(): void => {
                onSelect?.(c.region);
              }}
              style={{ cursor: onSelect !== undefined ? 'pointer' : 'default' }}
            >
              <circle
                cx={c.x}
                cy={c.y}
                r={r + 8}
                fill="var(--accent)"
                opacity={isActive ? 0.18 : 0}
              >
                <animate
                  attributeName="r"
                  from={r}
                  to={r + 12}
                  dur="2s"
                  repeatCount="indefinite"
                  begin={`${(i * 0.13).toFixed(2)}s`}
                />
                <animate
                  attributeName="opacity"
                  from="0.3"
                  to="0"
                  dur="2s"
                  repeatCount="indefinite"
                  begin={`${(i * 0.13).toFixed(2)}s`}
                />
              </circle>
              <circle
                cx={c.x}
                cy={c.y}
                r={r}
                fill={isBig ? 'var(--accent)' : 'var(--ink)'}
                stroke="var(--paper)"
                strokeWidth="1.5"
              />
              {isBig || isActive ? (
                <text
                  x={c.x + 10}
                  y={c.y + 4}
                  fontSize={isBig ? 11 : 10}
                  fill="var(--ink)"
                  fontFamily="Inter"
                  fontWeight={isBig ? 600 : 500}
                >
                  {c.name}
                </text>
              ) : null}
            </g>
          );
        })}

        <g transform="translate(540, 70)" opacity="0.55">
          <circle r="14" fill="none" stroke="var(--ink-mute)" strokeWidth="0.5" />
          <path d="M 0 -10 L 3 0 L 0 10 L -3 0 Z" fill="var(--accent)" />
          <text y="-18" textAnchor="middle" fontSize="9" fill="var(--ink-mute)" fontFamily="JetBrains Mono">N</text>
        </g>
      </svg>

      <div className="france-map__legend">
        <span><i style={{ background: 'var(--accent)' }} /> Agence Climalia</span>
        <span><i style={{ background: 'var(--ink)' }} /> Artisan partenaire</span>
      </div>
    </div>
  );
}
