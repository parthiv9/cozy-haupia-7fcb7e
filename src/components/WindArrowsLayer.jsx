import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { gridPointsFromBounds, fetchWindAtPoint } from '../utils/windGridApi';

/** Debounce delay after pan/zoom before refetching wind grid (ms). */
const MOVE_DEBOUNCE_MS = 450;
/** Grid density: 3×3 keeps requests light while showing spatial variation. */
const GRID_ROWS = 3;
const GRID_COLS = 3;

/**
 * CSS rotation for arrow SVG (default points up = geographic north).
 * APIs give meteorological "wind FROM" degrees; the arrow shows where air flows (downwind) = FROM + 180°.
 */
function downwindRotationCssDeg(directionFromDeg) {
  const d = Number(directionFromDeg);
  if (!Number.isFinite(d)) return 0;
  return (d + 180) % 360;
}

/** Map wind speed (m/s) to icon scale for quick visual comparison. */
function speedToScale(speedMs) {
  const s = Number(speedMs);
  if (!Number.isFinite(s) || s < 0) return 0.75;
  return 0.65 + Math.min(s / 20, 1) * 0.65;
}

/**
 * Lightweight arrow: inline SVG + transform (no image assets).
 * Drop shadow keeps it readable on both light and dark basemap tiles.
 */
function windArrowDivIcon(rotationCssDeg, scale, speedMs) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color:#0ea5e9;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))">
    <path d="M12 3 L12 19 M7 10 L12 3 L17 10"/>
  </svg>`;
  const dur = Math.max(0.9, 3.2 - Math.min(Number(speedMs) || 0, 25) * 0.08);
  const html = `<div style="transform:rotate(${rotationCssDeg}deg) scale(${scale});width:28px;height:28px;display:flex;align-items:center;justify-content:center">
    <div class="wind-arrow-pulse" style="animation-duration:${dur}s">${svg}</div>
  </div>`;
  return L.divIcon({
    className: 'wind-arrow-leaflet-icon',
    html,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/**
 * Wind direction arrows on a lat/lng grid across the visible map.
 * Refreshes on moveend/zoomend (debounced). Uses OWM when `owmApiKey` is set, else Open-Meteo.
 */
export default function WindArrowsLayer({ enabled, mapOpen, owmApiKey }) {
  const map = useMap();
  const [samples, setSamples] = useState([]);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  const loadGrid = useCallback(() => {
    if (!enabled || !mapOpen || !map) {
      setSamples([]);
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const reqId = ++requestIdRef.current;

    const bounds = map.getBounds();
    const points = gridPointsFromBounds(bounds, GRID_ROWS, GRID_COLS);

    Promise.all(
      points.map(({ lat, lng }) =>
        fetchWindAtPoint(lat, lng, { owmKey: owmApiKey, signal: ac.signal }).then(
          (w) => ({
            lat,
            lng,
            speedMs: w.speedMs,
            directionFromDeg: w.directionFromDeg,
            source: w.source,
          }),
          () => ({
            lat,
            lng,
            speedMs: null,
            directionFromDeg: null,
            source: null,
          })
        )
      )
    ).then((rows) => {
      if (ac.signal.aborted || reqId !== requestIdRef.current) return;
      setSamples(rows.filter((r) => r.directionFromDeg != null && Number.isFinite(r.directionFromDeg)));
    });
  }, [enabled, mapOpen, map, owmApiKey]);

  const scheduleLoad = useCallback(() => {
    if (!enabled || !mapOpen) return;
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(loadGrid, MOVE_DEBOUNCE_MS);
  }, [enabled, mapOpen, loadGrid]);

  useMapEvents({
    moveend: scheduleLoad,
    zoomend: scheduleLoad,
  });

  useEffect(() => {
    if (!enabled || !mapOpen) {
      abortRef.current?.abort();
      setSamples([]);
      return;
    }
    const t = window.setTimeout(loadGrid, 120);
    return () => {
      abortRef.current?.abort();
      window.clearTimeout(t);
      window.clearTimeout(debounceRef.current);
    };
  }, [enabled, mapOpen, loadGrid]);

  if (!enabled || samples.length === 0) return null;

  return (
    <>
      {samples.map((s, i) => {
        const rot = downwindRotationCssDeg(s.directionFromDeg);
        const sc = speedToScale(s.speedMs);
        const icon = windArrowDivIcon(rot, sc, s.speedMs);
        return (
          <Marker key={`${s.lat.toFixed(4)}-${s.lng.toFixed(4)}-${i}`} position={[s.lat, s.lng]} icon={icon}>
            <Popup>
              <div className="text-xs">
                <div>
                  <strong>Wind</strong>
                </div>
                {s.speedMs != null && Number.isFinite(s.speedMs) && (
                  <div>{Number(s.speedMs).toFixed(1)} m/s</div>
                )}
                <div>From {Math.round(s.directionFromDeg)}° (meteorological)</div>
                <div className="mt-1 opacity-70">
                  {s.source === 'owm' ? 'OpenWeatherMap' : 'Open-Meteo'}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
