import { motion } from 'framer-motion';
import WeatherIcon from './WeatherIcon';
import { weatherHeroImageUrl, roundTemp } from '../utils/helpers';

const shell =
  'relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-white/35 bg-white/20 text-center text-white shadow-xl backdrop-blur-xl';

/**
 * Vertical glass card for “Your location” — centered, premium glassmorphism.
 */
export default function CurrentLocation({
  data,
  loading,
  error,
  onRetry,
  onOpenDetail,
  isNight = false,
}) {
  if (loading) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${shell} min-h-[22rem] p-8`}
      >
        <div className="flex min-h-[18rem] flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <p className="text-sm text-white/85">Finding your location…</p>
        </div>
      </motion.section>
    );
  }

  if (error && !data) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${shell} p-8`}
      >
        <p className="text-sm text-white/95">{error}</p>
        {onRetry && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-2xl bg-white/25 px-6 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-white/40 transition hover:bg-white/35"
            >
              Try again
            </button>
          </div>
        )}
      </motion.section>
    );
  }

  if (!data) return null;

  const w = data.weather?.[0];
  const main = data.main || {};
  const icon = w?.icon || '01d';
  const bgUrl = weatherHeroImageUrl(icon);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`${shell} cursor-pointer min-h-[26rem] p-6 sm:min-h-[28rem] sm:p-8`}
      onClick={onOpenDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpenDetail?.()}
      aria-label="Your location weather details"
    >
      {bgUrl && (
        <>
          <img
            src={bgUrl}
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40"
            aria-hidden
          />
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-md" aria-hidden />
        </>
      )}
      {!bgUrl && <div className="absolute inset-0 bg-gradient-to-b from-sky-600/50 to-slate-900/40" aria-hidden />}

      <div className="relative flex min-h-[22rem] flex-col items-center justify-between gap-8 sm:min-h-[24rem]">
        <div className="w-full">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/75">Your location</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white drop-shadow-lg sm:text-3xl">
            {data.name || 'Here'}
          </h1>
          <p className="mt-2 capitalize text-white/90">{w?.description || '—'}</p>
        </div>

        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="rounded-3xl border border-white/40 bg-white/15 p-5 shadow-lg backdrop-blur-md"
        >
          <WeatherIcon weather={w} className="mx-auto h-28 w-28 sm:h-36 sm:w-36" isNight={isNight} />
        </motion.div>

        <div>
          <p className="text-6xl font-bold tabular-nums leading-none text-white drop-shadow-lg sm:text-7xl">
            {roundTemp(main.temp)}°
          </p>
          <p className="mt-3 text-sm font-medium text-white/85">Feels like {roundTemp(main.feels_like)}°</p>
        </div>
      </div>
    </motion.section>
  );
}
