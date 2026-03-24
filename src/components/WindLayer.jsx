import { useCallback, useEffect, useMemo, useState } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { getOpenWeatherApiKey } from '../config/env';

const OWM_WEATHER = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Sanitize numeric API values for use in HTML (avoid injection).
 * @param {unknown} n
 * @param {number} fallback
 */
function num(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

/**
 * Build a Leaflet DivIcon: arrow (0° = up, 90° = right, …) + speed label in km/h.
 * OWM `units=metric` → wind.speed in m/s → display km/h.
 */
function buildWindDivIcon(speedMs, deg, errorMessage, hasKey, loading) {
  const rotation = num(deg, 0);
  const kmh = num(speedMs, 0) * 3.6;
  let label = '…';
  if (!loading) {
    if (!hasKey) label = 'Set API key';
    else if (errorMessage) label = 'Wind unavailable';
    else label = `${kmh.toFixed(0)} km/h`;
  }

  const arrowSvg = `
    <svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <filter id="w" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.25"/>
        </filter>
      </defs>
      <path filter="url(#w)" fill="#0369a1" stroke="#e0f2fe" stroke-width="1.2"
        d="M12 3 L12 19 M7 11 L12 3 L17 11" />
    </svg>
  `;

  const html = `
    <div class="wind-layer-root" style="display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;user-select:none;">
      <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;transform:rotate(${rotation}deg);transform-origin:center center;transition:transform 0.35s ease-out;">
        ${arrowSvg}
      </div>
      <span style="font:600 11px/1.2 system-ui,sans-serif;color:#0c4a6e;background:rgba(255,255,255,0.92);padding:3px 8px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.12);white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis;" title="">
        ${String(label).replace(/</g, '&lt;')}
      </span>
    </div>
  `;

  return L.divIcon({
    className: 'wind-layer-div-icon',
    html,
    iconSize: [64, 72],
    iconAnchor: [32, 56],
  });
}

async function fetchOpenWeatherWind(lat, lon, apiKey) {
  const url = `${OWM_WEATHER}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(apiKey)}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return {
    speed: num(data.wind?.speed, 0),
    deg: num(data.wind?.deg, 0),
  };
}

/**
 * Wind direction + speed as a single rotated arrow marker (OpenWeather current weather).
 * - No tile layers, no particles.
 * - Initial: map center. Click map: move marker + refetch.
 *
 * @param {{ apiKey?: string }} [props] — optional; defaults to `getOpenWeatherApiKey()`
 */
export default function WindLayer({ apiKey: apiKeyProp }) {
  const map = useMap();
  const apiKey = (apiKeyProp ?? getOpenWeatherApiKey()).trim();
  const hasKey = apiKey.length > 0;

  const [position, setPosition] = useState(() => {
    const c = map.getCenter();
    return [c.lat, c.lng];
  });
  const [wind, setWind] = useState({ speed: 0, deg: 0 });
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [loading, setLoading] = useState(false);

  const loadWind = useCallback(
    async (lat, lng) => {
      if (!hasKey) {
        setWind({ speed: 0, deg: 0 });
        setError('Add VITE_OPENWEATHER_API_KEY');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const w = await fetchOpenWeatherWind(lat, lng, apiKey);
        setWind(w);
      } catch (e) {
        setWind({ speed: 0, deg: 0 });
        setError(e instanceof Error ? e.message : 'Request failed');
      } finally {
        setLoading(false);
      }
    },
    [apiKey, hasKey]
  );

  const [lat, lng] = position;
  useEffect(() => {
    loadWind(lat, lng);
  }, [lat, lng, loadWind]);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      loadWind(lat, lng);
    },
  });

  const icon = useMemo(
    () => buildWindDivIcon(wind.speed, wind.deg, error, hasKey, loading),
    [wind.speed, wind.deg, error, hasKey, loading]
  );

  return <Marker position={position} icon={icon} interactive={false} />;
}

/*
 * =============================================================================
 * INTEGRATION EXAMPLE (react-leaflet MapContainer)
 * =============================================================================
 *
 * import { MapContainer, TileLayer } from 'react-leaflet';
 * import WindLayer from './components/WindLayer';
 * import 'leaflet/dist/leaflet.css';
 *
 * export function MapWithWind() {
 *   return (
 *     <MapContainer center={[51.5, -0.12]} zoom={10} style={{ height: 400, width: '100%' }}>
 *       <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
 *       <WindLayer />
 *       { // optional explicit key:
 *       // <WindLayer apiKey={import.meta.env.VITE_OPENWEATHER_API_KEY} />
 *       }
 *     </MapContainer>
 *   );
 * }
 *
 * - WindLayer must be a **child** of MapContainer (uses useMap / useMapEvents).
 * - Click the map to move the arrow and load wind for that point.
 * - Requires a valid OpenWeather API key (same endpoint as sample).
 * =============================================================================
 */
