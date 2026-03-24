import { meteoLocalIsoToUnix } from './dayNight.js';

/**
 * SkyCast Weather API — Open-Meteo (primary, no key) + optional OpenWeatherMap
 * Open-Meteo provides accurate live temperatures without any API key.
 * Google does not offer a public Weather API; Open-Meteo uses the same
 * type of weather models for reliable, up-to-date data.
 */

const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';
const OPENWEATHER_GEO = 'https://api.openweathermap.org/geo/1.0';
const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_GEO = 'https://geocoding-api.open-meteo.com/v1/search';

// WMO weather code → OpenWeatherMap icon (day) and description
const WMO_TO_OWM = {
  0: { icon: '01d', desc: 'Clear sky' },
  1: { icon: '02d', desc: 'Mainly clear' },
  2: { icon: '03d', desc: 'Partly cloudy' },
  3: { icon: '04d', desc: 'Overcast' },
  45: { icon: '50d', desc: 'Foggy' },
  48: { icon: '50d', desc: 'Depositing rime fog' },
  51: { icon: '09d', desc: 'Light drizzle' },
  53: { icon: '09d', desc: 'Drizzle' },
  55: { icon: '09d', desc: 'Dense drizzle' },
  56: { icon: '09d', desc: 'Light freezing drizzle' },
  57: { icon: '09d', desc: 'Freezing drizzle' },
  61: { icon: '10d', desc: 'Slight rain' },
  63: { icon: '10d', desc: 'Moderate rain' },
  65: { icon: '10d', desc: 'Heavy rain' },
  66: { icon: '13d', desc: 'Light freezing rain' },
  67: { icon: '13d', desc: 'Freezing rain' },
  71: { icon: '13d', desc: 'Slight snow' },
  73: { icon: '13d', desc: 'Snow' },
  75: { icon: '13d', desc: 'Heavy snow' },
  77: { icon: '13d', desc: 'Snow grains' },
  80: { icon: '09d', desc: 'Slight rain showers' },
  81: { icon: '09d', desc: 'Rain showers' },
  82: { icon: '09d', desc: 'Violent rain showers' },
  85: { icon: '13d', desc: 'Slight snow showers' },
  86: { icon: '13d', desc: 'Heavy snow showers' },
  95: { icon: '11d', desc: 'Thunderstorm' },
  96: { icon: '11d', desc: 'Thunderstorm with hail' },
  99: { icon: '11d', desc: 'Thunderstorm with heavy hail' },
};

/** OpenWeather-style `main` for WMO code (used by slug fallback + UI labels). */
function wmoToMain(wmoCode) {
  if (wmoCode === 0) return 'Clear';
  if (wmoCode === 1 || wmoCode === 2 || wmoCode === 3) return 'Clouds';
  if (wmoCode === 45 || wmoCode === 48) return 'Fog';
  if (wmoCode >= 51 && wmoCode <= 57) return 'Drizzle';
  if ((wmoCode >= 61 && wmoCode <= 67) || (wmoCode >= 80 && wmoCode <= 82)) return 'Rain';
  if ((wmoCode >= 71 && wmoCode <= 77) || (wmoCode >= 85 && wmoCode <= 86)) return 'Snow';
  if (wmoCode >= 95 && wmoCode <= 99) return 'Thunderstorm';
  return 'Clear';
}

function wmoToWeather(wmoCode) {
  const w = WMO_TO_OWM[wmoCode] || WMO_TO_OWM[0];
  return { id: wmoCode, main: wmoToMain(wmoCode), description: w.desc, icon: w.icon };
}

