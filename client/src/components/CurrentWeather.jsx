import { motion } from 'framer-motion';
import WeatherIcon from './WeatherIcon';

export default function CurrentWeather({
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
        id="current-hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/40 p-8 shadow-glass backdrop-blur-2xl sm:p-10"
      >
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-end border-t-transparent" />
          <p className="mt-4 text-sm text-text-dark/70">Finding your sky…</p>
        </div>
      </motion.section>
    );
  }

  if (error && !data) {
    return (
      <motion.section
        id="current-hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/40 p-8 backdrop-blur-2xl sm:p-10"
      >
        <p className="text-center text-text-dark/90">{error}</p>
        {onRetry && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-2xl bg-primary-end px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-primary-start"
            >
              Try location again
            </button>
          </div>
        )}
      </motion.section>
    );
  }

  if (!data) return null;

  const w = data.weather?.[0];
  const main = data.main || {};

  return (
    <motion.section
      id="current-hero"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative cursor-pointer overflow-hidden rounded-3xl border border-white/35 bg-white/45 p-8 shadow-glass backdrop-blur-2xl transition hover:bg-white/55 sm:p-12"
      onClick={onOpenDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpenDetail?.()}
      aria-label="Open location details"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-400/10 via-transparent to-violet-500/10" />
      <div className="relative flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <WeatherIcon weather={w} className="h-28 w-28 sm:h-36 sm:w-36" isNight={isNight} />
          </motion.div>
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-text-dark/50">Your location</p>
            <h1 className="mt-1 text-3xl font-bold text-text-dark sm:text-4xl">{data.name}</h1>
            <p className="mt-2 capitalize text-text-dark/70">{w?.description || '—'}</p>
          </div>
        </div>
        <div className="mt-8 sm:mt-0">
          <p className="temp-display text-transparent bg-clip-text bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-400 drop-shadow-sm">
            {main.temp != null ? Math.round(main.temp) : '—'}°
          </p>
          <p className="text-center text-sm text-text-dark/60 sm:text-right">
            Feels {main.feels_like != null ? `${Math.round(main.feels_like)}°` : '—'}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
