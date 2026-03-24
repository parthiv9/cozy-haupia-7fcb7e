import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, useMap, useMapEvents, CircleMarker, Popup } from 'react-leaflet';
import { getOpenWeatherApiKey } from '../config/env';
import { getOpenWeatherTileUrl, getRainViewerTileUrlTemplate } from '../utils/weatherMapTiles';
import { fetchWeatherForMapPoint } from '../utils/mapService';
import { getCurrentPosition } from '../utils/locationService';
import WeatherIcon from './WeatherIcon';
import WindFlowLayer from './WindFlowLayer';
import CycloneLayer from './CycloneLayer';

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const OWM_ATTRIBUTION =
  'Weather data &copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>';
const RAIN_ATTRIBUTION = 'Radar &copy; <a href="https://www.rainviewer.com/">RainViewer</a>';

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 2;
/** Zoom after we have the user’s coordinates (city / regional view) */
const USER_LOCATION_ZOOM = 10;

/** Meteorological degrees (direction wind blows *from*) → 8-point compass */
function cardinalFromDeg(deg) {
  if (deg == null || Number.isNaN(Number(deg))) return null;
  const d = ((Number(deg) % 360) + 360) % 360;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(d / 45) % 8];
}

function formatWindSpeedMs(speed) {
  if (speed == null || Number.isNaN(Number(speed))) return null;
  const ms = Number(speed);
  const kmh = ms * 3.6;
  return `${ms.toFixed(1)} m/s (${kmh.toFixed(0)} km/h)`;
}

const LAYERS = [
  { id: 'none', label: 'Map only', needsKey: false, rain: false },
  { id: 'radar', label: 'Precipitation (radar)', needsKey: false, rain: true },
  { id: 'temp', label: 'Temperature', needsKey: true, rain: false },
  { id: 'clouds', label: 'Clouds', needsKey: true, rain: false },
  { id: 'precip', label: 'Rain (OWM)', needsKey: true, rain: false },
  { id: 'wind', label: 'Wind flow', needsKey: false, rain: false },
];

function ResizeOnOpen({ open }) {
  const map = useMap();
  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(t);
  }, [open, map]);
  return null;
}

/** After geolocation resolves, fit the map to the user (runs once coords are known). */
function FlyToUserLocation({ open, lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (!open || lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return;
    const id = window.setTimeout(() => {
      map.invalidateSize();
      map.flyTo([lat, lng], zoom, { duration: 0.85 });
    }, 80);
    return () => clearTimeout(id);
  }, [map, open, lat, lng, zoom]);
  return null;
}