/** Normalize Open-Meteo current + daily to our app's weather object shape */
function normalizeOpenMeteoCurrent(data, placeName) {
  const c = data.current;
  const d = data.daily;
  const wmo = c.weather_code ?? 0;
  const weather = wmoToWeather(wmo);
  const off =
    typeof data.utc_offset_seconds === 'number' && Number.isFinite(data.utc_offset_seconds)
      ? data.utc_offset_seconds
      : null;
  const tzRaw = data.timezone;
  const timezone =
    typeof tzRaw === 'string' && tzRaw.length > 0 && tzRaw !== 'auto' ? tzRaw : null;

  const sunriseIso = d?.sunrise?.[0];
  const sunsetIso = d?.sunset?.[0];
  let sunrise = sunriseIso != null ? meteoLocalIsoToUnix(sunriseIso, off) : null;
  let sunset = sunsetIso != null ? meteoLocalIsoToUnix(sunsetIso, off) : null;
  if (sunrise == null && sunriseIso) {
    const ms = Date.parse(sunriseIso);
    if (!Number.isNaN(ms)) sunrise = Math.floor(ms / 1000);
  }
  if (sunset == null && sunsetIso) {
    const ms = Date.parse(sunsetIso);
    if (!Number.isNaN(ms)) sunset = Math.floor(ms / 1000);
  }

  const isDay = c.is_day;
  return {
    name: placeName,
    ...(isDay === 0 || isDay === 1 ? { is_day: isDay } : {}),
    ...(timezone ? { timezone } : {}),
    ...(off != null ? { utc_offset_seconds: off } : {}),
    coord: { lat: data.latitude, lon: data.longitude },
    main: {
      temp: c.temperature_2m,
      feels_like: c.apparent_temperature ?? c.temperature_2m,
      humidity: c.relative_humidity_2m ?? null,
      pressure: c.surface_pressure ?? null,
    },
    wind: {
      speed: (c.wind_speed_10m ?? 0) / 3.6,
      deg: c.wind_direction_10m ?? null,
    },
    weather: [weather],
    sys: { sunrise, sunset },
    visibility: c.visibility ?? null,
  };
}

/** Normalize Open-Meteo daily forecast to our list format */
function normalizeOpenMeteoForecast(data) {
  const d = data.daily;
  if (!d || !d.time?.length) return { list: [], city: { name: data.name || 'Unknown' } };
  const list = d.time.map((time, i) => {
    const dt = Math.floor(new Date(time).getTime() / 1000);
    const wmo = d.weather_code?.[i] ?? 0;
    const weather = wmoToWeather(wmo);
    const tMin = d.temperature_2m_min?.[i];
    const tMax = d.temperature_2m_max?.[i];
    const avg =
      tMin != null && tMax != null && Number.isFinite(tMin) && Number.isFinite(tMax)
        ? (tMin + tMax) / 2
        : tMax ?? tMin ?? null;
    return {
      dt,
      main: {
        temp: avg,
        temp_min: tMin ?? null,
        temp_max: tMax ?? null,
      },
      weather: [weather],
      pop: (d.precipitation_probability_max?.[i] ?? 0) / 100,
    };
  });
  const maxDays = 7;
  return { list: list.slice(0, maxDays), city: { name: data.name || 'Unknown' } };
}

// ——— Reverse geocoding (place name from coordinates) ———
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

