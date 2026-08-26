'use client';

import { useEffect, useState } from 'react';

/**
 * Whether it's between 2am and 5am where the visitor is.
 *
 * Starts false rather than reading the clock during render, because the server
 * has no idea what time it is where you are and a mismatched first paint is a
 * hydration error. Re-checks every minute so it appears on its own if 2am passes
 * while the tab sits open.
 */
export function useLateNight(): boolean {
  const [late, setLate] = useState(false);

  useEffect(() => {
    const check = () => {
      const h = new Date().getHours();
      setLate(h >= 2 && h < 5);
    };
    check();
    const timer = setInterval(check, 60_000);
    return () => clearInterval(timer);
  }, []);

  return late;
}
