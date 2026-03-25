import { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageOff } from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * @param {{
 *   article: import('../utils/weatherNewsApi').WeatherNewsArticle;
 *   index?: number;
 *   carouselTile?: boolean;
 *   className?: string;
 * }} props
 */
export default function NewsCard({ article, index = 0, carouselTile = false, className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = article.imageUrl && !imgFailed;

  const motionProps = {
    initial: { opacity: 0, y: carouselTile ? 0 : 10, x: carouselTile ? 8 : 0 },
    whileInView: { opacity: 1, y: 0, x: 0 },
    viewport: { once: true, margin: carouselTile ? '-24px' : '0px' },
    transition: { delay: Math.min(index * 0.05, 0.25) },
    className: carouselTile
      ? `news-carousel-tile-root h-full ${className}`.trim()
      : `h-full ${className}`.trim(),
  };

  if (carouselTile) {
    return (
      <motion.div {...motionProps}>
        <NewsCardInner
          article={article}
          carouselTile
          showImage={showImage}
          setImgFailed={setImgFailed}
        />
      </motion.div>
    );
  }

  return (
    <motion.li {...motionProps}>
      <NewsCardInner
        article={article}
        carouselTile={false}
        showImage={showImage}
        setImgFailed={setImgFailed}
      />
    </motion.li>
  );
}

function NewsCardInner({ article, carouselTile, showImage, setImgFailed }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 shadow-md transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl app-night:border-white/15 app-night:bg-slate-900/55"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {showImage ? (
          <img
            src={article.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-slate-100 to-sky-50 text-slate-400"
            aria-hidden
          >
            <ImageOff className="h-10 w-10" strokeWidth={2} aria-hidden />
            <span className="text-xs font-medium">No image</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="text-[10px] font-bold uppercase tracking-wide text-sky-700/90 app-night:text-sky-300/90">
          {article.source}
        </span>
        <h3
          className={`mt-1 line-clamp-2 font-semibold leading-snug text-app-fg group-hover:text-sky-600 app-night:group-hover:text-sky-300 ${carouselTile ? 'text-sm' : 'text-base'}`}
        >
          {article.title}
        </h3>
        {article.description ? (
          <p
            className={`mt-2 line-clamp-3 leading-relaxed text-app-fg/70 ${carouselTile ? 'text-xs' : 'text-sm'}`}
          >
            {article.description}
          </p>
        ) : null}
        <time className="mt-auto pt-3 text-[11px] text-app-fg/50" dateTime={article.publishedAt || undefined}>
          {formatDate(article.publishedAt) || '—'}
        </time>
      </div>
    </a>
  );
}

/** Skeleton card matching NewsCard layout */
export function NewsCardSkeleton({ className = '' }) {
  return (
    <li className={`overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-md ${className}`.trim()}>
      <div className="aspect-[16/10] animate-pulse bg-slate-200/80" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-20 animate-pulse rounded bg-slate-200/90" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-200/90" />
        <div className="h-4 w-[88%] max-w-full animate-pulse rounded bg-slate-200/90" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-200/80" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200/80" />
      </div>
    </li>
  );
}