/** Get place name from lat/lon using OpenStreetMap Nominatim (no API key). */
export async function getPlaceNameFromCoords(lat, lon) {
  try {
    const url = `${NOMINATIM_URL}?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'SkyCast-Weather-App' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county;
    const country = addr.country;
    if (city && country) return `${city}, ${country}`;
    if (country) return country;
    if (data.display_name) return data.display_name.split(',')[0].trim();
    return null;
  } catch {
    return null;
  }
}

// ——— Open-Meteo (primary, no API key) ———

export async function getWeatherByCoords(lat, lon) {
  const url = `${OPEN_METEO_FORECAST}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility,apparent_temperature,is_day&daily=sunrise,sunset,weather_code&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  const data = await res.json();
  const placeName = await getPlaceNameFromCoords(lat, lon);
  return normalizeOpenMeteoCurrent(data, placeName || 'Current Location');
}

export async function getWeatherByCity(cityName) {
  const geo = await geocodeOpenMeteo(cityName, 1);
  if (!geo?.length) throw new Error('City not found');
  const { lat, lon, name } = geo[0];
  const url = `${OPEN_METEO_FORECAST}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility,apparent_temperature,is_day&daily=sunrise,sunset,weather_code&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  const data = await res.json();
  const normalized = normalizeOpenMeteoCurrent(data, name);
  normalized.name = name;
  return normalized;
}

export async function getForecastByCoords(lat, lon) {
  const url = `${OPEN_METEO_FORECAST}?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=10&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Forecast fetch failed');
  const data = await res.json();
  return normalizeOpenMeteoForecast(data);
}

export async function getForecastByCity(cityName) {
  const geo = await geocodeOpenMeteo(cityName, 1);
  if (!geo?.length) throw new Error('City not found');
  const { lat, lon, name } = geo[0];
  const data = await getForecastByCoords(lat, lon);
  data.city = { name };
  return data;
}

async function geocodeOpenMeteo(query, count = 8) {
  const q = (query || '').trim();
  if (!q) return [];
  const url = `${OPEN_METEO_GEO}?name=${encodeURIComponent(q)}&count=${count}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  const results = json.results || [];
  return results.map((r) => ({
    name: r.name,
    lat: r.latitude,
    lon: r.longitude,
    country: r.country,
    country_code: r.country_code,
    admin1: r.admin1,
  }));
}

export async function getCitiesByCountry(countryName) {
  const geo = await geocodeOpenMeteo(countryName, 10);
  const inCountry = geo.filter(
    (g) => g.country?.toLowerCase().includes(countryName.toLowerCase()) ||
           (g.country_code?.toLowerCase() === countryName.toLowerCase())
  ).slice(0, 4);
  const fallback = geo.slice(0, 4);
  const list = inCountry.length ? inCountry : fallback;
  if (!list.length) return [];
  const results = await Promise.all(
    list.map((loc) => getWeatherByCoords(loc.lat, loc.lon).then((w) => ({ ...w, name: loc.name })))
  );
  return results;
}

/** Search suggestions: use Open-Meteo geocoding (no key required) */
export async function getSearchSuggestions(query) {
  const q = (query || '').trim();
  if (q.length < 2) return [];
  try {
    const list = await geocodeOpenMeteo(q, 8);
    if (!list.length) return getStaticSuggestions(q);
    return list.map((item) => ({
      label: `${item.name}${item.admin1 ? `, ${item.admin1}` : ''}, ${item.country}`,
      value: item.name,
      country: item.country,
    }));
  } catch {
    return getStaticSuggestions(q);
  }
}

const POPULAR_LOCATIONS = [
  'London', 'Tokyo', 'New York', 'Paris', 'Sydney', 'Mumbai', 'Delhi', 'Bangalore',
  'India', 'Canada', 'USA', 'UK', 'Australia', 'Germany', 'Japan', 'Dubai',
  'Singapore', 'Berlin', 'Toronto', 'Vancouver', 'Chicago', 'Los Angeles',
  'Hyderabad', 'Chennai', 'Kolkata', 'Rajkot', 'Ahmedabad',
];

function getStaticSuggestions(q) {
  const lower = q.toLowerCase();
  return POPULAR_LOCATIONS.filter(
    (loc) => loc.toLowerCase().includes(lower) || lower.includes(loc.toLowerCase())
  ).slice(0, 8).map((label) => ({ label, value: label, country: '' }));
}

export function getWeatherIconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

/** WMO weather codes (Open-Meteo): 0–99 */
function slugFromWmoId(id) {
  if (id == null || typeof id !== 'number' || !Number.isFinite(id)) return null;
  if (id < 0 || id > 99) return null;
  if (id === 0) return 'clear';
  if (id === 1 || id === 2) return 'partly-cloudy';
  if (id === 3) return 'cloudy';
  if (id === 45 || id === 48) return 'fog';
  if (id >= 51 && id <= 57) return 'drizzle';
  if ((id >= 61 && id <= 67) || (id >= 80 && id <= 82)) return 'rain';
  if ((id >= 71 && id <= 77) || (id >= 85 && id <= 86)) return 'snow';
  if (id >= 95 && id <= 99) return 'thunderstorm';
  return 'default';
}

/** OpenWeatherMap condition codes (200–804) */
function slugFromOwmId(id) {
  if (id == null || typeof id !== 'number' || !Number.isFinite(id)) return null;
  if (id >= 200 && id < 300) return 'thunderstorm';
  if (id >= 300 && id < 400) return 'drizzle';
  if (id >= 500 && id < 600) return 'rain';
  if (id >= 600 && id < 700) return 'snow';
  if (id >= 700 && id < 800) return 'fog';
  if (id === 800) return 'clear';
  if (id === 801 || id === 802) return 'partly-cloudy';
  if (id === 803 || id === 804) return 'cloudy';
  return null;
}

/** When only `main` / `description` exist (e.g. OpenWeather JSON). */
function slugFromMainAndDescription(main, description) {
  const m = (main || '').toLowerCase().trim();
  const d = (description || '').toLowerCase();
  if (m === 'clear') return 'clear';
  if (m === 'clouds') {
    if (/\b(overcast|broken)\b/i.test(description || '')) return 'cloudy';
    if (/\b(few|scattered|partly)\b/i.test(description || '')) return 'partly-cloudy';
    return 'cloudy';
  }
  if (m === 'rain') return 'rain';
  if (m === 'drizzle') return 'drizzle';
  if (m === 'thunderstorm') return 'thunderstorm';
  if (m === 'snow') return 'snow';
  if (
    m === 'mist' ||
    m === 'fog' ||
    m === 'haze' ||
    m === 'smoke' ||
    m === 'dust' ||
    m === 'sand' ||
    m === 'ash' ||
    m === 'squall' ||
    m === 'tornado'
  ) {
    return 'fog';
  }
  if (d.includes('thunder')) return 'thunderstorm';
  if (d.includes('drizzle')) return 'drizzle';
  if (d.includes('rain') || d.includes('shower')) return 'rain';
  if (d.includes('snow') || d.includes('sleet')) return 'snow';
  if (d.includes('cloud')) {
    if (d.includes('partly') || d.includes('few') || d.includes('scattered')) return 'partly-cloudy';
    return 'cloudy';
  }
  return null;
}

/**
 * Background slug from API `weather[0]`: WMO id (Open-Meteo), OWM id, or `main` / `description`.
 * Updates whenever the parent passes new weather data (React re-render).
 */
export function getWeatherBackgroundSlug(weather) {
  if (weather == null) return 'default';

  if (typeof weather === 'number') {
    return slugFromWmoId(weather) ?? slugFromOwmId(weather) ?? 'default';
  }

  const id = weather.id;
  const main = weather.main;
  const description = weather.description;

  let slug = null;
  if (typeof id === 'number' && Number.isFinite(id)) {
    slug = slugFromWmoId(id);
    if (slug == null && id > 99) slug = slugFromOwmId(id);
  }

  if (slug == null && typeof main === 'string') {
    slug = slugFromMainAndDescription(main, description);
  }

  return slug ?? 'default';
}

/** Visual mood key for gradient wash (.weather-bg-mood--*). */
export function getWeatherMoodKey(slug) {
  if (slug === 'rain' || slug === 'thunderstorm') return 'rainy';
  if (slug === 'cloudy' || slug === 'fog' || slug === 'snow' || slug === 'drizzle') return 'cloudy';
  if (slug === 'clear' || slug === 'partly-cloudy') return 'sunny';
  return 'neutral';
}

/**
 * Semantic root class: Clear → weather-bg-sunny, Clouds → weather-bg-cloudy, Rain → weather-bg-rainy.
 */
export function getWeatherMoodClass(slug) {
  const key = getWeatherMoodKey(slug);
  if (key === 'rainy') return 'weather-bg-rainy';
  if (key === 'cloudy') return 'weather-bg-cloudy';
  if (key === 'sunny') return 'weather-bg-sunny';
  return 'weather-bg-neutral';
}
