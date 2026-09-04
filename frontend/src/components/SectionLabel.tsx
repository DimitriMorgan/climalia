import type React from 'react';

interface SectionLabelProps {
  children: React.ReactNode;
  num?: string;
  accent?: boolean;
  className?: string;
}

export function SectionLabel({
  children,
  num,
  accent = false,
  className = '',
}: SectionLabelProps): React.ReactElement {
  const cls = `section-label ${accent ? 'section-label--accent' : ''} ${className}`.trim();
  return (
    <div className={cls}>
      {num !== undefined ? <span className="section-label__num">{num}</span> : null}
      <span className="section-label__bar" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
