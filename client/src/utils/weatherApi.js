/**
 * SkyCast Ultra — OpenWeatherMap when VITE_OPENWEATHER_API_KEY is set;
 * otherwise Open-Meteo (no key). All entry points share the same normalized shape.
 */

import { getOpenWeatherApiKey } from '../config/env.js';
import { getAppConfig } from '../config/loadConfig.js';

const cfg = () => getAppConfig();
const owmKey = () => getOpenWeatherApiKey();

const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_GEO = 'https://geocoding-api.open-meteo.com/v1/search';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

export function useOpenWeather() {
  return owmKey().length > 0;
}

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

function wmoToWeather(wmoCode) {
  const w = WMO_TO_OWM[wmoCode] || WMO_TO_OWM[0];
  return { id: wmoCode, main: 'Clear', description: w.desc, icon: w.icon };
}

function normalizeOpenMeteoCurrent(data, placeName) {
  const c = data.current;
  const d = data.daily;
  const wmo = c.weather_code ?? 0;
  const weather = wmoToWeather(wmo);
  const sunrise = d?.sunrise?.[0] ? Math.floor(new Date(d.sunrise[0]).getTime() / 1000) : null;
  const sunset = d?.sunset?.[0] ? Math.floor(new Date(d.sunset[0]).getTime() / 1000) : null;
  return {
    name: placeName,
    coord: { lat: data.latitude, lon: data.longitude },
    is_day: typeof c.is_day === 'number' ? c.is_day : null,
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
    _provider: 'open-meteo',
  };
}

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
      tMin != null && tMax != null ? (tMin + tMax) / 2 : tMax ?? tMin ?? null;
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
  return { list, city: { name: data.name || 'Unknown' } };
}

/** OWM current → app shape */
function normalizeOwmCurrent(data, nameOverride) {
  const w = data.weather?.[0];
  if (!w) throw new Error('Invalid OWM response');
  const dt = data.dt ?? Math.floor(Date.now() / 1000);
  const sunrise = data.sys?.sunrise ?? dt;
  const sunset = data.sys?.sunset ?? dt + 1;
  const isDay = dt >= sunrise && dt < sunset ? 1 : 0;
  return {
    name: nameOverride || data.name || 'Location',
    coord: { lat: data.coord.lat, lon: data.coord.lon },
    is_day: isDay,
    main: {
      temp: data.main.temp,
      feels_like: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
    },
    wind: { speed: data.wind?.speed ?? 0, deg: data.wind?.deg ?? null },
    weather: [{ id: w.id, main: w.main, description: w.description, icon: w.icon }],
    sys: { sunrise, sunset },
    visibility: data.visibility ?? null,
    _provider: 'owm',
  };
}

/** OWM 5d/3h → daily buckets with min/max from all slots that day */
function normalizeOwmForecast(data) {
  const listRaw = data.list || [];
  const byDay = new Map();
  for (const item of listRaw) {
    const dayKey = new Date(item.dt * 1000).toDateString();
    if (!byDay.has(dayKey)) {
      byDay.set(dayKey, { slots: [], repDt: item.dt });
    }
    const bucket = byDay.get(dayKey);
    bucket.slots.push(item);
  }
  const list = Array.from(byDay.values())
    .slice(0, cfg().forecastDays || 7)
    .map(({ slots, repDt }) => {
      let minT = Infinity;
      let maxT = -Infinity;
      for (const item of slots) {
        const m = item.main || {};
        const lo = m.temp_min != null ? m.temp_min : m.temp;
        const hi = m.temp_max != null ? m.temp_max : m.temp;
        if (lo != null) minT = Math.min(minT, lo);
        if (hi != null) maxT = Math.max(maxT, hi);
      }
      if (!Number.isFinite(minT)) minT = slots[0]?.main?.temp ?? 0;
      if (!Number.isFinite(maxT)) maxT = slots[0]?.main?.temp ?? 0;
      const mid = slots[Math.floor(slots.length / 2)] || slots[0];
      const w = mid?.weather?.[0];
      const maxPop = Math.max(0, ...slots.map((s) => s.pop ?? 0));
      return {
        dt: repDt,
        main: {
          temp: (minT + maxT) / 2,
          temp_min: minT,
          temp_max: maxT,
        },
        weather: w
          ? [{ id: w.id, main: w.main, description: w.description, icon: w.icon }]
          : [{ id: 800, main: 'Clear', description: '—', icon: '01d' }],
        pop: maxPop,
      };
    });
  return { list, city: { name: data.city?.name || 'Unknown' } };
}

async function geocodeOwm(query) {
  const key = owmKey();
  const base = cfg()?.api?.openWeather?.geoDirectUrl || 'https://api.openweathermap.org/geo/1.0/direct';
  const url = `${base}?q=${encodeURIComponent(query)}&limit=8&appid=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return (Array.isArray(json) ? json : []).map((r) => ({
    name: r.name,
    lat: r.lat,
    lon: r.lon,
    country: r.country,
    country_code: r.country,
    admin1: r.state,
  }));
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

export async function getPlaceNameFromCoords(lat, lon) {
  try {
    const url = `${NOMINATIM_URL}?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'SkyCast-Ultra-Pro-Max/1.0' },
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

