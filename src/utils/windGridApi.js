/**
 * Wind samples for map arrows — OpenWeatherMap when a key exists, otherwise Open-Meteo (no key).
 * Both APIs report meteorological direction: degrees from which the wind blows (0° = from N).
 */

const OWM_WEATHER = 'https://api.openweathermap.org/data/2.5/weather';
const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';

/**
 * @param {L.LatLngBounds} bounds
 * @param {number} rows
 * @param {number} cols
 * @returns {{ lat: number, lng: number }[]}
 */
export function gridPointsFromBounds(bounds, rows, cols) {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const latMin = sw.lat;
  const latMax = ne.lat;
  const lngMin = sw.lng;
  const lngMax = ne.lng;
  const out = [];
  const rMax = Math.max(1, rows - 1);
  const cMax = Math.max(1, cols - 1);
  for (let r = 0; r < rows; r++) {
    const fy = rows === 1 ? 0.5 : r / rMax;
    const lat = latMin + fy * (latMax - latMin);
    for (let c = 0; c < cols; c++) {
      const fx = cols === 1 ? 0.5 : c / cMax;
      const lng = lngMin + fx * (lngMax - lngMin);
      out.push({ lat, lng });
    }
  }
  return out;
}

/**
 * @param {number} lat
 * @param {number} lng
 * @param {AbortSignal} [signal]
 */
export async function fetchWindOpenMeteo(lat, lng, signal) {
  const u = new URL(OPEN_METEO);
  u.searchParams.set('latitude', String(lat));
  u.searchParams.set('longitude', String(lng));
  u.searchParams.set('current', 'wind_speed_10m,wind_direction_10m');
  u.searchParams.set('wind_speed_unit', 'ms');
  const res = await fetch(u.toString(), { signal });
  if (!res.ok) throw new Error('Open-Meteo wind request failed');
  const j = await res.json();
  const cur = j.current;
  return {
    speedMs: cur?.wind_speed_10m ?? null,
    directionFromDeg: cur?.wind_direction_10m ?? null,
    source: 'meteo',
  };
}

/**
 * @param {number} lat
 * @param {number} lng
 * @param {string} apiKey
 * @param {AbortSignal} [signal]
 */
export async function fetchWindOwm(lat, lng, apiKey, signal) {
  const key = (apiKey || '').trim();
  if (!key) return fetchWindOpenMeteo(lat, lng, signal);
  const url = `${OWM_WEATHER}?lat=${lat}&lon=${lng}&units=metric&appid=${encodeURIComponent(key)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('OpenWeatherMap wind request failed');
  const j = await res.json();
  return {
    speedMs: j.wind?.speed ?? null,
    directionFromDeg: j.wind?.deg ?? null,
    source: 'owm',
  };
}

/**
 * @param {number} lat
 * @param {number} lng
 * @param {{ owmKey?: string, signal?: AbortSignal }} opts
 */
export function fetchWindAtPoint(lat, lng, opts = {}) {
  const { owmKey, signal } = opts;
  if (owmKey && owmKey.trim()) {
    return fetchWindOwm(lat, lng, owmKey, signal);
  }
  return fetchWindOpenMeteo(lat, lng, signal);
}
