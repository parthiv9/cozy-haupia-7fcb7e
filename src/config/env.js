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

let openWeatherLayersKeyWarned = false;

function warnOpenWeatherLayersMissingOnce() {
  if (openWeatherLayersKeyWarned) return;
  openWeatherLayersKeyWarned = true;
  // Avoid console.warn: React DevTools surfaces it as an “Error” with a component stack.
  if (import.meta.env.DEV && typeof console.debug === 'function') {
    console.debug(
      '[SkyCast] VITE_OPENWEATHER_API_KEY not set or is a placeholder — OWM map tile layers are off. Radar/other map features may still work.'
    );
  }
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
  if (lower === 'your_key') return true;
  return false;
}

/**
 * OpenWeatherMap API key from `VITE_OPENWEATHER_API_KEY`.
 * @returns {string} Non-empty key, or '' if unset/invalid/placeholder.
 */
export function getOpenWeatherApiKey() {
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
  const k = normalizeApiKey(API_KEY);
  if (isPlaceholderKey(k)) {
    warnOpenWeatherLayersMissingOnce();
    return '';
  }
  return k;
}

/**
 * NewsAPI.org key (`VITE_NEWS_API_KEY`) for the Weather news section (top headlines by country).
 * Prefer GNews when both are set; fetch order is implemented in `weatherNewsApi.js`.
 * Do not read `import.meta.env` directly in callers — placeholders must be rejected (see `isPlaceholderKey`).
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

/**
 * True when at least one of `VITE_GNEWS_API_KEY` or `VITE_NEWS_API_KEY` is set and not a placeholder.
 * When false, news modules should use RSS (BBC + ScienceDaily) only — no API calls with empty keys.
 */
export function hasAnyNewsApiKey() {
  return Boolean(getGNewsApiKey() || getNewsApiKey());
}
