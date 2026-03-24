import { useCallback, useEffect, useRef, useState } from 'react';
import NewsCard from './NewsCard';

/**
 * Horizontal slider for remaining news articles (scroll-snap + prev/next).
 * @param {{ articles: import('../utils/weatherNewsApi').WeatherNewsArticle[], indexOffset?: number, country?: string }} props
 */
export default function NewsCarousel({ articles, indexOffset = 3, country = '' }) {
  const scrollerRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanLeft(scrollLeft > 6);
    setCanRight(maxScroll > 6 && scrollLeft < maxScroll - 6);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(() => updateScrollState());
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [articles, updateScrollState]);

  const scrollByDir = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.min(el.clientWidth * 0.75, 360);
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  if (!articles.length) return null;

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-dark/50 sm:text-sm">
          More stories
        </h3>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            disabled={!canLeft}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/90 bg-white/90 text-text-dark shadow-sm transition hover:border-sky-300 hover:bg-sky-50 disabled:pointer-events-none disabled:opacity-35"
            aria-label="Scroll news left"
          >
            <span className="text-lg leading-none" aria-hidden>
              ‹
            </span>
          </button>
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            disabled={!canRight}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/90 bg-white/90 text-text-dark shadow-sm transition hover:border-sky-300 hover:bg-sky-50 disabled:pointer-events-none disabled:opacity-35"
            aria-label="Scroll news right"
          >
            <span className="text-lg leading-none" aria-hidden>
              ›
            </span>
          </button>
        </div>
      </div>

      <div className="relative -mx-1">
        <ul
          ref={scrollerRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Additional weather news articles"
          className="flex list-none snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-3 pl-1 pr-1 pt-1 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.5)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80"
        >
          {articles.map((a, i) => (
            <NewsCard
              key={`${country}-${a.id}`}
              article={a}
              index={indexOffset + i}
              carouselTile
              className="w-[min(100%,18.5rem)] shrink-0 snap-start sm:w-[20rem]"
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
