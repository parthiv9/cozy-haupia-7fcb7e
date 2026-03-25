import { useEffect, useState, useRef, startTransition } from 'react';
import {
  fetchWeatherNewsByCountry,
  withPlaceholderNewsImages,
  REFRESH_MS,
  MAX_WEATHER_NEWS_ARTICLES,
} from '../utils/weatherNewsApi';

/**
 * Weather-only headlines for a country (in / us / gb / au).
 * @param {string} countryCode ISO2
 */
export function useNews(countryCode) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const gen = useRef(0);

  useEffect(() => {
    const g = ++gen.current;
    setLoading(true);
    setError(null);
    (async () => {
      const { ok, articles: list, error: apiError } = await fetchWeatherNewsByCountry(countryCode);
      if (g !== gen.current) return;
      startTransition(() => {
        if (!ok || !list?.length) {
          setError(apiError || 'Unable to load weather news');
          setArticles([]);
        } else {
          setError(null);
          setArticles(
            withPlaceholderNewsImages(list).slice(0, MAX_WEATHER_NEWS_ARTICLES)
          );
        }
        setLoading(false);
      });
    })();
  }, [countryCode]);

  useEffect(() => {
    const id = setInterval(async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      const before = gen.current;
      const { ok, articles: list } = await fetchWeatherNewsByCountry(countryCode);
      if (before !== gen.current) return;
      if (ok && list?.length) {
        startTransition(() => {
          setError(null);
          setArticles(
            withPlaceholderNewsImages(list).slice(0, MAX_WEATHER_NEWS_ARTICLES)
          );
        });
      }
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [countryCode]);

  return { articles, loading, error };
}
