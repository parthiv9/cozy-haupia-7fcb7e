/**
 * OpenWeatherMap — current weather + 5-day / 3-hour forecast for map sidebar.
 * Requires VITE_OPENWEATHER_API_KEY. Used when key is present; otherwise the app falls back to Open-Meteo.
 */

const BASE = 'https://api.openweathermap.org/data/2.5';

/**
 * @param {number} lat
 * @param {number} lon
 * @param {string} apiKey
 * @returns {Promise<object|null>}
 */
export async function fetchOwmCurrentWeather(lat, lon, apiKey) {
  const key = (apiKey || '').trim();
  if (!key) return null;
  const url = `${BASE}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

/**
 * @param {number} lat
 * @param {number} lon
 * @param {string} apiKey
 * @returns {Promise<object|null>} raw API JSON with .list
 */
export async function fetchOwmForecastRaw(lat, lon, apiKey) {
  const key = (apiKey || '').trim();
  if (!key) return null;
  const url = `${BASE}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

/** One reading per calendar day (up to 5) from 3-hour list */
export function owmListToDailySlots(list) {
  if (!list?.length) return [];
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const day = item.dt_txt?.slice(0, 10);
    if (!day || seen.has(day)) continue;
    seen.add(day);
    out.push(item);
    if (out.length >= 5) break;
  }
  return out;
}

/** Card-friendly shape from OWM /weather */
export function shapeOwmCurrent(j) {
  if (!j) return null;
  return {
    source: 'owm',
    name: j.name,
    temp: j.main?.temp,
    feelsLike: j.main?.feels_like,
    humidity: j.main?.humidity,
    pressure: j.main?.pressure,
    windSpeed: j.wind?.speed,
    description: j.weather?.[0]?.description,
    icon: j.weather?.[0]?.icon,
    lat: j.coord?.lat,
    lon: j.coord?.lon,
  };
}

/** Forecast row for UI */
export function shapeOwmForecastSlot(item) {
  if (!item) return null;
  return {
    dt: item.dt,
    temp: item.main?.temp,
    description: item.weather?.[0]?.description,
    icon: item.weather?.[0]?.icon,
    pop: item.pop,
  };
}
