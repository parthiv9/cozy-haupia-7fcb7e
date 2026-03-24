import { useState, useCallback } from 'react';
import {
  getWeatherByCoords,
  getWeatherByCity,
  getForecastByCoords,
  getForecastByCity,
  getCitiesByCountry,
} from '../utils/api';

/**
 * Async helpers for current + forecast; parent owns “which place” state.
 */
export function useWeather() {
  const [loading, setLoading] = useState(false);

  const loadByCoords = useCallback(async (lat, lon) => {
    setLoading(true);
    try {
      const [current, forecast] = await Promise.all([
        getWeatherByCoords(lat, lon),
        getForecastByCoords(lat, lon),
      ]);
      return { current, forecast };
    } catch {
      return { current: null, forecast: null };
    } finally {
      setLoading(false);
    }
  }, []);

  const searchQuery = useCallback(async (query) => {
    const q = query.trim();
    if (!q) return { type: 'none' };
    setLoading(true);
    try {
      try {
        const cityData = await getWeatherByCity(q);
        const lat = cityData.coord?.lat;
        const lon = cityData.coord?.lon;
        let forecast = null;
        if (lat != null && lon != null) {
          forecast = await getForecastByCoords(lat, lon);
        } else {
          forecast = await getForecastByCity(cityData.name);
        }
        return { type: 'city', city: cityData, forecast };
      } catch {
        /* country */
      }
      const cities = await getCitiesByCountry(q);
      if (cities?.length) {
        const first = cities[0];
        const lat = first?.coord?.lat;
        const lon = first?.coord?.lon;
        const forecast =
          lat != null && lon != null ? await getForecastByCoords(lat, lon) : null;
        return { type: 'country', countryName: q, cities, forecast };
      }
      return { type: 'none' };
    } catch {
      return { type: 'none' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, loadByCoords, searchQuery };
}
