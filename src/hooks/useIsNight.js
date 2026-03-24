import { useState, useEffect } from 'react';
import { computeIsNight } from '../utils/dayNight';

export { computeIsNight } from '../utils/dayNight';

/**
 * Re-evaluates when `detailsData` changes and every minute so the UI crosses dawn/dusk.
 */
export function useIsNight(detailsData) {
  const [isNight, setIsNight] = useState(() => computeIsNight(detailsData));

  useEffect(() => {
    setIsNight(computeIsNight(detailsData));
    const id = setInterval(() => setIsNight(computeIsNight(detailsData)), 60_000);
    return () => clearInterval(id);
  }, [detailsData]);

  return isNight;
}
