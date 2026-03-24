import { motion } from 'framer-motion';
import WeatherIcon from './WeatherIcon';

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function CityWeather({ data, onSaveFavorite, isSaved }) {
  if (!data) return null;

  const w = data.weather?.[0];
  const main = data.main || {};
  const wind = data.wind || {};
  const sys = data.sys || {};
  const isNight = data?.is_day === 0;

  return (
    <motion.section
      id="city-weather"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-3xl border border-white/30 bg-white/45 p-6 shadow-glass backdrop-blur-2xl sm:p-8"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-text-dark">Exploring</h2>
        {onSaveFavorite && (
          <button
            type="button"
            onClick={onSaveFavorite}
            className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
              isSaved
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-white/40 bg-white/50 text-text-dark hover:bg-white/80'
            }`}
            aria-label={isSaved ? 'Saved' : 'Save city'}
          >
            {isSaved ? '⭐ Saved' : '☆ Save city'}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
            <WeatherIcon
              weather={w}
              className="h-20 w-20 text-text-dark sm:h-24 sm:w-24"
              isNight={isNight}
            />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-dark/60">Temperature</p>
            <p className="temp-display">
              {main.temp != null ? Math.round(main.temp) : '—'}°C
            </p>
            <p className="text-lg font-medium text-text-dark/90">{data.name}</p>
            <p className="capitalize text-text-dark/70">{w?.description || '—'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/50 px-3 py-2">
            <p className="text-xs text-text-dark/60">Humidity</p>
            <p className="font-semibold">{main.humidity ?? '—'}%</p>
          </div>
          <div className="rounded-xl bg-white/50 px-3 py-2">
            <p className="text-xs text-text-dark/60">Wind</p>
            <p className="font-semibold">
              {wind.speed != null ? Number(wind.speed).toFixed(1) : '—'} m/s
            </p>
          </div>
          <div className="rounded-xl bg-white/50 px-3 py-2">
            <p className="text-xs text-text-dark/60">Sunrise</p>
            <p className="font-semibold">{formatTime(sys.sunrise)}</p>
          </div>
          <div className="rounded-xl bg-white/50 px-3 py-2">
            <p className="text-xs text-text-dark/60">Sunset</p>
            <p className="font-semibold">{formatTime(sys.sunset)}</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
