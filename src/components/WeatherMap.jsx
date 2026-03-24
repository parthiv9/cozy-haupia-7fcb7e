import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Popup,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../leaflet-shell.css';
import '../utils/leafletIconFix';
import { requestLocationPermission, getGeolocationErrorMessage } from '../utils/locationService';
import { getWeatherByCoords } from '../utils/weatherApi';
import { getOpenWeatherApiKey } from '../config/env';
import WindArrowsLayer from './WindArrowsLayer';
import WindFlowLayer from './WindFlowLayer';
import CycloneTracksLayer from './CycloneTracksLayer';

/** Resolved from `import.meta.env.VITE_OPENWEATHER_API_KEY` via `getOpenWeatherApiKey()` (trim, placeholders → ''). */
const API_KEY = getOpenWeatherApiKey();

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const OWM_ATTR = 'Tiles &copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>';

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 2;
const FOCUS_ZOOM = 11;
const BASE_MAP_Z = 200;
const OWM_PANE = 'owmWeatherStack';

/** Exposes Leaflet map to parent once initialized (sidebar toggles live outside MapContainer). */
function MapReadyBridge({ onMap }) {
  const map = useMap();
  useEffect(() => {
    onMap(map);
    return () => onMap(null);
  }, [map, onMap]);
  return null;
}

function ResizeOnOpen({ active }) {
  const map = useMap();
  useEffect(() => {
    if (!active) return;
    const t = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(t);
  }, [active, map]);
  return null;
}

function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {
        /* noop */
      }
    }, 200);
    return () => window.clearTimeout(id);
  }, [map]);
  return null;
}

/** Inline map: parent often gets size after paint — Leaflet needs invalidateSize so tiles render. */
function InvalidateEmbeddedMap({ active }) {
  const map = useMap();
  useEffect(() => {
    if (!active) return;
    const fix = () => {
      try {
        map.invalidateSize({ animate: false });
      } catch {
        /* noop */
      }
    };
    fix();
    const raf = requestAnimationFrame(fix);
    const t1 = setTimeout(fix, 120);
    const t2 = setTimeout(fix, 450);
    window.addEventListener('resize', fix);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', fix);
    };
  }, [active, map]);
  return null;
}

function FlyToFocus({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return;
    const id = window.setTimeout(() => {
      map.invalidateSize();
      map.flyTo([lat, lng], zoom, { duration: 0.75 });
    }, 100);
    return () => clearTimeout(id);
  }, [map, lat, lng, zoom]);
  return null;
}

