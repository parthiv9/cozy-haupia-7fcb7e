/**
 * Canonical list of regions offered in weather news UI.
 * Add entries here to grow the selector; CountryFilter + NewsSection + weatherNewsApi stay in sync.
 *
 * @typedef {{ code: string, label: string, short: string, flag?: string, queryName?: string }} NewsRegionOption
 */

/** @type {NewsRegionOption[]} */
export const NEWS_REGION_OPTIONS = [
  { code: 'in', label: 'India', short: 'IN', flag: '🇮🇳', queryName: 'India' },
  { code: 'us', label: 'USA', short: 'US', flag: '🇺🇸', queryName: 'USA' },
  { code: 'gb', label: 'UK', short: 'UK', flag: '🇬🇧', queryName: 'UK' },
  { code: 'au', label: 'Australia', short: 'AU', flag: '🇦🇺', queryName: 'Australia' },
  { code: 'ca', label: 'Canada', short: 'CA', flag: '🇨🇦', queryName: 'Canada' },
  { code: 'de', label: 'Germany', short: 'DE', flag: '🇩🇪', queryName: 'Germany' },
  { code: 'fr', label: 'France', short: 'FR', flag: '🇫🇷', queryName: 'France' },
  { code: 'jp', label: 'Japan', short: 'JP', flag: '🇯🇵', queryName: 'Japan' },
  { code: 'nz', label: 'New Zealand', short: 'NZ', flag: '🇳🇿', queryName: 'New Zealand' },
  { code: 'br', label: 'Brazil', short: 'BR', flag: '🇧🇷', queryName: 'Brazil' },
  { code: 'sg', label: 'Singapore', short: 'SG', flag: '🇸🇬', queryName: 'Singapore' },
  { code: 'za', label: 'South Africa', short: 'ZA', flag: '🇿🇦', queryName: 'South Africa' },
];

export const DEFAULT_NEWS_REGION_CODE = 'in';

const CODE_SET = new Set(NEWS_REGION_OPTIONS.map((o) => o.code));

/**
 * Map geolocation / props to an allowed region code for news APIs.
 * @param {string} [code]
 * @returns {string}
 */
export function normalizeNewsRegionSelection(code) {
  let c = String(code || DEFAULT_NEWS_REGION_CODE).toLowerCase().trim();
  if (c === 'uk') c = 'gb';
  if (CODE_SET.has(c)) return c;
  return DEFAULT_NEWS_REGION_CODE;
}

/** @deprecated import normalizeNewsRegionSelection; kept for GPS helpers */
export const normalizeNewsRegion = normalizeNewsRegionSelection;
