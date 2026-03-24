const KEY = 'skycast_ultra_favorites_v1';

/** @typedef {{ id: string; name: string; lat: number; lon: number; country?: string }} FavoriteCity */

/** @returns {FavoriteCity[]} */
export function getFavorites() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** @param {FavoriteCity[]} list */
export function setFavorites(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore quota */
  }
}

/** @param {Omit<FavoriteCity, 'id'> & { id?: string }} city */
export function addFavorite(city) {
  const id = city.id || `${city.lat.toFixed(4)},${city.lon.toFixed(4)}`;
  const list = getFavorites();
  if (list.some((f) => f.id === id)) return list;
  const next = [...list, { id, name: city.name, lat: city.lat, lon: city.lon, country: city.country }];
  setFavorites(next);
  return next;
}

/** @param {string} id */
export function removeFavorite(id) {
  const next = getFavorites().filter((f) => f.id !== id);
  setFavorites(next);
  return next;
}

/** @param {number} lat @param {number} lon */
export function isFavorite(lat, lon) {
  const id = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  return getFavorites().some((f) => f.id === id);
}
