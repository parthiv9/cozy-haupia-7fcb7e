import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CountryFilter, { COUNTRIES } from './CountryFilter';
import NewsCarousel from './NewsCarousel';
import NewsCard, { NewsCardSkeleton } from './NewsCard';
import { useNews } from '../hooks/useNews';

/** Featured row above the horizontal carousel */
const FEATURED_COUNT = 3;
const CAROUSEL_SKELETON_TILES = 4;

function normalizeCountryCode(code) {
  const c = String(code || 'in').toLowerCase().trim();
  if (c === 'uk') return 'gb';
  const allowed = COUNTRIES.map((x) => x.code);
  if (allowed.includes(c)) return c;
  return 'in';
}

/**
 * Weather-only news grid with country filter (NewsAPI everything / GNews search / RSS).
 * @param {{ defaultCountryCode?: string, locationCountryCode?: string }} props
 */
export default function NewsSection({ defaultCountryCode, locationCountryCode }) {
  const initial = normalizeCountryCode(defaultCountryCode || locationCountryCode || 'in');
  const [country, setCountry] = useState(initial);
  const { articles, loading, error } = useNews(country);
  const featured = articles.slice(0, FEATURED_COUNT);
  const carouselArticles = articles.slice(FEATURED_COUNT);

  useEffect(() => {
    setCountry(normalizeCountryCode(defaultCountryCode || locationCountryCode || 'in'));
  }, [defaultCountryCode, locationCountryCode]);

  return (
    <motion.section
      id="news"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby="weather-news-heading"
      className="rounded-2xl border border-white/30 bg-white/45 p-4 shadow-lg backdrop-blur-xl sm:p-6 app-night:bg-slate-900/35 app-night:border-white/12"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2
          id="weather-news-heading"
          className="text-sm font-semibold uppercase tracking-widest text-app-fg/75 sm:text-base"
        >
          Weather news
        </h2>
        <CountryFilter value={country} onChange={setCountry} />
      </div>

      <div className="mt-8">
        {error && !loading && articles.length === 0 && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm font-medium text-red-800 app-night:border-red-400/30 app-night:bg-red-950/40 app-night:text-red-200"
          >
            Unable to load weather news
            {error !== 'Unable to load weather news' ? ` — ${error}` : ''}.
          </div>
        )}

        {loading ? (
          <>
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {Array.from({ length: FEATURED_COUNT }, (_, i) => (
                <NewsCardSkeleton key={`sk-feat-${country}-${i}`} />
              ))}
            </ul>
            <div className="mt-8">
              <div className="mb-3 h-4 w-40 animate-pulse rounded-lg bg-white/40 app-night:bg-white/10" />
              <ul className="flex list-none gap-4 overflow-hidden pb-1 pl-1">
                {Array.from({ length: CAROUSEL_SKELETON_TILES }, (_, i) => (
                  <NewsCardSkeleton
                    key={`sk-car-${country}-${i}`}
                    className="w-[min(100%,18.5rem)] shrink-0 sm:w-[20rem]"
                  />
                ))}
              </ul>
            </div>
          </>
        ) : articles.length > 0 ? (
          <>
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {featured.map((a, i) => (
                <NewsCard key={`${country}-feat-${a.id}`} article={a} index={i} />
              ))}
            </ul>
            {carouselArticles.length > 0 && (
              <div className="mt-8 border-t border-white/20 pt-8 app-night:border-white/10">
                <h3 className="mb-0 text-xs font-bold uppercase tracking-[0.2em] text-app-fg/45">
                  More headlines
                </h3>
                <NewsCarousel
                  country={country}
                  articles={carouselArticles}
                  indexOffset={FEATURED_COUNT}
                />
              </div>
            )}
          </>
        ) : null}
      </div>
    </motion.section>
  );
}
