/**
 * Active tropical cyclone / hurricane / typhoon data via NASA EONET (Severe Storms).
 * Browser-safe, no API key. Geometry includes JTWC-style wind (kts) and forecast track points.
 *
 * @see https://eonet.gsfc.nasa.gov/docs/v3
 */

const EONET_EVENTS =
  'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=30&category=severeStorms&limit=80';

/** Exclude non-tropical severe weather; include tropical systems only. */
const EXCLUDE_TITLE =
  /tornado|severe thunderstorm|hail|lightning|winter storm|blizzard|ice storm|derecho|squall line/i;

const INCLUDE_TITLE =
  /tropical\s+cyclone|tropical\s+storm|tropical\s+depression|hurricane|typhoon|super\s+typhoon|subtropical|\bcyclone\b/i;

/** @typedef {{ lat: number, lng: number, date: string | null, windKts: number | null }} CycloneTrackPoint */

/**
 * @typedef {{
 *   id: string;
 *   title: string;
 *   name: string;
 *   lat: number;
 *   lng: number;
 *   windKts: number | null;
 *   intensityLabel: string;
 *   status: string;
 *   sourceLabel: string;
 *   detailUrl: string | null;
 *   track: CycloneTrackPoint[];
 *   movementDeg: number | null;
 * }} ActiveCyclone
 */

/**
 * @param {string | null | undefined} title
 * @returns {boolean}
 */
export function isActiveTropicalCycloneEvent(title) {
  if (!title || typeof title !== 'string') return false;
  if (EXCLUDE_TITLE.test(title)) return false;
  return INCLUDE_TITLE.test(title);
}

/**
 * Rough Saffir–Simpson-style label from 1-min sustained wind (knots).
 * @param {number | null | undefined} kts
 * @returns {string}
 */
export function intensityLabelFromKts(kts) {
  if (kts == null || !Number.isFinite(Number(kts))) return '—';
  const k = Number(kts);
  if (k < 34) return 'Tropical depression';
  if (k < 64) return 'Tropical storm';
  if (k < 83) return 'Cat 1 hurricane';
  if (k < 96) return 'Cat 2 hurricane';
  if (k < 113) return 'Cat 3 hurricane';
  if (k < 137) return 'Cat 4 hurricane';
  return 'Cat 5 hurricane';
}

/**
 * @param {string} title
 */
function extractStormName(title) {
  const m = title.match(
    /(?:Tropical\s+Cyclone|Tropical\s+Storm|Tropical\s+Depression|Hurricane|Typhoon|Super\s+Typhoon|Subtropical|Cyclone)\s+([A-Za-z][A-Za-z0-9\-]+)/i
  );
  return m ? m[1] : title;
}

/**
 * Bearing 0–360 from point a → b (for movement hint).
 * @param {{ lat: number, lng: number }} a
 * @param {{ lat: number, lng: number }} b
 * @returns {number | null}
 */
function bearingDeg(a, b) {
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  const deg = ((θ * 180) / Math.PI + 360) % 360;
  return Number.isFinite(deg) ? deg : null;
}

/**
 * @param {unknown} geometry
 * @returns {{ track: CycloneTrackPoint[], latest: CycloneTrackPoint } | null}
 */
function parseGeometryTrack(geometry) {
  if (!Array.isArray(geometry)) return null;
  const raw = geometry
    .filter((g) => g?.type === 'Point' && Array.isArray(g.coordinates) && g.coordinates.length >= 2)
    .map((g) => {
      const lng = Number(g.coordinates[0]);
      const lat = Number(g.coordinates[1]);
      const windKts = g.magnitudeValue != null ? Number(g.magnitudeValue) : null;
      return {
        lat,
        lng,
        date: g.date ? String(g.date) : null,
        windKts: Number.isFinite(windKts) ? windKts : null,
      };
    })
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  if (raw.length === 0) return null;

  raw.sort((a, b) => {
    const ta = a.date ? Date.parse(a.date) : 0;
    const tb = b.date ? Date.parse(b.date) : 0;
    return ta - tb;
  });

  const latest = raw[raw.length - 1];
  return { track: raw, latest };
}

/**
 * @param {unknown} event
 * @returns {ActiveCyclone | null}
 */
function mapEonetEventToCyclone(event) {
  if (!event || typeof event !== 'object') return null;
  const title = event.title != null ? String(event.title) : '';
  if (!isActiveTropicalCycloneEvent(title)) return null;

  const parsed = parseGeometryTrack(event.geometry);
  if (!parsed) return null;

  const { track, latest } = parsed;
  let movementDeg = null;
  if (track.length >= 2) {
    movementDeg = bearingDeg(track[track.length - 2], track[track.length - 1]);
  }

  const sources = Array.isArray(event.sources) ? event.sources : [];
  const firstSrc = sources[0];
  const sourceLabel =
    firstSrc && typeof firstSrc === 'object' && firstSrc.id ? String(firstSrc.id) : 'EONET';

  const detailUrl =
    firstSrc && typeof firstSrc === 'object' && firstSrc.url && String(firstSrc.url).startsWith('http')
      ? String(firstSrc.url)
      : event.link && String(event.link).startsWith('http')
        ? String(event.link)
        : null;

  const id = event.id != null ? String(event.id) : `${latest.lat}-${latest.lng}-${title}`;

  return {
    id,
    title,
    name: extractStormName(title),
    lat: latest.lat,
    lng: latest.lng,
    windKts: latest.windKts,
    intensityLabel: intensityLabelFromKts(latest.windKts),
    status: event.closed ? 'Closed' : 'Active',
    sourceLabel,
    detailUrl,
    track,
    movementDeg,
  };
}

/**
 * Fetch open severe-storm events and return only active tropical cyclone–class systems.
 * @param {{ maxStorms?: number }} opts
 * @returns {Promise<{ cyclones: ActiveCyclone[], error: string | null }>}
 */
export async function fetchActiveCyclones(opts = {}) {
  const maxStorms = opts.maxStorms ?? 15;
  try {
    const res = await fetch(EONET_EVENTS);
    if (!res.ok) {
      return { cyclones: [], error: `Cyclone data unavailable (HTTP ${res.status}).` };
    }
    const data = await res.json();
    const events = Array.isArray(data?.events) ? data.events : [];
    const cyclones = [];
    for (const ev of events) {
      const c = mapEonetEventToCyclone(ev);
      if (c && c.status === 'Active') cyclones.push(c);
    }
    /** Prefer stronger systems first, then more track points */
    cyclones.sort((a, b) => {
      const wa = a.windKts ?? -1;
      const wb = b.windKts ?? -1;
      if (wb !== wa) return wb - wa;
      return b.track.length - a.track.length;
    });
    return { cyclones: cyclones.slice(0, maxStorms), error: null };
  } catch {
    return { cyclones: [], error: 'Could not load cyclone data.' };
  }
}
