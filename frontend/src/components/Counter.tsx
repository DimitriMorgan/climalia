import type React from 'react';
import { useEffect, useRef, useState } from 'react';

interface CounterProps {
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export function Counter({
  to,
  duration = 1400,
  suffix = '',
  prefix = '',
  decimals = 0,
}: CounterProps): React.ReactElement {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect((): (() => void) => {
    const el = ref.current;
    if (el === null) return (): void => {};
    if (typeof IntersectionObserver === 'undefined') {
      const id = window.setTimeout((): void => {
        setVal(to);
      }, 0);
      return (): void => {
        window.clearTimeout(id);
      };
    }
    const io = new IntersectionObserver(
      (entries): void => {
        for (const e of entries) {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (t: number): void => {
              const p = Math.min(1, (t - start) / duration);
              const eased = 1 - Math.pow(1 - p, 3);
              setVal(eased * to);
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return (): void => {
      io.disconnect();
    };
  }, [to, duration]);

  const formatted = val.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className="num">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
