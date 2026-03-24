import { useEffect, useState, useCallback, useRef, Fragment } from 'react';
import { Pane, Polyline, CircleMarker, Popup } from 'react-leaflet';
import { fetchOpenTropicalCycloneTracks, trackDisplayStyle } from '../utils/cycloneService';

const REFRESH_MS = 20 * 60 * 1000;

function formatWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

/**
 * Polylines (past track) + latest fix (popup) for NASA EONET tropical cyclones.
 */
export default function CycloneTracksLayer({ active, mapOpen, onStatus }) {
  const [tracks, setTracks] = useState([]);
  const [fetchedAt, setFetchedAt] = useState(null);
  const abortRef = useRef(null);
  const timerRef = useRef(null);
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  const load = useCallback(async () => {
    if (!active || !mapOpen) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    onStatusRef.current?.({ loading: true, error: null });
    try {
      const { tracks: next, fetchedAt: at } = await fetchOpenTropicalCycloneTracks(ac.signal);
      if (ac.signal.aborted) return;
      setTracks(next);
      setFetchedAt(at);
      onStatusRef.current?.({ loading: false, error: null, count: next.length, fetchedAt: at });
    } catch (e) {
      if (e?.name === 'AbortError') return;
      setTracks([]);
      setFetchedAt(null);
      onStatusRef.current?.({
        loading: false,
        error: e?.message || 'Could not load cyclone data',
        count: 0,
        fetchedAt: null,
      });
    }
  }, [active, mapOpen]);

  useEffect(() => {
    if (!active || !mapOpen) {
      setTracks([]);
      setFetchedAt(null);
      onStatusRef.current?.({ loading: false, error: null, count: 0, fetchedAt: null });
      return undefined;
    }
    load();
    timerRef.current = window.setInterval(load, REFRESH_MS);
    return () => {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
      abortRef.current?.abort();
    };
  }, [active, mapOpen, load]);

  if (!active || !mapOpen || tracks.length === 0) return null;

  return (
    <Pane name="cyclonePane" style={{ zIndex: 650 }}>
      {tracks.map((track) => {
        const positions = track.points.map((pt) => [pt.lat, pt.lng]);
        const latest = track.points[track.points.length - 1];
        const { line, fill } = trackDisplayStyle(track.eventId);
        const wind =
          latest.windKts != null ? `${Math.round(latest.windKts)} kt` : 'Wind n/a';

        return (
          <Fragment key={track.eventId}>
            {positions.length >= 2 && (
              <Polyline
                pathOptions={{
                  color: line,
                  weight: 3,
                  opacity: 0.88,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
                positions={positions}
              />
            )}
            <CircleMarker
              center={[latest.lat, latest.lng]}
              radius={9}
              pathOptions={{
                color: line,
                fillColor: fill,
                fillOpacity: 0.95,
                weight: 2,
              }}
            >
              <Popup className="cyclone-popup">
                <div className="min-w-[200px] text-slate-900">
                  <p className="text-base font-bold leading-tight">🌀 {track.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">{wind}</span>
                    {latest.date && (
                      <span className="block text-xs text-slate-500">Fix: {formatWhen(latest.date)}</span>
                    )}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Track: {track.points.length} position{track.points.length === 1 ? '' : 's'} · NASA EONET
                  </p>
                  {fetchedAt && (
                    <p className="text-[10px] text-slate-400">Layer updated {formatWhen(fetchedAt)}</p>
                  )}
                  {track.sourceUrl && (
                    <a
                      href={track.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-semibold text-violet-700 underline"
                    >
                      Advisory / source →
                    </a>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          </Fragment>
        );
      })}
    </Pane>
  );
}
