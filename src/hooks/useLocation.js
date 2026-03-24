import { useState, useEffect, useCallback } from 'react';
import { requestLocationPermission, getGeolocationErrorMessage } from '../utils/locationService';

const CACHE_KEY = 'skycast_geo_cache_v1';
const CACHE_TTL_MS = 30 * 60 * 1000;

function readCachedCoords() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (j?.lat == null || j?.lon == null) return null;
    if (Date.now() - (j.t || 0) > CACHE_TTL_MS) return null;
    return { lat: j.lat, lon: j.lon };
  } catch {
    return null;
  }
}

function writeCache(lat, lon) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ lat, lon, t: Date.now() }));
  } catch {
    /* quota */
  }
}

export function useLocation() {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { lat, lon } = await requestLocationPermission();
      setCoords({ lat, lon });
      writeCache(lat, lon);
    } catch (e) {
      setError(getGeolocationErrorMessage(e) || e?.message || 'Location unavailable');
      const cached = readCachedCoords();
      if (cached) setCoords(cached);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cached = readCachedCoords();
    if (cached) {
      setCoords(cached);
      setLoading(false);
    }
    (async () => {
      if (!cached) setLoading(true);
      try {
        const { lat, lon } = await requestLocationPermission();
        if (cancelled) return;
        setCoords({ lat, lon });
        writeCache(lat, lon);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(getGeolocationErrorMessage(e) || e?.message);
        if (!cached) {
          const c2 = readCachedCoords();
          if (c2) setCoords(c2);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { coords, error, loading, refresh };
}
