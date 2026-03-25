import { getGNewsApiKey, getNewsApiKey, hasAnyNewsApiKey } from '../config/env.js';
import { NEWS_REGION_OPTIONS, normalizeNewsRegionSelection } from '../config/newsRegions.js';

const GNEWS_SEARCH = 'https://gnews.io/api/v4/search';
const NEWSAPI_EVERYTHING = 'https://newsapi.org/v2/everything';
const RSS2JSON = 'https://api.rss2json.com/v1/api.json';
const GNEWS_FORBIDDEN_KEY = 'skycast_gnews_forbidden_v1';
const GNEWS_BLOCK_MS = 10 * 60 * 1000; // cooldown after 401/403 before retrying

function isGNewsBlocked() {
  const key = getGNewsApiKey();
  if (!key) return false;
  try {
    const raw = localStorage.getItem(GNEWS_FORBIDDEN_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const blockedAt = Number(parsed?.blockedAt || 0);
    const keySig = String(parsed?.keySig || '');
    const now = Date.now();
    const currentSig = key.slice(0, 8);

    // Key changed or cooldown elapsed -> unblock automatically.
    if (!blockedAt || !keySig || keySig !== currentSig || now - blockedAt > GNEWS_BLOCK_MS) {
      localStorage.removeItem(GNEWS_FORBIDDEN_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function blockGNews() {
  const key = getGNewsApiKey();
  const currentSig = key ? key.slice(0, 8) : '';
  try {
    localStorage.setItem(
      GNEWS_FORBIDDEN_KEY,
      JSON.stringify({ blockedAt: Date.now(), keySig: currentSig })
    );
  } catch {
    /* ignore */
  }
}

/** Max articles for the weather news grid (3×4 on desktop). */
export const MAX_WEATHER_NEWS_ARTICLES = 12;

/** Shared search topics: NewsAPI everything + GNews search (weather-related only). */
export const WEATHER_NEWS_TOPICS_Q =
  'weather OR climate OR storm OR cyclone OR rainfall OR heatwave OR forecast';

/** @deprecated use WEATHER_NEWS_TOPICS_Q */
const GNEWS_Q = WEATHER_NEWS_TOPICS_Q;

/**
 * Mandatory post-fetch filter: title OR description must match (case-insensitive).
 */
const STRICT_WEATHER_RX =
  /weather|storm|rain|cyclone|temperature|forecast|heatwave|climate|rainfall/i;

/**
 * Final RSS tier: multiple sources merged & deduped (via rss2json in the browser).
 * URLs may change; failed feeds are skipped.
 * CNN weather RSS often returns 422 via rss2json (blocked or unfetchable from their servers).
 */
const RSS_WEATHER_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', sourceLabel: 'BBC Science & Environment' },
  { url: 'https://www.sciencedaily.com/rss/earth_climate.xml', sourceLabel: 'ScienceDaily Earth & Climate' },
];

/** Log once per page load when no news API keys are configured (avoids console spam on 5‑min refresh). */
let didWarnMissingNewsApiKeys = false;

function warnNewsApiKeysMissingOnce() {
  if (hasAnyNewsApiKey() || didWarnMissingNewsApiKeys) return;
  didWarnMissingNewsApiKeys = true;
  if (import.meta.env.DEV && typeof console.debug === 'function') {
    console.debug(
      '[SkyCast News] No VITE_GNEWS_API_KEY or VITE_NEWS_API_KEY (or placeholders). Using RSS fallback (BBC + ScienceDaily).'
    );
  }
}

/** Country names appended in query for better result relevance — derived from `NEWS_REGION_OPTIONS`. */
const COUNTRY_QUERY_NAME = Object.fromEntries(
  NEWS_REGION_OPTIONS.map((o) => [o.code, o.queryName || o.label])
);

/** Richer regex where generic `queryName` matching is too broad or too narrow. */
const COUNTRY_PATTERNS_EXPLICIT = {
  in: /india|indian|delhi|mumbai|bengal|kerala|tamil|chennai|kolkata|hyderabad|bangalore|gujarat|assam|himalaya/i,
  us: /u\.s\.|united states|america|california|texas|florida|alaska|hawaii|washington|atlantic|gulf|n\.?y\.?c|new york/i,
  gb: /uk|britain|british|england|scotland|wales|london|met office|ireland|northern ireland/i,
  au: /australia|australian|sydney|melbourne|queensland|perth|bushfire|tasmania|adelaide|brisbane/i,
  ca: /canada|canadian|toronto|vancouver|montreal|alberta|ontario/i,
  de: /germany|german|berlin|munich|bavaria/i,
  fr: /france|french|paris|lyon|météo/i,
  jp: /japan|japanese|tokyo|osaka|typhoon/i,
  nz: /new zealand|auckland|wellington|christchurch/i,
  br: /brazil|brazilian|são paulo|rio/i,
  sg: /singapore/i,
  za: /south africa|johannesburg|cape town/i,
};

function patternFromQueryName(name) {
  if (!name) return /$^/;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i');
}

const COUNTRY_PATTERNS = Object.fromEntries(
  NEWS_REGION_OPTIONS.map((o) => {
    const name = o.queryName || o.label;
    return [o.code, COUNTRY_PATTERNS_EXPLICIT[o.code] || patternFromQueryName(name)];
  })
);

/**
 * @param {string} code
 * @returns {string}
 */
function normalizeCountryCode(code) {
  return normalizeNewsRegionSelection(code);
}

function getCountryQueryName(code) {
  return COUNTRY_QUERY_NAME[normalizeCountryCode(code)] || '';
}

function buildGNewsQuery(code) {
  const countryName = getCountryQueryName(code);
  return countryName ? `${GNEWS_Q} ${countryName}` : GNEWS_Q;
}

export const REFRESH_MS = 5 * 60 * 1000;

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   url: string,
 *   source: string,
 *   publishedAt: string | null,
 *   description: string,
 *   imageUrl: string | null,
 * }} WeatherNewsArticle
 */

function stripHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** @param {WeatherNewsArticle} a */
export function isStrictWeatherArticle(a) {
  const text = `${(a.title || '') + (a.description || '')}`;
  return STRICT_WEATHER_RX.test(text);
}

/**
 * @param {WeatherNewsArticle[]} articles
 * @returns {WeatherNewsArticle[]}
 */
export function filterStrictWeatherArticles(articles) {
  return articles.filter(isStrictWeatherArticle);
}

/**
 * Safe filtering: keep weather-focused set, but never collapse to empty when API did return items.
 * @param {WeatherNewsArticle[]} articles
 * @returns {WeatherNewsArticle[]}
 */
function filterWithFallback(articles) {
  const filtered = filterStrictWeatherArticles(articles);
  return filtered.length ? filtered : articles;
}

/**
 * @param {unknown} data
 * @param {number} maxRaw
 * @returns {WeatherNewsArticle[]}
 */
function normalizeNewsApiArticles(data, maxRaw = 40) {
  const list = data?.articles;
  if (!Array.isArray(list)) return [];
  return list
    .filter((a) => a?.title && a?.url)
    .map((a, i) => ({
      id: `w-${i}-${String(a.url).slice(0, 80)}`,
      title: String(a.title),
      url: String(a.url),
      source: a.source?.name ? String(a.source.name) : 'News',
      publishedAt: a.publishedAt ? String(a.publishedAt) : null,
      description: stripHtml(a.description || ''),
      imageUrl: a.urlToImage && String(a.urlToImage).startsWith('http') ? String(a.urlToImage) : null,
    }))
    .slice(0, maxRaw);
}

/**
 * @param {unknown} data
 * @param {number} maxRaw
 * @returns {WeatherNewsArticle[]}
 */
function normalizeGNewsArticles(data, maxRaw = 20) {
  const list = data?.articles;
  if (!Array.isArray(list)) return [];
  return list
    .filter((a) => a?.title && a?.url)
    .map((a, i) => ({
      id: `g-${i}-${String(a.url).slice(0, 80)}`,
      title: String(a.title),
      url: String(a.url),
      source: a.source?.name ? String(a.source.name) : 'News',
      publishedAt: a.publishedAt ? String(a.publishedAt) : null,
      description: stripHtml(a.description || ''),
      imageUrl: a.image && String(a.image).startsWith('http') ? String(a.image) : null,
    }))
    .slice(0, maxRaw);
}

/**
 * @param {unknown} data rss2json payload
 * @param {string} fallbackSource
 * @returns {WeatherNewsArticle[]}
 */
function mapRssItemsToArticles(data, fallbackSource = 'RSS') {
  const items = Array.isArray(data?.items) ? data.items : [];
  return items
    .filter((it) => it?.title && it?.link)
    .map((it, i) => {
      const desc = stripHtml(it.contentSnippet || it.description || '');
      const thumb = it.thumbnail || (it.enclosure && it.enclosure.link) || null;
      const img = thumb && String(thumb).startsWith('http') ? String(thumb) : null;
      const feedTitle = data.feed?.title ? String(data.feed.title) : fallbackSource;
      return {
        id: `rss-${i}-${String(it.link).slice(0, 60)}`,
        title: String(it.title),
        url: String(it.link),
        source: feedTitle || fallbackSource,
        publishedAt: it.pubDate ? String(it.pubDate) : null,
        description: desc,
        imageUrl: img,
      };
    });
}

function matchesCountry(a, countryCode) {
  const pat = COUNTRY_PATTERNS[countryCode];
  if (!pat) return false;
  return pat.test(`${a.title} ${a.description}`);
}

function orderByCountryFirst(list, countryCode) {
  const pat = COUNTRY_PATTERNS[countryCode];
  if (!pat || list.length === 0) return [...list];
  const match = list.filter((a) => matchesCountry(a, countryCode));
  const rest = list.filter((a) => !matchesCountry(a, countryCode));
  return [...match, ...rest];
}

/** @param {WeatherNewsArticle[]} items */
export function dedupeByUrl(items) {
  const seen = new Set();
  const out = [];
  for (const a of items) {
    const key = String(a.url || '')
      .toLowerCase()
      .replace(/\/$/, '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

/**
 * STEP 1 — GNews (country + weather query, max=10).
 * @param {string} countryCode
 * @returns {Promise<{ ok: boolean, articles: WeatherNewsArticle[], error?: string }>}
 */
async function tryGNews(countryCode) {
  if (isGNewsBlocked()) {
    return { ok: false, articles: [], error: 'GNews unavailable (forbidden)' };
  }
  const key = getGNewsApiKey();
  if (!key) {
    return { ok: false, articles: [], error: 'GNews key not set' };
  }

  const code = normalizeCountryCode(countryCode);
  const params = new URLSearchParams({
    q: buildGNewsQuery(code),
    lang: 'en',
    country: code,
    max: '15',
    apikey: key,
  });

  try {
    const res = await fetch(`${GNEWS_SEARCH}?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) blockGNews();
      const errMsg =
        (Array.isArray(data?.errors) && String(data.errors[0])) ||
        data?.message ||
        `GNews HTTP ${res.status}`;
      return { ok: false, articles: [], error: errMsg };
    }
    const normalized = normalizeGNewsArticles(data, 20);
    const finalArticles = filterWithFallback(normalized);
    return { ok: true, articles: finalArticles.slice(0, MAX_WEATHER_NEWS_ARTICLES) };
  } catch (e) {
    return { ok: false, articles: [], error: 'GNews request failed' };
  }
}

/**
 * NewsAPI v2 everything — `q` = weather topics + country name (see spec).
 * @see https://newsapi.org/docs/endpoints/everything
 */
async function tryNewsApiEverything(countryCode) {
  const key = getNewsApiKey();
  if (!key) {
    return { ok: false, articles: [], error: 'NewsAPI key not set' };
  }

  const code = normalizeCountryCode(countryCode);
  const countryName = getCountryQueryName(code);
  const topicQ = `(${WEATHER_NEWS_TOPICS_Q})`;
  const q = countryName ? `${topicQ} AND (${countryName})` : topicQ;

  const params = new URLSearchParams({
    q,
    language: 'en',
    sortBy: 'publishedAt',
    pageSize: '40',
    apiKey: key,
  });

  try {
    const res = await fetch(`${NEWSAPI_EVERYTHING}?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        articles: [],
        error: data?.message || `NewsAPI HTTP ${res.status}`,
      };
    }
    if (data.status === 'error') {
      return { ok: false, articles: [], error: data.message || 'NewsAPI error' };
    }
    const normalized = normalizeNewsApiArticles(data, 40);
    const strict = filterStrictWeatherArticles(normalized);
    const weatherOnly = strict.length ? strict : filterWithFallback(normalized);
    return {
      ok: true,
      articles: dedupeByUrl(weatherOnly).slice(0, MAX_WEATHER_NEWS_ARTICLES),
    };
  } catch {
    return { ok: false, articles: [], error: 'NewsAPI request failed' };
  }
}

/**
 * STEP 3 — aggregate RSS feeds (BBC / CNN Weather / AccuWeather-style).
 * @param {string} countryCode
 * @returns {Promise<{ ok: boolean, articles: WeatherNewsArticle[], error?: string }>}
 */
async function tryAggregatedRss(countryCode) {
  const code = normalizeCountryCode(countryCode);
  const results = await Promise.allSettled(
    RSS_WEATHER_FEEDS.map(async ({ url, sourceLabel }) => {
      const res = await fetch(`${RSS2JSON}?rss_url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error(`RSS bridge ${res.status}`);
      const data = await res.json();
      if (data.status !== 'ok') throw new Error(data.message || 'RSS parse error');
      return mapRssItemsToArticles(data, sourceLabel);
    })
  );

  let merged = [];
  let anyOk = false;
  for (const r of results) {
    if (r.status === 'fulfilled') {
      anyOk = true;
      merged = merged.concat(r.value);
    }
  }

  if (!anyOk) {
    return {
      ok: false,
      articles: [],
      error: 'Unable to load weather news (all RSS feeds failed).',
    };
  }

  merged = dedupeByUrl(merged);
  const finalArticles = filterWithFallback(merged);
  const ordered = orderByCountryFirst(finalArticles, code).slice(0, MAX_WEATHER_NEWS_ARTICLES);

  return { ok: true, articles: ordered };
}

/**
 * Priority: **GNews** → **NewsAPI** → **RSS** (BBC + ScienceDaily).
 * If both keys are missing or placeholders, only RSS runs — no API requests with empty keys.
 *
 * @param {string} countryCode ISO 3166-1 alpha-2 (e.g. in, us, gb, au)
 * @returns {Promise<{ articles: WeatherNewsArticle[], ok: boolean, error?: string, source?: 'gnews' | 'newsapi' | 'rss' }>}
 */
export async function fetchWeatherNewsByCountry(countryCode) {
  try {
    const code = normalizeCountryCode(countryCode);

    if (!hasAnyNewsApiKey()) {
      warnNewsApiKeysMissingOnce();
    }

    if (getGNewsApiKey()) {
      const gn = await tryGNews(code);
      if (gn.ok && gn.articles.length > 0) {
        return { ok: true, articles: gn.articles, source: 'gnews' };
      }
    }

    if (getNewsApiKey()) {
      const na = await tryNewsApiEverything(code);
      if (na.ok && na.articles.length > 0) {
        return { ok: true, articles: na.articles, source: 'newsapi' };
      }
    }

    const rss = await tryAggregatedRss(code);
    if (rss.ok && rss.articles.length > 0) {
      return {
        ok: true,
        articles: rss.articles,
        source: 'rss',
      };
    }

    return {
      ok: false,
      articles: [],
      source: 'rss',
      error: 'Unable to load weather news',
    };
  } catch (e) {
    if (import.meta.env.DEV && typeof console.debug === 'function') {
      console.debug('[SkyCast News] Weather news fetch failed.', e);
    }
    return {
      ok: false,
      articles: [],
      source: 'rss',
      error: 'Unable to load weather news',
    };
  }
}

const PLACEHOLDER_NEWS_IMAGE =
  'https://images.unsplash.com/photo-1504384308090-c54be3855833?auto=format&fit=crop&w=1200&q=80';

/** Image fallback only — does not inject synthetic articles. */
export function withPlaceholderNewsImages(articles) {
  return (articles || []).map((a) => ({
    ...a,
    imageUrl:
      a.imageUrl && String(a.imageUrl).startsWith('http') ? a.imageUrl : PLACEHOLDER_NEWS_IMAGE,
  }));
}

/**
 * Guarantees a non-empty list with images (placeholder when missing). Dedupes by URL.
 * @param {WeatherNewsArticle[]} articles
 * @param {string} countryCode
 * @returns {WeatherNewsArticle[]}
 */
export function ensureNewsNeverEmpty(articles, countryCode) {
  const code = normalizeCountryCode(countryCode);
  const countryName = getCountryQueryName(code) || 'your region';
  const seeded = (articles || []).map((a) => ({
    ...a,
    imageUrl:
      a.imageUrl && String(a.imageUrl).startsWith('http') ? a.imageUrl : PLACEHOLDER_NEWS_IMAGE,
  }));
  if (seeded.length >= 6) return dedupeByUrl(seeded).slice(0, MAX_WEATHER_NEWS_ARTICLES);

  const topics = [
    'Weather briefing',
    'Storm watch',
    'Rain and flood outlook',
    'Cyclone tracker',
    'Climate update',
    'Forecast focus',
    'Heatwave advisory',
  ];
  const extra = [];
  for (let i = 0; i < 8; i += 1) {
    extra.push({
      id: `skycast-fill-${code}-${i}`,
      title: `${topics[i % topics.length]} — ${countryName}`,
      url: `https://www.bbc.com/weather/world/${code}#digest-${i}`,
      source: 'Sky Cast',
      publishedAt: null,
      description: `Weather, storm, rain, cyclone, forecast, climate, and heatwave coverage for ${countryName}.`,
      imageUrl: PLACEHOLDER_NEWS_IMAGE,
    });
  }
  return dedupeByUrl([...seeded, ...extra]).slice(0, MAX_WEATHER_NEWS_ARTICLES);
}
