import { motion } from 'framer-motion';
import WeatherIcon from './WeatherIcon';
import { useDayNight } from '../context/DayNightContext';

/**
 * Hero card for GPS / resolved current location only.
 * Search results do not drive this block — keeps “home” context clear.
 */
export default function CurrentWeather({
  data,
  loading,
  error,
  onOpenDetail,
  onRetry,
  isNight: isNightProp,
}) {
  const { isNight: ctxNight } = useDayNight();
  const isNight = isNightProp ?? ctxNight;

  if (loading) {
    return (
      <motion.section
        id="current-location"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl glass-card-ultra p-8 sm:p-10"
      >
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          <p className="text-sm text-app-fg/65">Locating you and loading conditions…</p>
        </div>
      </motion.section>
    );
  }

  if (error && !data) {
    return (
      <motion.section
        id="current-location"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl glass-card-ultra p-8 sm:p-10"
      >
        <p className="text-center text-app-fg/80">{error}</p>
        {onRetry && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg"
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

  return (
    <motion.section
      id="current-location"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 280 }}
      className="relative overflow-hidden rounded-3xl glass-card-ultra p-8 sm:p-10"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-amber-300/25 to-sky-400/20 blur-3xl" />
      <button
        type="button"
        onClick={onOpenDetail}
        className="relative w-full text-left transition hover:opacity-95"
        aria-label="Open detailed weather for current location"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-fg/50">Your location</p>
        <div className="mt-4 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-app-fg sm:text-4xl">{data.name || 'Current location'}</h2>
            <p className="mt-2 text-lg capitalize text-app-fg/70">{w?.description || '—'}</p>
          </div>
          <div className="flex items-center gap-5">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
            >
              <WeatherIcon weather={w} className="h-24 w-24 sm:h-28 sm:w-28" isNight={isNight} />
            </motion.div>
            <span className="text-6xl font-light tabular-nums tracking-tighter text-app-fg sm:text-7xl">
              {main.temp != null ? `${Math.round(main.temp)}°` : '—'}
            </span>
          </div>
        </div>
        <p className="mt-6 text-sm text-app-fg/55">Tap for sunrise, humidity, and more</p>
      </button>
    </motion.section>
  );
}
