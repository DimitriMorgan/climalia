import type React from 'react';

export type GlyphKind = 'wave' | 'thermal' | 'flow' | 'check' | 'bolt';

interface GlyphProps {
  kind: GlyphKind;
  size?: number;
}

export function Glyph({ kind, size = 96 }: GlyphProps): React.ReactElement | null {
  const stroke = 'var(--ink)';
  const accent = 'var(--accent)';
  switch (kind) {
    case 'wave':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
          <circle cx="50" cy="50" r="48" stroke="var(--line)" strokeWidth="0.5" />
          <path d="M10 40 Q25 28, 40 40 T70 40 T90 40" stroke={stroke} strokeWidth="1.2" fill="none" />
          <path d="M10 55 Q25 43, 40 55 T70 55 T90 55" stroke={stroke} strokeWidth="1.2" fill="none" opacity=".55" />
          <path d="M10 70 Q25 58, 40 70 T70 70 T90 70" stroke={accent} strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'thermal':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
          <circle cx="50" cy="50" r="48" stroke="var(--line)" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="6" fill={accent} />
          {[14, 22, 30, 38].map((r, i) => (
            <circle key={i} cx="50" cy="50" r={r} stroke={stroke} strokeWidth="0.8" opacity={0.7 - i * 0.13} />
          ))}
          <path d="M50 8 v8 M50 84 v8 M8 50 h8 M84 50 h8" stroke={stroke} strokeWidth="1" />
        </svg>
      );
    case 'flow':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
          <circle cx="50" cy="50" r="48" stroke="var(--line)" strokeWidth="0.5" />
          {[20, 35, 50, 65, 80].map((y, i) => (
            <g key={i}>
              <path d={`M14 ${String(y)} h60`} stroke={stroke} strokeWidth="1" opacity={0.45} />
              <path
                d={`M70 ${String(y - 3)} l6 3 -6 3`}
                stroke={i === 2 ? accent : stroke}
                strokeWidth="1.2"
                fill="none"
              />
            </g>
          ))}
        </svg>
      );
    case 'check':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
          <circle cx="50" cy="50" r="48" stroke="var(--line)" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="28" stroke={stroke} strokeWidth="1" />
          <path d="M38 50 l10 10 18 -22" stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'bolt':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
          <circle cx="50" cy="50" r="48" stroke="var(--line)" strokeWidth="0.5" />
          <path d="M54 22 L34 56 h14 L42 78 L66 42 H52 L58 22 z" fill={accent} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
