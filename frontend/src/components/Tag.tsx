import type React from 'react';

interface TagProps {
  children: React.ReactNode;
  accent?: boolean;
  dot?: boolean;
  className?: string;
}

export function Tag({
  children,
  accent = false,
  dot = false,
  className = '',
}: TagProps): React.ReactElement {
  const cls = `tag ${accent ? 'tag--accent' : ''} ${className}`.trim();
  return (
    <span className={cls}>
      {dot ? <span className="tag__dot" /> : null}
      {children}
    </span>
  );
}
