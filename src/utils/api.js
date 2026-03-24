/**
 * Single entry for app data fetching (weather + news).
 * Implementation lives in feature modules; this file re-exports for clean imports.
 */

export {
  getWeatherByCoords,
  getWeatherByCity,
  getForecastByCoords,
  getForecastByCity,
  getCitiesByCountry,
  getSearchSuggestions,
  getWeatherBackgroundSlug,
  getWeatherMoodClass,
  getWeatherMoodKey,
  getWeatherIconUrl,
  getPlaceNameFromCoords,
  getCountryCodeFromCoords,
  useOpenWeather,
} from './weatherApi.js';

export {
  fetchWeatherNewsByCountry,
  ensureNewsNeverEmpty,
  withPlaceholderNewsImages,
  dedupeByUrl,
  REFRESH_MS,
} from './weatherNewsApi.js';

export { hasAnyNewsApiKey } from '../config/env.js';

export { fetchWeatherForMapPoint } from './mapService.js';
