/** @param {(...args: any[]) => void} fn @param {number} ms */
export function debounce(fn, ms) {
  let t = 0;
  return (...args) => {
    window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
}

export const DEBOUNCE_SEARCH_MS = 300;

export const PLACEHOLDER_NEWS_IMAGE =
  'https://images.unsplash.com/photo-1504384308090-c54be3855833?auto=format&fit=crop&w=1200&q=80';

/** OpenWeatherMap illustration for blurred hero backgrounds */
export function weatherHeroImageUrl(iconCode) {
  if (!iconCode) return null;
  return `https://openweathermap.org/img/wn/${String(iconCode).replace('@2x', '')}@4x.png`;
}

export function roundTemp(v) {
  if (v == null || Number.isNaN(Number(v))) return '—';
  return `${Math.round(Number(v))}`;
}
