/**
 * Environment configuration for Vite (`import.meta.env`).
 *
 * Set `VITE_OPENWEATHER_API_KEY` in a `.env` file at the project root (same folder as
 * `package.json` and `vite.config.js`). Restart `npm run dev` after changing `.env`.
 *
 * Used for OpenWeather **map tile** layers (temperature, clouds, precipitation).
 * Radar uses RainViewer and does not need this key.
 */

function normalizeApiKey(raw) {
  if (raw == null) return '';
  const s = String(raw).trim();
  if (!s) return '';
  // Handle accidental wrapping quotes in .env
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1).trim();
  }
  return s;
}

/** Placeholder values from `.env` template — treated as “no key” so Open-Meteo fallback works. */
function isPlaceholderKey(key) {
  if (!key) return true;
  const lower = key.toLowerCase().replace(/\s+/g, '');
  if (lower === 'your_api_key_here') return true;
  if (lower.includes('yourapikeyhere')) return true;
  if (lower === 'xxx' || lower === 'changeme') return true;
  if (lower === 'yournewsapikey' || lower === 'your_news_api_key') return true;
  if (lower === 'yourgnewsapikey' || lower === 'your_gnews_api_key') return true;
  return false;
}

/**
 * OpenWeatherMap API key from `VITE_OPENWEATHER_API_KEY`.
 * @returns {string} Non-empty key, or '' if unset/invalid/placeholder.
 */
export function getOpenWeatherApiKey() {
  const k = normalizeApiKey(import.meta.env.VITE_OPENWEATHER_API_KEY);
  if (isPlaceholderKey(k)) return '';
  return k;
}

/**
 * NewsAPI.org key (`VITE_NEWS_API_KEY`) for the Weather news section (top headlines by country).
 */
export function getNewsApiKey() {
  const k = normalizeApiKey(import.meta.env.VITE_NEWS_API_KEY);
  if (isPlaceholderKey(k)) return '';
  return k;
}

/**
 * GNews.io key (`VITE_GNEWS_API_KEY`) — search API includes `country` per request (preferred for country switching).
 * @see https://gnews.io/
 */
export function getGNewsApiKey() {
  const k = normalizeApiKey(import.meta.env.VITE_GNEWS_API_KEY);
  if (isPlaceholderKey(k)) return '';
  return k;
}
