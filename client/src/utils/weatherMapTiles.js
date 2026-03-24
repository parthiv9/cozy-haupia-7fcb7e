/**
 * Tile URLs for the interactive weather map.
 * - OpenWeatherMap: temperature, clouds, precipitation (requires VITE_OPENWEATHER_API_KEY).
 * - RainViewer: global precipitation radar (no key; uses public API for latest frame).
 */

const OWM_TILE_BASE = 'https://tile.openweathermap.org/map';

/** @param {string} layer e.g. temp_new, clouds_new, precipitation_new */
export function getOpenWeatherTileUrl(layer, apiKey) {
  const key = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!key) return null;
  return `${OWM_TILE_BASE}/${layer}/{z}/{x}/{y}.png?appid=${encodeURIComponent(key)}`;
}

/**
 * Fetches latest RainViewer radar path and returns a Leaflet-compatible tile URL template.
 * @returns {Promise<string|null>}
 */
export async function getRainViewerTileUrlTemplate() {
  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (!res.ok) return null;
    const data = await res.json();
    const host = data.host || 'https://tilecache.rainviewer.com';
    const past = data.radar?.past;
    if (!past?.length) return null;
    const latest = past[past.length - 1];
    const basePath = latest.path || `/v2/radar/${latest.time}`;
    // 512px tiles; color 2, options 1_1 per RainViewer tile scheme
    return `${host}${basePath}/512/{z}/{x}/{y}/2/1_1.png`;
  } catch {
    return null;
  }
}
