/**
 * Tropical cyclone positions & tracks from NASA EONET (Severe Storms → JTWC / NHC sources).
 * @see https://eonet.gsfc.nasa.gov/
 */

const EONET_SEVERE_GEOJSON =
  'https://eonet.gsfc.nasa.gov/api/v3/events/geojson?category=severeStorms&days=90&status=open';

/** Titles that look like tropical systems (exclude tornado-only etc.). */
export function isTropicalCycloneTitle(title) {
  if (!title || typeof title !== 'string') return false;
  const t = title.toLowerCase();
  if (/\btornado\b|\bhail\b|\bsevere thunderstorm\b/i.test(t)) return false;
  return (
    /\bhurricane\b|\btyphoon\b|\bsuper typhoon\b|\btropical (depression|storm|cyclone)\b|\bsubtropical\b/i.test(t) ||
    /\btropical cyclone\b/i.test(t) ||
    (/\bcyclone\b/i.test(t) && !/\bextratropical\b/i.test(t))
  );
}

/**
 * @param {import('geojson').Feature[]} features
 * @returns {Array<{ eventId: string, title: string, points: Array<{ lat: number, lng: number, date: string, windKts: number | null, link: string | null }>, sourceUrl: string | null }>}
 */
export function buildCycloneTracksFromEonetFeatures(features) {
  if (!Array.isArray(features)) return [];

  const byId = new Map();

  for (const f of features) {
    if (!f || f.type !== 'Feature' || !f.geometry || f.geometry.type !== 'Point') continue;
    const p = f.properties || {};
    const title = p.title || '';
    if (!isTropicalCycloneTitle(title)) continue;

    const eventId = p.id;
    if (!eventId) continue;

    const [lng, lat] = f.geometry.coordinates;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const date = p.date || '';
    const windKts =
      typeof p.magnitudeValue === 'number' && Number.isFinite(p.magnitudeValue) ? p.magnitudeValue : null;
    const link = typeof p.link === 'string' ? p.link : null;
    const sources = Array.isArray(p.sources) ? p.sources : [];
    const sourceUrl = sources[0]?.url && typeof sources[0].url === 'string' ? sources[0].url : null;

    if (!byId.has(eventId)) {
      byId.set(eventId, { eventId, title, points: [], sourceUrl });
    }
    const row = byId.get(eventId);
    if (sourceUrl && !row.sourceUrl) row.sourceUrl = sourceUrl;
    row.points.push({ lat, lng, date, windKts, link });
  }

  const tracks = [];
  for (const row of byId.values()) {
    row.points.sort((a, b) => {
      const ta = Date.parse(a.date) || 0;
      const tb = Date.parse(b.date) || 0;
      return ta - tb;
    });
    if (row.points.length === 0) continue;
    tracks.push(row);
  }

  tracks.sort((a, b) => a.title.localeCompare(b.title));
  return tracks;
}

function hueFromString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 280;
}

export function trackDisplayStyle(eventId) {
  const hue = hueFromString(eventId);
  return {
    line: `hsl(${hue} 82% 42%)`,
    fill: `hsl(${hue} 85% 50%)`,
  };
}

export async function fetchOpenTropicalCycloneTracks(signal) {
  const res = await fetch(EONET_SEVERE_GEOJSON, {
    signal,
    headers: { Accept: 'application/geo+json, application/json' },
  });
  if (!res.ok) throw new Error(`EONET ${res.status}`);
  const data = await res.json();
  const features = data?.features || [];
  const tracks = buildCycloneTracksFromEonetFeatures(features);
  return { tracks, fetchedAt: new Date().toISOString() };
}
