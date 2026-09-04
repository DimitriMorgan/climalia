import type React from 'react';

interface LogoProps {
  size?: number;
  withWord?: boolean;
}

export function Logo({ size = 22, withWord = true }: LogoProps): React.ReactElement {
  return (
    <span className="brand">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M9 19 Q12 15, 16 19 T23 19"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M9 13 Q12 9, 16 13 T23 13"
          stroke="var(--accent)"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      {withWord ? <span className="brand__name">Climalia</span> : null}
    </span>
  );
}
