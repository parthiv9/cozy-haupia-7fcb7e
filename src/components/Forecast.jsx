import { motion } from 'framer-motion';
import WeatherIcon from './WeatherIcon';
import { isNightForForecastDayIcon } from '../utils/dayNight';

/** e.g. "Saturday, March 21, 2026" — follows user locale */
function formatForecastFullDate(dtUnix) {
  try {
    return new Date(dtUnix * 1000).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatMinMax(main) {
  const minV = main?.temp_min;
  const maxV = main?.temp_max;
  const fallback = main?.temp;
  const minT = minV != null && Number.isFinite(Number(minV)) ? Math.round(Number(minV)) : null;
  const maxT = maxV != null && Number.isFinite(Number(maxV)) ? Math.round(Number(maxV)) : null;
  if (minT != null && maxT != null) {
    return `Min ${minT}°C / Max ${maxT}°C`;
  }
  if (fallback != null && Number.isFinite(Number(fallback))) {
    const t = Math.round(Number(fallback));
    return `Min ${t}°C / Max ${t}°C`;
  }
  return '—';
}

export default function Forecast({ forecastData, loading, locationWeather }) {
  if (loading) {
    return (
      <motion.section
        id="forecast"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl glass-card p-6 sm:p-8"
      >
        <h2 className="mb-4 text-lg font-semibold text-app-fg">7-day forecast</h2>
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-end border-t-accent-yellow" />
        </div>
      </motion.section>
    );
  }

  const list = forecastData?.list || [];
  const daily = [];
  const seen = new Set();
  for (const item of list) {
    const dayKey = new Date(item.dt * 1000).toISOString().slice(0, 10);
    if (seen.has(dayKey)) continue;
    seen.add(dayKey);
    daily.push(item);
    if (daily.length >= 7) break;
  }

  if (daily.length === 0) {
    return (
      <motion.section
        id="forecast"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl glass-card p-6 sm:p-8"
      >
        <h2 className="mb-4 text-lg font-semibold text-app-fg">7-day forecast</h2>
        <p className="text-center text-app-fg/70">Search a city or allow location for forecast.</p>
      </motion.section>
    );
  }

  return (
    <motion.section
      id="forecast"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl glass-card p-6 sm:p-8"
    >
      <h2 className="mb-4 text-lg font-semibold text-app-fg">7-day forecast</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {daily.map((item, i) => {
          const w = item.weather?.[0];
          return (
            <motion.div
              key={item.dt}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i }}
              whileHover={{ y: -4 }}
              className="inset-tile flex items-start justify-between gap-3 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-app-fg sm:text-base">
                  {formatForecastFullDate(item.dt)}
                </p>
                <p className="mt-2 text-sm font-medium tabular-nums text-app-fg/90 sm:text-[15px]">
                  {formatMinMax(item.main)}
                </p>
                <p className="mt-1.5 text-xs text-app-fg/60">
                  Rain {Math.round((item.pop ?? 0) * 100)}%
                </p>
              </div>
              <WeatherIcon
                weather={w}
                className="h-12 w-12 flex-shrink-0 self-center"
                isNight={isNightForForecastDayIcon(item.dt, locationWeather ?? null)}
              />
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
