import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import CountryFilter from './CountryFilter';
import NewsCarousel from './NewsCarousel';
import NewsCard, { NewsCardSkeleton } from './NewsCard';
import { fetchWeatherNewsByCountry, REFRESH_MS } from '../utils/weatherNewsApi';

const FEATURED_COUNT = 3;

export default function NewsSection() {
  const [country, setCountry] = useState('in');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState('');
  const [emptyHint, setEmptyHint] = useState('');
  /** Ignore late responses when debounced country moves on before fetch finishes. */
  const newsFetchGeneration = useRef(0);

  /* Fetch for selected country */
  useEffect(() => {
    const gen = ++newsFetchGeneration.current;

    setLoading(true);
    setArticles([]);
    setFatalError('');
    setEmptyHint('');

    (async () => {
      const { ok, articles: list, error: err } = await fetchWeatherNewsByCountry(country);
      if (gen !== newsFetchGeneration.current) return;

      setLoading(false);
      if (!ok) {
        setArticles([]);
        setFatalError(err || 'Unable to load weather news');
        return;
      }
      setArticles(list);
      setFatalError('');
      if (list.length === 0) {
        setEmptyHint('No weather news available');
      }
    })();
  }, [country]);

  /* Background refresh for current selected country */
  useEffect(() => {
    const id = setInterval(async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      const genBefore = newsFetchGeneration.current;
      const { ok, articles: list } = await fetchWeatherNewsByCountry(country);
      if (genBefore !== newsFetchGeneration.current) return;
      if (!ok || !list?.length) return;
      setArticles(list);
      setEmptyHint('');
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [country]);

  const showSkeleton = loading;
  const showFatal = !loading && articles.length === 0 && fatalError;
  const featuredArticles = articles.slice(0, FEATURED_COUNT);
  const carouselArticles = articles.slice(FEATURED_COUNT);

  return (
    <motion.section
      id="news"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby="weather-news-heading"
      className="rounded-2xl border border-white/30 bg-white/40 p-4 shadow-glass backdrop-blur-2xl sm:p-6"
    >
      <div className="mb-5 flex flex-col gap-4">
        <div>
          <h2
            id="weather-news-heading"
            className="text-sm font-semibold uppercase tracking-widest text-text-dark/55 sm:text-base"
          >
            Weather news
          </h2>
          <p className="mt-1 max-w-xl text-xs text-text-dark/50">
            Weather-related headlines for the country you select.
          </p>
        </div>
        <CountryFilter value={country} onChange={setCountry} />
      </div>

      {showFatal ? (
        <p
          className="rounded-xl border border-red-200/90 bg-red-50/95 px-4 py-3 text-sm font-medium text-red-900/90"
          role="alert"
        >
          Unable to load weather news
          {fatalError && fatalError !== 'Unable to load weather news' ? ` — ${fatalError}` : null}
        </p>
      ) : null}

      {!loading && !fatalError && emptyHint ? (
        <p className="mb-4 rounded-xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 text-sm text-text-dark/70">
          {emptyHint}
        </p>
      ) : null}

      {showSkeleton ? (
        <>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: FEATURED_COUNT }, (_, i) => (
              <NewsCardSkeleton key={`sk-f-${i}`} />
            ))}
          </ul>
          <div className="mt-8">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-text-dark/40">More stories</p>
            <ul className="flex list-none gap-4 overflow-hidden pb-1 pl-1">
              {Array.from({ length: 4 }, (_, i) => (
                <NewsCardSkeleton
                  key={`sk-c-${i}`}
                  className="w-[min(100%,18.5rem)] shrink-0 sm:w-[20rem]"
                />
              ))}
            </ul>
          </div>
        </>
      ) : (
        <>
          {articles.length > 0 ? (
            <>
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {featuredArticles.map((a, i) => (
                  <NewsCard key={`${country}-${a.id}`} article={a} index={i} />
                ))}
              </ul>
              <NewsCarousel country={country} articles={carouselArticles} indexOffset={FEATURED_COUNT} />
            </>
          ) : null}
        </>
      )}
    </motion.section>
  );
}
