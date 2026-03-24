const STORAGE_KEY = 'skycast-ultra-favorites-v1';

function readRaw() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return [];
    const j = JSON.parse(s);
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function writeRaw(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode */
  }
}

/**
 * @typedef {{ id: string, name: string, lat?: number, lon?: number, country?: string }} FavoriteCity
 */

/** @returns {FavoriteCity[]} */
export function getFavoriteCities() {
  return readRaw();
}

/** @param {Omit<FavoriteCity, 'id'> & { name: string }} entry */
export function addFavoriteCity(entry) {
  const name = (entry.name || '').trim();
  if (!name) return getFavoriteCities();
  const list = readRaw();
  const id = `${name.toLowerCase()}-${entry.lat ?? ''}-${entry.lon ?? ''}`;
  if (list.some((x) => x.id === id)) return list;
  writeRaw([{ id, ...entry, name }, ...list].slice(0, 24));
  return readRaw();
}

/** @param {string} id */
export function removeFavoriteCity(id) {
  const list = readRaw().filter((x) => x.id !== id);
  writeRaw(list);
  return list;
}

/** Same id rule as `addFavoriteCity` — match current weather `data` shape */
export function isFavoriteCityMatch({ name, lat, lon }) {
  const n = (name || '').trim();
  if (!n) return false;
  const id = `${n.toLowerCase()}-${lat ?? ''}-${lon ?? ''}`;
  return readRaw().some((x) => x.id === id);
}

/** Aliases for SavedCities.jsx / Home.jsx */
export const getFavorites = getFavoriteCities;
export function addFavorite(entry) {
  return addFavoriteCity(entry);
}
export function removeFavorite(id) {
  return removeFavoriteCity(id);
}