function MapClickMoveFocus({ enabled, onPick }) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Draggable pin: click map to move; fetches live weather and opens Leaflet popup (city, temp, condition). */
function LiveWeatherPopupMarker({ focus, setFocusFromDrag, mapOpen }) {
  const markerRef = useRef(null);
  const [w, setW] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (focus.lat == null || !mapOpen) {
      setW(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setW(null);
    getWeatherByCoords(focus.lat, focus.lng)
      .then((data) => {
        if (alive) setW(data);
      })
      .catch(() => {
        if (alive) setW(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [focus.lat, focus.lng, mapOpen]);

  useEffect(() => {
    if (!w || loading) return;
    const id = requestAnimationFrame(() => {
      markerRef.current?.openPopup?.();
    });
    return () => cancelAnimationFrame(id);
  }, [w, loading]);

  if (focus.lat == null || focus.lng == null) return null;

  return (
    <Marker
      ref={markerRef}
      position={[focus.lat, focus.lng]}
      draggable
      eventHandlers={{ dragend: (e) => setFocusFromDrag(e.target.getLatLng()) }}
    >
      <Popup>
        {loading && <p className="text-sm font-medium">Loading conditions…</p>}
        {!loading && w && (
          <div className="min-w-[150px] text-sm">
            <p className="font-bold text-slate-900">{w.name}</p>
            <p className="text-xl font-semibold text-sky-600">
              {w.main?.temp != null ? `${Math.round(w.main.temp)}°C` : '—'}
            </p>
            <p className="capitalize text-slate-600">{w.weather?.[0]?.description || '—'}</p>
          </div>
        )}
        {!loading && !w && <p className="text-sm text-red-600">Could not load weather.</p>}
      </Popup>
    </Marker>
  );
}

/**
 * Leaflet modal: OSM base + imperative OWM tile layers (addTo / removeLayer).
 * No search. activeLayers defaults all false; multiple layers may be on at once.
 */
export default function WeatherMap({ open, onClose, centerLat, centerLng, embedded = false }) {
  const effectiveOpen = embedded || open;
  const [focus, setFocus] = useState({ lat: null, lng: null });
  const [activeLayers, setActiveLayers] = useState({
    clouds: false,
    rain: false,
    temp: false,
  });
  /** Wind: off | grid arrows (OWM/Open-Meteo points) | animated flow (Open-Meteo field + particles). */
  const [windMode, setWindMode] = useState(/** @type {'off' | 'arrows' | 'flow'} */ ('off'));
  /** NASA EONET tropical cyclone tracks (no API key). */
  const [cyclonesEnabled, setCyclonesEnabled] = useState(false);
  const [cycloneMeta, setCycloneMeta] = useState({
    loading: false,
    error: null,
    count: 0,
    fetchedAt: null,
  });
  const [panelLight, setPanelLight] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  /** Set when Leaflet map is ready (MapContainer finished init). */
  const [leafletMap, setLeafletMap] = useState(null);
  /** Re-render after imperative L.tileLayer instances exist. */
  const [layersReady, setLayersReady] = useState(false);

  const cloudsLayerRef = useRef(null);
  const rainLayerRef = useRef(null);
  const tempLayerRef = useRef(null);

  const onMap = useCallback((map) => {
    setLeafletMap(map);
  }, []);

  /** Create L.tileLayer instances once the map exists and API_KEY is set. */
  useEffect(() => {
    if (!effectiveOpen || !leafletMap || !API_KEY) {
      setLayersReady(false);
      return;
    }

    const map = leafletMap;

    if (!map.getPane(OWM_PANE)) {
      map.createPane(OWM_PANE);
      const el = map.getPane(OWM_PANE);
      if (el) el.style.zIndex = '450';
    }

    const common = {
      opacity: 0.6,
      attribution: OWM_ATTR,
      maxZoom: 19,
      pane: OWM_PANE,
    };

    const cloudsLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/clouds/{z}/{x}/{y}.png?appid=${API_KEY}`,
      { ...common, zIndex: 20 }
    );
    const rainLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/rain/{z}/{x}/{y}.png?appid=${API_KEY}`,
      { ...common, zIndex: 30 }
    );
    const tempLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/temp/{z}/{x}/{y}.png?appid=${API_KEY}`,
      { ...common, zIndex: 10 }
    );

    cloudsLayerRef.current = cloudsLayer;
    rainLayerRef.current = rainLayer;
    tempLayerRef.current = tempLayer;
    setLayersReady(true);

    return () => {
      [cloudsLayer, rainLayer, tempLayer].forEach((layer) => {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      });
      cloudsLayerRef.current = null;
      rainLayerRef.current = null;
      tempLayerRef.current = null;
      setLayersReady(false);
    };
  }, [effectiveOpen, leafletMap]);

  useEffect(() => {
    if (embedded) return;
    if (!open) {
      setActiveLayers({ clouds: false, rain: false, temp: false });
      setWindMode('off');
      setCyclonesEnabled(false);
      setCycloneMeta({ loading: false, error: null, count: 0, fetchedAt: null });
    }
  }, [embedded, open]);

  useEffect(() => {
    if (!effectiveOpen) return;
    if (centerLat != null && centerLng != null) {
      setFocus({ lat: centerLat, lng: centerLng });
    }
  }, [effectiveOpen, centerLat, centerLng]);

  useEffect(() => {
    if (embedded || !open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [embedded, open, onClose]);

  /**
   * Toggle pattern: if layer is currently on the map, remove it; otherwise add it.
   * Matches: if (activeLayers[name]) map.removeLayer(layer); else layer.addTo(map);
   */
  const toggleLayer = useCallback((name, layer) => {
    const map = leafletMap;
    if (!map || !layer || !API_KEY) return;

    setActiveLayers((prev) => {
      if (prev[name]) {
        map.removeLayer(layer);
      } else {
        layer.addTo(map);
      }
      return { ...prev, [name]: !prev[name] };
    });
  }, [leafletMap, API_KEY]);

  const handleGeo = async () => {
    setGeoLoading(true);
    setGeoError(null);
    try {
      const { lat, lon } = await requestLocationPermission();
      setFocus({ lat, lng: lon });
    } catch (e) {
      setGeoError(getGeolocationErrorMessage(e));
    } finally {
      setGeoLoading(false);
    }
  };

  const setFocusFromDrag = (latlng) => {
    setFocus({ lat: latlng.lat, lng: latlng.lng });
  };

  const mapZoom = focus.lat != null ? FOCUS_ZOOM : DEFAULT_ZOOM;
  const mapCenter = focus.lat != null ? [focus.lat, focus.lng] : DEFAULT_CENTER;

  const panel = panelLight
    ? 'bg-white/95 text-slate-900 border-slate-200'
    : 'bg-slate-900/95 text-slate-100 border-white/10';
  const muted = panelLight ? 'text-slate-500' : 'text-slate-400';

  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  if (!embedded && !portalTarget) return null;

  const cloudsLayer = cloudsLayerRef.current;
  const rainLayer = rainLayerRef.current;
  const tempLayer = tempLayerRef.current;
  const canToggle = Boolean(API_KEY && layersReady && cloudsLayer && rainLayer && tempLayer);

  const asideClass = embedded
    ? `flex max-h-[36vh] w-full flex-shrink-0 flex-col overflow-hidden rounded-2xl border shadow-2xl sm:max-h-none sm:w-[min(100%,300px)] sm:rounded-r-none ${panel} sm:border-r-0`
    : `flex max-h-[36vh] w-full flex-shrink-0 flex-col overflow-hidden rounded-2xl border shadow-2xl sm:max-h-none sm:w-[min(100%,300px)] sm:rounded-r-none ${panel} sm:border-r-0`;

  const mapWrapClass = embedded
    ? `relative w-full h-[300px] sm:h-[350px] md:h-[400px] overflow-hidden rounded-2xl border shadow-xl ${
        panelLight ? 'border-slate-200 bg-slate-100' : 'border-white/10 bg-slate-950'
      }`
    : `relative min-h-[min(52vh,420px)] flex-1 overflow-hidden rounded-2xl border shadow-xl sm:min-h-0 sm:rounded-l-none sm:rounded-r-2xl ${
        panelLight ? 'border-slate-200 bg-slate-100' : 'border-white/10 bg-slate-950'
      }`;

  const leafletShellClass = embedded
    ? 'leaflet-map-shell h-full min-h-[min(52vh,420px)] w-full sm:min-h-[min(76vh,720px)]'
    : 'leaflet-map-shell h-full min-h-[min(52vh,420px)] w-full sm:min-h-[min(76vh,720px)]';

  const mapContainerClass = embedded
    ? 'w-full h-full rounded-2xl'
    : 'h-full w-full rounded-2xl sm:rounded-l-none sm:rounded-r-2xl';

  const asideEl = (
      <aside className={asideClass}>
        <div
          className={`flex items-center justify-between border-b px-4 py-3 ${panelLight ? 'border-slate-200' : 'border-white/10'}`}
        >
          <div>
            {!embedded && (
              <>
                <h2 id="weather-map-title" className="text-lg font-bold tracking-tight">
                  Weather map
                </h2>
                <p className={`text-[11px] ${muted}`}>Leaflet · OpenWeatherMap tiles</p>
              </>
            )}
            {embedded && (
              <p className={`text-sm font-semibold tracking-tight ${panelLight ? 'text-slate-900' : 'text-white'}`}>
                Map layers
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setPanelLight((v) => !v)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                panelLight
                  ? 'border-slate-200 bg-slate-100 text-slate-800'
                  : 'border-white/20 bg-white/10 text-white'
              }`}
              title="Toggle panel theme"
            >
              {panelLight ? '🌙' : '☀️'}
            </button>
            {!embedded && (
              <button
                type="button"
                onClick={onClose}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                  panelLight
                    ? 'border-slate-200 bg-white text-slate-800'
                    : 'border-white/20 bg-white/10 text-white'
                }`}
              >
                Close
              </button>
            )}
          </div>
        </div>

              <div className="flex-1 overflow-y-auto px-4 py-3">
                <button
                  type="button"
                  disabled={geoLoading}
                  onClick={handleGeo}
                  className="mb-4 w-full rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-sky-600 disabled:opacity-50"
                >
                  {geoLoading ? 'Locating…' : '📍 Use my location'}
                </button>
                {geoError && (
                  <p className={`mb-3 text-xs ${panelLight ? 'text-amber-700' : 'text-amber-200'}`}>
                    {geoError}
                  </p>
                )}

                <div
                  className={`rounded-xl border p-3 ${panelLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-slate-800/50'}`}
                >
                  <p className={`mb-2 text-xs font-bold uppercase tracking-wide ${muted}`}>
                    Weather layers
                  </p>
                  <p className={`mb-3 text-[11px] leading-snug ${muted}`}>
                    Tiles stack temp → clouds → rain. Wind: grid arrows or animated flow (Open-Meteo).
                  </p>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={!canToggle}
                      aria-pressed={activeLayers.clouds}
                      onClick={() => toggleLayer('clouds', cloudsLayer)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        activeLayers.clouds
                          ? panelLight
                            ? 'border-sky-500 bg-sky-500 text-white'
                            : 'border-sky-400 bg-sky-600 text-white'
                          : panelLight
                            ? 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                            : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      Clouds
                    </button>
                    <button
                      type="button"
                      disabled={!canToggle}
                      aria-pressed={activeLayers.rain}
                      onClick={() => toggleLayer('rain', rainLayer)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        activeLayers.rain
                          ? panelLight
                            ? 'border-sky-500 bg-sky-500 text-white'
                            : 'border-sky-400 bg-sky-600 text-white'
                          : panelLight
                            ? 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                            : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      Rain
                    </button>
                    <button
                      type="button"
                      disabled={!canToggle}
                      aria-pressed={activeLayers.temp}
                      onClick={() => toggleLayer('temp', tempLayer)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        activeLayers.temp
                          ? panelLight
                            ? 'border-sky-500 bg-sky-500 text-white'
                            : 'border-sky-400 bg-sky-600 text-white'
                          : panelLight
                            ? 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                            : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      Temperature
                    </button>
                    <div className={`rounded-lg border p-2 ${panelLight ? 'border-slate-200 bg-white' : 'border-white/15 bg-slate-800/40'}`}>
                      <p className={`mb-2 text-[10px] font-bold uppercase tracking-wide ${muted}`}>
                        Cyclone tracking
                      </p>
                      <button
                        type="button"
                        disabled={!leafletMap}
                        aria-pressed={cyclonesEnabled}
                        onClick={() => setCyclonesEnabled((v) => !v)}
                        className={`mb-2 w-full rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          cyclonesEnabled
                            ? panelLight
                              ? 'border-violet-500 bg-violet-600 text-white'
                              : 'border-violet-400 bg-violet-700 text-white'
                            : panelLight
                              ? 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                              : 'border-white/15 bg-white/5 text-slate-100 hover:bg-white/10'
                        }`}
                      >
                        🌪️ Tropical cyclones
                      </button>
                      {cyclonesEnabled && cycloneMeta.loading && (
                        <p className={`mb-2 text-[11px] ${muted}`}>Loading EONET tracks…</p>
                      )}
                      {cyclonesEnabled && cycloneMeta.error && (
                        <p className={`mb-2 text-[11px] ${panelLight ? 'text-red-600' : 'text-red-300'}`}>
                          {cycloneMeta.error}
                        </p>
                      )}
                      {cyclonesEnabled && !cycloneMeta.loading && !cycloneMeta.error && cycloneMeta.count === 0 && (
                        <p className={`mb-2 text-[11px] leading-snug ${muted}`}>
                          No matching tropical systems in the last 90 days (open events).
                        </p>
                      )}
                      {cyclonesEnabled && cycloneMeta.count > 0 && (
                        <p className={`mb-2 text-[11px] ${muted}`}>
                          Showing {cycloneMeta.count} system{cycloneMeta.count === 1 ? '' : 's'} — polylines are past
                          track; marker is latest position.
                        </p>
                      )}
                      <p className={`text-[10px] leading-snug ${muted}`}>
                        Source:{' '}
                        <a
                          href="https://eonet.gsfc.nasa.gov/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold underline"
                        >
                          NASA EONET
                        </a>{' '}
                        (severe storms / JTWC · NHC).
                      </p>
                    </div>

                    <div className={`rounded-lg border p-2 ${panelLight ? 'border-slate-200 bg-white' : 'border-white/15 bg-slate-800/40'}`}>
                      <p className={`mb-2 text-[10px] font-bold uppercase tracking-wide ${muted}`}>Wind layer</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { mode: 'off', label: 'Off' },
                          { mode: 'arrows', label: 'Arrows' },
                          { mode: 'flow', label: 'Flow' },
                        ].map(({ mode, label }) => (
                          <button
                            key={mode}
                            type="button"
                            disabled={!leafletMap}
                            aria-pressed={windMode === mode}
                            onClick={() => setWindMode(mode)}
                            className={`rounded-md border px-1.5 py-2 text-center text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                              windMode === mode
                                ? panelLight
                                  ? 'border-emerald-500 bg-emerald-600 text-white'
                                  : 'border-emerald-400 bg-emerald-700 text-white'
                                : panelLight
                                  ? 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                                  : 'border-white/15 bg-white/5 text-slate-100 hover:bg-white/10'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {!API_KEY && (
                  <p
                    className={`mt-3 rounded-lg px-2 py-2 text-[11px] ${
                      panelLight ? 'bg-amber-100 text-amber-900' : 'bg-amber-500/20 text-amber-100'
                    }`}
                  >
                    Set <code className="rounded bg-black/10 px-1">VITE_OPENWEATHER_API_KEY</code> in{' '}
                    <code className="rounded bg-black/10 px-1">.env</code> to enable layers.
                  </p>
                )}
              </div>
      </aside>
  );

  const mapEl = (
      <div className={mapWrapClass}>
        <div className={leafletShellClass}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className={mapContainerClass}
            scrollWheelZoom
            zoomControl
            worldCopyJump
            whenReady={(e) => {
              try {
                e.target.invalidateSize();
              } catch {
                /* noop */
              }
            }}
          >
            <MapReadyBridge onMap={onMap} />
            <ResizeMap />
            <ResizeOnOpen active={effectiveOpen} />
            <InvalidateEmbeddedMap active={embedded} />
            <FlyToFocus lat={focus.lat} lng={focus.lng} zoom={FOCUS_ZOOM} />
            <TileLayer
              attribution={OSM_ATTRIBUTION}
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
            <WindFlowLayer active={windMode === 'flow'} mapOpen={effectiveOpen} />
            <WindArrowsLayer enabled={windMode === 'arrows'} mapOpen={effectiveOpen} owmApiKey={API_KEY} />
            <CycloneTracksLayer
              active={cyclonesEnabled}
              mapOpen={effectiveOpen}
              onStatus={setCycloneMeta}
            />
            <MapClickMoveFocus enabled={effectiveOpen} onPick={(lat, lng) => setFocus({ lat, lng })} />
            <LiveWeatherPopupMarker
              focus={focus}
              setFocusFromDrag={setFocusFromDrag}
              mapOpen={effectiveOpen}
            />
          </MapContainer>
        </div>
      </div>
  );

  const mapChrome = embedded ? (
    <>
      {mapEl}
      {asideEl}
    </>
  ) : (
    <>
      {asideEl}
      {mapEl}
    </>
  );

  if (embedded) {
    return (
      <div className="flex w-full flex-col gap-0 sm:flex-row" role="region" aria-label="Weather map">
        {mapChrome}
      </div>
    );
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="weather-map-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="mx-auto flex h-full max-h-[100dvh] max-w-[1600px] flex-col gap-0 p-2 sm:flex-row sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {mapChrome}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalTarget
  );
}