export async function getWeatherByCoords(lat, lon) {
  if (useOpenWeather()) {
    const key = owmKey();
    const base = cfg()?.api?.openWeather?.weatherUrl || 'https://api.openweathermap.org/data/2.5/weather';
    const url = `${base}?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(key)}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();
    const place = await getPlaceNameFromCoords(lat, lon);
    return normalizeOwmCurrent(data, place || data.name);
  }
  const url = `${OPEN_METEO_FORECAST}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility,apparent_temperature,is_day&daily=sunrise,sunset,weather_code&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  const data = await res.json();
  const placeName = await getPlaceNameFromCoords(lat, lon);
  return normalizeOpenMeteoCurrent(data, placeName || 'Current Location');
}

export async function getWeatherByCity(cityName) {
  if (useOpenWeather()) {
    const geo = await geocodeOwm(cityName);
    if (!geo?.length) throw new Error('City not found');
    const { lat, lon, name } = geo[0];
    const key = owmKey();
    const base = cfg()?.api?.openWeather?.weatherUrl || 'https://api.openweathermap.org/data/2.5/weather';
    const url = `${base}?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(key)}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();
    return normalizeOwmCurrent(data, name);
  }
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
  if (useOpenWeather()) {
    const key = owmKey();
    const base = cfg()?.api?.openWeather?.forecastUrl || 'https://api.openweathermap.org/data/2.5/forecast';
    const url = `${base}?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(key)}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Forecast fetch failed');
    const data = await res.json();
    return normalizeOwmForecast(data);
  }
  const url = `${OPEN_METEO_FORECAST}?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Forecast fetch failed');
  const data = await res.json();
  return normalizeOpenMeteoForecast(data);
}

export async function getForecastByCity(cityName) {
  if (useOpenWeather()) {
    const geo = await geocodeOwm(cityName);
    if (!geo?.length) throw new Error('City not found');
    const { lat, lon, name } = geo[0];
    const data = await getForecastByCoords(lat, lon);
    data.city = { name };
    return data;
  }
  const geo = await geocodeOpenMeteo(cityName, 1);
  if (!geo?.length) throw new Error('City not found');
  const { lat, lon, name } = geo[0];
  const data = await getForecastByCoords(lat, lon);
  data.city = { name };
  return data;
}

export async function getCitiesByCountry(countryName) {
  const geo = await geocodeOpenMeteo(countryName, 10);
  const inCountry = geo.filter(
    (g) =>
      g.country?.toLowerCase().includes(countryName.toLowerCase()) ||
      g.country_code?.toLowerCase() === countryName.toLowerCase()
  ).slice(0, 4);
  const fallback = geo.slice(0, 4);
  const list = inCountry.length ? inCountry : fallback;
  if (!list.length) return [];
  const results = await Promise.all(
    list.map((loc) => getWeatherByCoords(loc.lat, loc.lon).then((w) => ({ ...w, name: loc.name })))
  );
  return results;
}

const POPULAR_LOCATIONS = [
  'London', 'Tokyo', 'New York', 'Paris', 'Sydney', 'Mumbai', 'Delhi', 'Bangalore',
  'India', 'Canada', 'USA', 'UK', 'Australia', 'Germany', 'Japan', 'Dubai',
  'Singapore', 'Berlin', 'Toronto', 'Vancouver', 'Chicago', 'Los Angeles',
];

function getStaticSuggestions(q) {
  const lower = q.toLowerCase();
  return POPULAR_LOCATIONS.filter(
    (loc) => loc.toLowerCase().includes(lower) || lower.includes(loc.toLowerCase())
  )
    .slice(0, 8)
    .map((label) => ({ label, value: label, country: '' }));
}

export async function getSearchSuggestions(query) {
  const minChars = cfg()?.ui?.suggestionMinChars ?? 2;
  const q = (query || '').trim();
  if (q.length < minChars) return [];
  try {
    const list = useOpenWeather() ? await geocodeOwm(q) : await geocodeOpenMeteo(q, 8);
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

export function getWeatherIconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

/** OWM condition → background slug */
function owmWeatherToSlug(main, id) {
  const m = (main || '').toLowerCase();
  if (m === 'thunderstorm') return 'thunderstorm';
  if (m === 'drizzle') return 'drizzle';
  if (m === 'rain') return 'rain';
  if (m === 'snow') return 'snow';
  if (m === 'mist' || m === 'fog' || m === 'haze') return 'fog';
  if (m === 'clear') return 'clear';
  if (m === 'clouds') {
    if (id === 801 || id === 802) return 'partly-cloudy';
    return 'cloudy';
  }
  return 'default';
}

/** Map weather condition to background slug (WMO from Open-Meteo or OWM-style object) */
export function getWeatherBackgroundSlug(weather) {
  if (!weather) return 'default';
  if (weather.main && typeof weather.id === 'number' && weather.id > 99) {
    return owmWeatherToSlug(weather.main, weather.id);
  }
  const id = typeof weather === 'object' ? weather?.id : weather;
  if (id == null) return 'default';
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