function MapClickLayer({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapLayers({
  open,
  layerId,
  owmKey,
  rainTemplate,
  onMapClick,
  pick,
  pickLoading,
  pickData,
  pickNight,
  userLat,
  userLng,
  mapDialogOpen,
  cyclonesEnabled,
}) {
  let overlayUrl = null;
  let overlayOpacity = 0.65;
  let overlayAttribution = '';

  if (layerId === 'radar' && rainTemplate) {
    overlayUrl = rainTemplate;
    overlayOpacity = 0.75;
    overlayAttribution = RAIN_ATTRIBUTION;
  } else if (owmKey) {
    if (layerId === 'temp') {
      overlayUrl = getOpenWeatherTileUrl('temp_new', owmKey);
      overlayAttribution = OWM_ATTRIBUTION;
    } else if (layerId === 'clouds') {
      overlayUrl = getOpenWeatherTileUrl('clouds_new', owmKey);
      overlayAttribution = OWM_ATTRIBUTION;
    } else if (layerId === 'precip') {
      overlayUrl = getOpenWeatherTileUrl('precipitation_new', owmKey);
      overlayAttribution = OWM_ATTRIBUTION;
    }
  }

  const w = pickData?.weather?.weather?.[0];
  const main = pickData?.weather?.main;
  const wind = pickData?.weather?.wind;
  const windCardinal = cardinalFromDeg(wind?.deg);
  const windSpeedLine = formatWindSpeedMs(wind?.speed);

  return (
    <>
      <ResizeOnOpen open={open} />
      <FlyToUserLocation open={open} lat={userLat} lng={userLng} zoom={USER_LOCATION_ZOOM} />
      <TileLayer
        attribution={OSM_ATTRIBUTION}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {overlayUrl && (
        <TileLayer
          url={overlayUrl}
          attribution={overlayAttribution}
          opacity={overlayOpacity}
          maxZoom={19}
          zIndex={10}
        />
      )}
      <WindFlowLayer active={layerId === 'wind'} mapOpen={mapDialogOpen} />
      <CycloneLayer enabled={cyclonesEnabled} mapOpen={mapDialogOpen} showTracks />
      <MapClickLayer onPick={onMapClick} />
      {pick && (
        <CircleMarker
          key={`${pick.lat}-${pick.lng}-${pickData?.name || ''}`}
          center={[pick.lat, pick.lng]}
          radius={10}
          pathOptions={{ color: '#0ea5e9', fillColor: '#7dd3fc', fillOpacity: 0.95, weight: 2 }}
          eventHandlers={{
            add: (e) => {
              e.target.openPopup();
            },
          }}
        >
          <Popup>
            <div className="min-w-[200px] text-text-dark">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tap point</p>
              {pickLoading && <p className="mt-2 text-sm">Loading weather…</p>}
              {!pickLoading && pickData && (
                <>
                  <p className="mt-1 font-semibold">{pickData.name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <WeatherIcon weather={w} className="h-12 w-12" isNight={pickNight} />
                    <div>
                      <p className="text-2xl font-bold">
                        {main?.temp != null ? `${Math.round(main.temp)}°C` : '—'}
                      </p>
                      <p className="text-xs capitalize text-slate-600">{w?.description || '—'}</p>
                    </div>
                  </div>
                  {windSpeedLine && (
                    <div className="mt-3 border-t border-slate-200/80 pt-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Wind (API)
                      </p>
                      <div className="mt-1 flex items-start gap-2">
                        {wind?.deg != null && Number.isFinite(Number(wind.deg)) && (
                          <div
                            className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sky-100/90"
                            title="Arrow shows where the wind is blowing toward"
                            aria-hidden
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-5 w-5 text-sky-700"
                              style={{
                                /* Meteorological deg = direction wind comes from; +180° = downwind */
                                transform: `rotate(${Number(wind.deg) + 180}deg)`,
                                transformOrigin: 'center',
                              }}
                            >
                              <path
                                fill="currentColor"
                                d="M12 3 12 17M7 10l5-7 5 7"
                              />
                            </svg>
                          </div>
                        )}
                        <div className="min-w-0 text-sm text-text-dark">
                          <p className="font-semibold">{windSpeedLine}</p>
                          {windCardinal != null && wind?.deg != null && (
                            <p className="text-xs text-slate-600">
                              From {windCardinal} · {Math.round(Number(wind.deg))}°
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="mt-2 text-[10px] text-slate-400">
                    {pick.lat.toFixed(3)}, {pick.lng.toFixed(3)}
                  </p>
                </>
              )}
              {!pickLoading && !pickData && (
                <p className="mt-2 text-sm text-red-600">Could not load weather. Try again.</p>
              )}
            </div>
          </Popup>
        </CircleMarker>
      )}
    </>
  );
}

export default function WeatherMap({ open, onClose }) {
  const [activeLayer, setActiveLayer] = useState('radar');
  const [rainTemplate, setRainTemplate] = useState(null);
  const [rainLoaded, setRainLoaded] = useState(false);
  const [pick, setPick] = useState(null);
  const [pickLoading, setPickLoading] = useState(false);
  const [pickData, setPickData] = useState(null);
  /** [lat, lng] from geolocation when map opens; null if pending or unavailable */
  const [userMapCoords, setUserMapCoords] = useState(null);
  const [userMapLocState, setUserMapLocState] = useState('idle'); // idle | loading | ok | unavailable
  const [cycloneLayerOn, setCycloneLayerOn] = useState(true);
  const owmKey = getOpenWeatherApiKey();

  const loadRainTiles = useCallback(async () => {
    const url = await getRainViewerTileUrlTemplate();
    setRainLoaded(true);
    setRainTemplate(url || null);
  }, []);

  useEffect(() => {
    if (!open) return;
    loadRainTiles();
    const id = setInterval(loadRainTiles, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [open, loadRainTiles]);

  useEffect(() => {
    if (rainLoaded && !rainTemplate && activeLayer === 'radar') {
      setActiveLayer('none');
    }
  }, [rainLoaded, rainTemplate, activeLayer]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setPick(null);
      setPickData(null);
      setPickLoading(false);
      setUserMapCoords(null);
      setUserMapLocState('idle');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setUserMapCoords(null);
    setUserMapLocState('loading');
    getCurrentPosition()
      .then((pos) => {
        if (cancelled) return;
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        if (lat != null && lon != null && Number.isFinite(lat) && Number.isFinite(lon)) {
          setUserMapCoords([lat, lon]);
          setUserMapLocState('ok');
        } else {
          setUserMapLocState('unavailable');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setUserMapCoords(null);
        setUserMapLocState('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const onMapClick = useCallback(async (lat, lng) => {
    setPick({ lat, lng });
    setPickLoading(true);
    setPickData(null);
    const result = await fetchWeatherForMapPoint(lat, lng);
    setPickData(result);
    setPickLoading(false);
  }, []);

  const pickNight = pickData?.weather?.is_day === 0;

  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/55 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="weather-map-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/25 bg-white/95 shadow-2xl backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-sky-50/80 px-4 py-3 sm:px-5">
              <div>
                <h2 id="weather-map-title" className="text-lg font-semibold text-text-dark">
                  Weather intelligence map
                </h2>
                <p className="text-xs text-text-dark/60">
                  Toggle layers · Click anywhere for live conditions
                  {userMapLocState === 'loading' && ' · Locating you…'}
                  {userMapLocState === 'unavailable' && ' · World view (location unavailable)'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-text-dark shadow-sm transition hover:bg-slate-50"
                aria-label="Close map"
              >
                Close
              </button>
            </header>

            <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-slate-100 bg-white/90 px-3 py-2.5 sm:px-4">
              {LAYERS.map((layer) => {
                const disabled =
                  (layer.needsKey && !owmKey) || (layer.rain && rainLoaded && !rainTemplate);
                const isActive = activeLayer === layer.id;
                return (
                  <button
                    key={layer.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setActiveLayer(layer.id)}
                    title={
                      layer.needsKey && !owmKey
                        ? 'Set VITE_OPENWEATHER_API_KEY in .env'
                        : layer.rain && rainLoaded && !rainTemplate
                          ? 'Radar unavailable'
                          : undefined
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                      isActive
                        ? 'bg-primary-end text-white shadow-md'
                        : disabled
                          ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                          : 'bg-slate-100 text-text-dark hover:bg-slate-200'
                    }`}
                  >
                    {layer.label}
                  </button>
                );
              })}
              <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" aria-hidden />
              <button
                type="button"
                onClick={() => setCycloneLayerOn((v) => !v)}
                title="NASA EONET / JTWC tropical systems"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                  cycloneLayerOn
                    ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-200'
                    : 'bg-slate-100 text-text-dark hover:bg-slate-200'
                }`}
              >
                🌪️ Cyclone tracker
              </button>
            </div>

            {!owmKey && (
              <p className="border-b border-amber-100 bg-amber-50/90 px-4 py-2 text-xs text-amber-900/80">
                Add <code className="rounded bg-amber-100/80 px-1">VITE_OPENWEATHER_API_KEY</code> in{' '}
                <code className="rounded bg-amber-100/80 px-1">.env</code> for temperature, cloud, and rain
                tiles. Wind flow uses Open-Meteo (no key). Radar works without a key.
              </p>
            )}

            <div className="relative min-h-[320px] flex-1 bg-slate-100 p-3 sm:min-h-[420px] sm:p-4">
              <div className="leaflet-map-shell h-[min(65vh,560px)] w-full overflow-hidden rounded-xl border border-slate-200/80 shadow-inner">
                <MapContainer
                  center={DEFAULT_CENTER}
                  zoom={DEFAULT_ZOOM}
                  className="h-full w-full min-h-[320px] rounded-xl"
                  scrollWheelZoom
                  zoomControl
                  worldCopyJump
                >
                  <MapLayers
                    open={open}
                    layerId={activeLayer}
                    owmKey={owmKey}
                    rainTemplate={rainTemplate}
                    onMapClick={onMapClick}
                    pick={pick}
                    pickLoading={pickLoading}
                    pickData={pickData}
                    pickNight={pickNight}
                    userLat={userMapCoords?.[0]}
                    userLng={userMapCoords?.[1]}
                    mapDialogOpen={open}
                    cyclonesEnabled={cycloneLayerOn}
                  />
                </MapContainer>
              </div>
            </div>

            <footer className="flex-shrink-0 border-t border-slate-100 bg-slate-50/90 px-4 py-2 text-[10px] text-text-dark/50 sm:text-xs">
              OpenStreetMap · Open-Meteo wind flow · OpenWeatherMap tiles (with API key) · RainViewer radar · NASA
              EONET cyclones
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalTarget
  );
}
