import type React from 'react';
import { useEffect, useRef } from 'react';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'article' | 'li' | 'section';
}

export function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: RevealProps): React.ReactElement {
  const ref = useRef<HTMLElement | null>(null);
  useEffect((): (() => void) => {
    const el = ref.current;
    if (el === null) return (): void => {};
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('in');
      return (): void => {};
    }
    const io = new IntersectionObserver(
      (entries): void => {
        for (const e of entries) {
          if (e.isIntersecting) {
            window.setTimeout((): void => {
              el.classList.add('in');
            }, delay);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return (): void => {
      io.disconnect();
    };
  }, [delay]);
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLLIElement & HTMLElement>}
      className={`reveal ${className}`}
    >
      {children}
    </Tag>
  );
}
