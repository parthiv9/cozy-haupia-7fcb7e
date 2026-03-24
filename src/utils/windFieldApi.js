/**
 * Wind samples for map flow — Open-Meteo (browser).
 */

const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';

/**
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{ u: number, v: number }>}
 */
export async function fetchWindSampleOpenMeteo(lat, lng) {
  const q = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'wind_speed_10m,wind_direction_10m',
    timezone: 'auto',
  });
  const url = `${OPEN_METEO_FORECAST}?${q.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Wind sample failed');
  const data = await res.json();
  const c = data.current;
  const speedKmh = Number(c?.wind_speed_10m);
  const degFrom = Number(c?.wind_direction_10m);
  if (!Number.isFinite(speedKmh) || !Number.isFinite(degFrom)) {
    return { u: 0, v: 0 };
  }
  const speedMs = speedKmh / 3.6;
  const towardRad = (((degFrom + 180) % 360) * Math.PI) / 180;
  return {
    u: Math.sin(towardRad) * speedMs,
    v: Math.cos(towardRad) * speedMs,
  };
}

/**
 * @param {{ getSouth: () => number, getWest: () => number, getNorth: () => number, getEast: () => number }} bounds
 * @returns {Promise<WindField | null>}
 */
export async function fetchWindFieldGrid(bounds) {
  const south = bounds.getSouth();
  const west = bounds.getWest();
  const north = bounds.getNorth();
  const east = bounds.getEast();
  const latSpan = north - south;
  const lngSpan = east - west;
  if (!Number.isFinite(latSpan) || !Number.isFinite(lngSpan) || latSpan <= 0 || lngSpan <= 0) {
    return null;
  }

  let cols = 7;
  let rows = 6;
  if (latSpan > 42 || lngSpan > 85) {
    cols = 5;
    rows = 5;
  }
  if (latSpan > 70 || lngSpan > 140) {
    cols = 4;
    rows = 4;
  }

  const points = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const fy = (i + 0.5) / rows;
      const fx = (j + 0.5) / cols;
      const lat = north - fy * latSpan;
      const lng = west + fx * lngSpan;
      points.push({ lat, lng, i, j });
    }
  }

  const concurrency = 6;
  const results = new Array(points.length);
  for (let offset = 0; offset < points.length; offset += concurrency) {
    const slice = points.slice(offset, offset + concurrency);
    const chunk = await Promise.all(
      slice.map((p) => fetchWindSampleOpenMeteo(p.lat, p.lng).catch(() => ({ u: 0, v: 0 })))
    );
    chunk.forEach((uv, k) => {
      results[offset + k] = uv;
    });
  }

  const u = new Float32Array(rows * cols);
  const v = new Float32Array(rows * cols);
  for (let k = 0; k < points.length; k++) {
    const p = points[k];
    const r = results[k] || { u: 0, v: 0 };
    u[p.i * cols + p.j] = r.u;
    v[p.i * cols + p.j] = r.v;
  }

  return { south, west, north, east, cols, rows, u, v };
}

/**
 * @typedef {{
 *   south: number,
 *   west: number,
 *   north: number,
 *   east: number,
 *   cols: number,
 *   rows: number,
 *   u: Float32Array,
 *   v: Float32Array,
 * }} WindField
 */

/**
 * @param {WindField | null} field
 * @param {number} lat
 * @param {number} lng
 */
export function interpolateWindUV(field, lat, lng) {
  if (!field) return { u: 0, v: 0 };
  const { south, west, north, east, cols, rows, u, v } = field;
  const clampLat = Math.max(south, Math.min(north, lat));
  const clampLng = Math.max(west, Math.min(east, lng));
  const x = ((clampLng - west) / (east - west)) * (cols - 1);
  const y = ((north - clampLat) / (north - south)) * (rows - 1);
  const x0 = Math.floor(x);
  const x1 = Math.min(cols - 1, x0 + 1);
  const y0 = Math.floor(y);
  const y1 = Math.min(rows - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const idx = (yy, xx) => yy * cols + xx;
  const u00 = u[idx(y0, x0)];
  const u10 = u[idx(y0, x1)];
  const u01 = u[idx(y1, x0)];
  const u11 = u[idx(y1, x1)];
  const v00 = v[idx(y0, x0)];
  const v10 = v[idx(y0, x1)];
  const v01 = v[idx(y1, x0)];
  const v11 = v[idx(y1, x1)];
  const ui =
    u00 * (1 - tx) * (1 - ty) + u10 * tx * (1 - ty) + u01 * (1 - tx) * ty + u11 * tx * ty;
  const vi =
    v00 * (1 - tx) * (1 - ty) + v10 * tx * (1 - ty) + v01 * (1 - tx) * ty + v11 * tx * ty;
  return { u: ui, v: vi };
}
