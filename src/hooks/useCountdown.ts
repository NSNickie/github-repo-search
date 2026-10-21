import { useEffect, useState } from 'react';

/** Whole seconds left until `targetMs` (epoch ms), updated every second; never negative. */
export function useCountdown(targetMs: number | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (targetMs === null) return;
    const id = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= targetMs) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  if (targetMs === null) return 0;
  return Math.max(0, Math.ceil((targetMs - now) / 1000));
}
