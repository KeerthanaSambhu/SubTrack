import { useEffect, useRef, useState } from 'react';
import { formatMoney } from '../../lib/format';

/**
 * Smoothly animates numbers when mounted or when target value changes.
 * Automatically respects `prefers-reduced-motion`.
 */
export default function AnimatedNumber({
  value,
  currency,
  duration = 750,
  className = '',
}) {
  const numericTarget = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0;
  const [current, setCurrent] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return numericTarget;
    }
    return 0;
  });

  const startTimeRef = useRef(null);
  const startValRef = useRef(0);
  const reqRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCurrent(numericTarget);
      return;
    }

    startValRef.current = current;
    startTimeRef.current = null;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      const nextVal = startValRef.current + (numericTarget - startValRef.current) * eased;
      setCurrent(nextVal);

      if (progress < 1) {
        reqRef.current = requestAnimationFrame(step);
      } else {
        setCurrent(numericTarget);
      }
    };

    reqRef.current = requestAnimationFrame(step);

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [numericTarget, duration]);

  const display = currency
    ? formatMoney(Math.round(current * 100) / 100, currency)
    : Number.isInteger(numericTarget)
    ? Math.round(current).toLocaleString()
    : (Math.round(current * 100) / 100).toLocaleString();

  return <span className={`tabular ${className}`}>{display}</span>;
}
