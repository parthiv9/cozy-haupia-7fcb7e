import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { fetchActiveCyclones } from '../utils/cycloneData';

const REFRESH_MS = 6 * 60 * 1000;

function windDisplay(kts) {
  if (kts == null || !Number.isFinite(Number(kts))) return '—';
  const k = Number(kts);
  const kmh = k * 1.852;
  return `${Math.round(k)} kt · ${kmh.toFixed(0)} km/h`;
}

function cardinalFromDeg(deg) {
  if (deg == null || !Number.isFinite(deg)) return null;
  const d = ((deg % 360) + 360) % 360;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(d / 45) % 8];
}

/**
 * DivIcon: red/orange ring + animated cyclone marker (Lucide tornado paths as inline SVG).
 * @param {number} windKts
 */
function createCycloneDivIcon(windKts) {
  const strong = windKts != null && Number(windKts) >= 64;
  const ring = strong ? 'rgba(220,38,38,0.95)' : 'rgba(234,88,12,0.95)';
  const glow = strong ? 'rgba(248,113,113,0.55)' : 'rgba(251,146,60,0.5)';
  const cycloneGlyph = `<span class="skycast-cyclone-emoji" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="skycast-cyclone-glyph"><path d="M21 4H3"/><path d="M18 8H6"/><path d="M19 12H9"/><path d="M16 16h-6"/><path d="M11 20H9"/></svg></span>`;
  return L.divIcon({
    className: 'skycast-cyclone-divicon',
    html: `<div class="skycast-cyclone-pin" style="--cyclone-ring:${ring};--cyclone-glow:${glow}">${cycloneGlyph}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -18],
  });
}

/** Markers + polylines (one component per storm so hooks stay valid). */
function CycloneMarkersInner({ cyclones, showTracks }) {
  return (
    <>
      {cyclones.map((c) => (
        <CycloneMarkerItem key={c.id} cyclone={c} showTracks={showTracks} />
      ))}
    </>
  );
}

function CycloneMarkerItem({ cyclone: c, showTracks }) {
  const icon = useMemo(() => createCycloneDivIcon(c.windKts), [c.windKts]);
  const positions =
    showTracks && c.track.length > 1 ? c.track.map((p) => [p.lat, p.lng]) : null;
  const moveCardinal = cardinalFromDeg(c.movementDeg);

  return (
    <>
      {positions ? (
        <Polyline
          positions={positions}
          pathOptions={{
            color: '#ea580c',
            weight: 2,
            opacity: 0.72,
            dashArray: '6 8',
          }}
        />
      ) : null}
      <Marker position={[c.lat, c.lng]} icon={icon} zIndexOffset={900}>
        <Popup>
          <div className="min-w-[200px] max-w-[260px] text-slate-900">
            <p className="text-[10px] font-bold uppercase tracking-wide text-orange-700">Cyclone</p>
            <p className="mt-0.5 text-base font-bold leading-tight">{c.name}</p>
            <p className="text-[11px] text-slate-500">{c.title}</p>
            <dl className="mt-2 space-y-1.5 border-t border-slate-200/90 pt-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Wind speed</dt>
                <dd className="font-semibold text-right">{windDisplay(c.windKts)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Intensity</dt>
                <dd className="text-right font-medium">{c.intensityLabel}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Location</dt>
                <dd className="font-mono text-xs text-right">
                  {c.lat.toFixed(2)}°, {c.lng.toFixed(2)}°
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-semibold text-emerald-700">{c.status}</dd>
              </div>
              {moveCardinal != null && c.movementDeg != null ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Movement</dt>
                  <dd className="text-right text-xs">
                    ~{moveCardinal} ({Math.round(c.movementDeg)}°)
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Source</dt>
                <dd className="text-right text-xs text-slate-600">{c.sourceLabel}</dd>
              </div>
            </dl>
            {c.detailUrl ? (
              <a
                href={c.detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-semibold text-sky-600 hover:underline"
              >
                Open advisory →
              </a>
            ) : null}
          </div>
        </Popup>
      </Marker>
    </>
  );
}

/**
 * Tropical cyclone markers + optional forecast track (NASA EONET / JTWC).
 * @param {{ enabled?: boolean, mapOpen?: boolean, showTracks?: boolean }} props
 */
export default function CycloneLayer({ enabled = true, mapOpen = true, showTracks = true }) {
  const map = useMap();
  const [cyclones, setCyclones] = useState([]);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || !mapOpen) return;
    const { cyclones: list, error: err } = await fetchActiveCyclones({ maxStorms: 15 });
    setLoaded(true);
    setError(err);
    setCyclones(list);
  }, [enabled, mapOpen]);

  useEffect(() => {
    if (!enabled || !mapOpen) {
      setCyclones([]);
      setLoaded(false);
      setError(null);
      return undefined;
    }
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [enabled, mapOpen, load]);

  /** Invalidate size when marker set changes (popup/layout) */
  useEffect(() => {
    if (!mapOpen || !enabled) return;
    const t = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(t);
  }, [cyclones.length, enabled, map, mapOpen]);

  const emptyMessage = loaded && !error && cyclones.length === 0;
  const mapEl = typeof document !== 'undefined' ? map?.getContainer?.() ?? null : null;

  return (
    <>
      <CycloneMarkersInner cyclones={cyclones} showTracks={showTracks} />
      {enabled && mapOpen && (loaded || error) && mapEl
        ? createPortal(
            <div className="skycast-cyclone-hud pointer-events-none max-w-[min(100%,280px)] rounded-lg border border-orange-200/90 bg-white/95 px-3 py-2 text-xs shadow-md backdrop-blur-sm">
              {error ? <p className="font-medium text-red-700">{error}</p> : null}
              {emptyMessage ? (
                <p className="font-medium text-slate-900/80">No active cyclones currently</p>
              ) : null}
              {!error && cyclones.length > 0 ? (
                <p className="text-[10px] text-slate-900/55">
                  {cyclones.length} active system{cyclones.length === 1 ? '' : 's'} · NASA EONET / JTWC
                </p>
              ) : null}
            </div>,
            mapEl
          )
        : null}
    </>
  );
}
