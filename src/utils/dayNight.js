/**
 * Day/night from the weather **location** (Open-Meteo timezone / offset / is_day),
 * not the viewer’s device clock alone.
 */

/** Parse Open-Meteo local sunrise/sunset (no Z) using the response’s UTC offset. */
export function meteoLocalIsoToUnix(iso, utcOffsetSeconds) {
  if (!iso || typeof iso !== 'string') return null;
  const trimmed = iso.trim();
  if (/[Zz]$/.test(trimmed) || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    const ms = Date.parse(trimmed);
    return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
  }
  if (typeof utcOffsetSeconds !== 'number') {
    const ms = Date.parse(trimmed);
    return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
  }
  const base = trimmed.replace(/\.\d+$/u, '');
  const sign = utcOffsetSeconds >= 0 ? '+' : '-';
  const abs = Math.abs(utcOffsetSeconds);
  const oh = Math.floor(abs / 3600);
  const om = Math.floor((abs % 3600) / 60);
  const pad = (n) => String(n).padStart(2, '0');
  const withTz = `${base}${sign}${pad(oh)}:${pad(om)}`;
  const ms = Date.parse(withTz);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

/** Current hour (0–23) at the weather location. */
export function hourAtLocation(weatherLike) {
  const tz = weatherLike?.timezone;
  if (tz) {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        hour: 'numeric',
        hour12: false,
      }).formatToParts(new Date());
      const h = parts.find((p) => p.type === 'hour')?.value;
      if (h != null) return parseInt(h, 10);
    } catch {
      /* invalid tz */
    }
  }
  const off = weatherLike?.utc_offset_seconds;
  if (typeof off === 'number') {
    const d = new Date();
    const utcMin = d.getUTCHours() * 60 + d.getUTCMinutes();
    const locMin = utcMin + Math.round(off / 60);
    const norm = ((locMin % (24 * 60)) + (24 * 60)) % (24 * 60);
    return Math.floor(norm / 60);
  }
  return new Date().getHours();
}

function calendarDateKeyAtLocation(unixSec, weatherLike) {
  const tz = weatherLike?.timezone;
  if (tz) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(unixSec * 1000));
    } catch {
      /* fall through */
    }
  }
  const off = weatherLike?.utc_offset_seconds;
  if (typeof off === 'number') {
    const ms = unixSec * 1000 + off * 1000;
    const u = new Date(ms);
    const y = u.getUTCFullYear();
    const m = String(u.getUTCMonth() + 1).padStart(2, '0');
    const day = String(u.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const d = new Date(unixSec * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * True when the location is in night (moon icons for clear / partly cloudy).
 */
export function computeIsNight(detailsData) {
  if (detailsData?.is_day === 0) return true;
  if (detailsData?.is_day === 1) return false;

  const now = Math.floor(Date.now() / 1000);
  const sunrise = detailsData?.sys?.sunrise;
  const sunset = detailsData?.sys?.sunset;
  if (sunrise != null && sunset != null && sunrise < sunset) {
    return now < sunrise || now > sunset;
  }

  const h = hourAtLocation(detailsData);
  return h < 6 || h >= 20;
}

/**
 * For a daily forecast row: moon only if that row is **today** at the location and it’s night there.
 */
export function isNightForForecastDayIcon(forecastItemDtSec, locationWeather) {
  if (!locationWeather) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  const todayKey = calendarDateKeyAtLocation(nowSec, locationWeather);
  const itemKey = calendarDateKeyAtLocation(forecastItemDtSec, locationWeather);
  if (itemKey !== todayKey) return false;
  return computeIsNight(locationWeather);
}
