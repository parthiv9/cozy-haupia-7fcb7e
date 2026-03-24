import { motion } from 'framer-motion';
import WeatherIcon from './WeatherIcon';

/** Full calendar date for clarity, e.g. "Monday, March 16, 2025" */
function formatFullDate(dt) {
  const d = new Date(dt * 1000);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function calendarDayKey(dt) {
  const d = new Date(dt * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Forecast({ forecastData, loading, isNight = false }) {
  if (loading) {
    return (
      <motion.section
        id="forecast"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-3xl border border-white/30 bg-white/40 p-6 backdrop-blur-2xl sm:p-8"
      >
        <h2 className="mb-4 text-lg font-semibold text-text-dark">7-day outlook</h2>
        <div className="flex justify-center py-10">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary-end border-t-accent-yellow" />
        </div>
      </motion.section>
    );
  }

  const list = forecastData?.list || [];
  const daily = [];
  const seen = new Set();
  for (const item of list) {
    const key = calendarDayKey(item.dt);
    if (seen.has(key)) continue;
    seen.add(key);
    daily.push(item);
    if (daily.length >= 7) break;
  }

  if (daily.length === 0) {
    return (
      <motion.section
        id="forecast"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-3xl border border-white/30 bg-white/40 p-6 backdrop-blur-2xl sm:p-8"
      >
        <h2 className="mb-4 text-lg font-semibold text-text-dark">7-day outlook</h2>
        <p className="text-center text-sm text-text-dark/65">Allow location or search a city to see the forecast.</p>
      </motion.section>
    );
  }

  return (
    <motion.section
      id="forecast"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-3xl border border-white/30 bg-white/40 p-6 backdrop-blur-2xl sm:p-8"
    >
      <h2 className="mb-5 text-lg font-semibold text-text-dark">7-day outlook</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {daily.map((item, i) => {
          const w = item.weather?.[0];
          const m = item.main || {};
          const minT = m.temp_min != null ? Math.round(m.temp_min) : null;
          const maxT = m.temp_max != null ? Math.round(m.temp_max) : null;
          const fallback = m.temp != null ? Math.round(m.temp) : null;
          const minStr = minT != null ? `${minT}` : fallback != null ? `${fallback}` : '—';
          const maxStr = maxT != null ? `${maxT}` : fallback != null ? `${fallback}` : '—';
          return (
            <motion.div
              key={calendarDayKey(item.dt)}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{
                delay: 0.08 * i,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="flex items-start justify-between gap-3 rounded-2xl border border-white/25 bg-white/55 p-4 shadow-sm backdrop-blur-md"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-text-dark sm:text-base">
                  {formatFullDate(item.dt)}
                </p>
                <p className="mt-2 text-sm font-medium tabular-nums text-text-dark/90 sm:text-base">
                  Min {minStr}°C <span className="text-text-dark/40">/</span> Max {maxStr}°C
                </p>
                <p className="mt-1.5 text-xs text-text-dark/55">
                  Precip {Math.round((item.pop ?? 0) * 100)}%
                </p>
              </div>
              <WeatherIcon weather={w} className="h-12 w-12 flex-shrink-0 sm:h-14 sm:w-14" isNight={isNight} />
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
