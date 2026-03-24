import { motion } from 'framer-motion';
import WeatherIcon from './WeatherIcon';
import { computeIsNight } from '../utils/dayNight';

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function FavoriteStarIcon({ filled, className = '' }) {
  const c = `h-6 w-6 flex-shrink-0 ${className}`.trim();
  if (filled) {
    return (
      <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return (
    <svg className={c} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
}

export default function CityWeather({ data, onSaveFavorite, isFavorite = false }) {
  if (!data) return null;

  const w = data.weather?.[0];
  const main = data.main || {};
  const wind = data.wind || {};
  const sys = data.sys || {};

  return (
    <motion.section
      id="city-weather"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-3xl glass-card-ultra p-6 sm:p-8"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-app-fg">City weather</h2>
        {onSaveFavorite && (
          <button
            type="button"
            disabled={isFavorite}
            onClick={() => onSaveFavorite(data)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/30 px-4 py-2 text-sm font-semibold text-app-fg backdrop-blur-md transition hover:bg-white/50 disabled:cursor-default disabled:opacity-70"
          >
            {isFavorite ? (
              <>
                <FavoriteStarIcon filled className="h-5 w-5 text-amber-500" />
                Saved
              </>
            ) : (
              <>
                <FavoriteStarIcon filled={false} className="h-5 w-5 text-app-fg/60" />
                Save to favorites
              </>
            )}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
            <WeatherIcon weather={w} className="h-20 w-20 sm:h-24 sm:w-24" isNight={computeIsNight(data)} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-app-fg/60">Temperature</p>
            <p className="temp-display">
              {main.temp != null ? Math.round(main.temp) : '—'}°C
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-medium text-app-fg/90">{data.name}</p>
              {isFavorite && (
                <span className="text-amber-500" title="In your favorites" aria-label="In your favorites">
                  <FavoriteStarIcon filled className="h-5 w-5 text-amber-500" />
                </span>
              )}
            </div>
            <p className="capitalize text-app-fg/70">{w?.description || '—'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="inset-tile px-3 py-2">
            <p className="text-xs text-app-fg/60">Humidity</p>
            <p className="font-semibold text-app-fg">{main.humidity ?? '—'}%</p>
          </div>
          <div className="inset-tile px-3 py-2">
            <p className="text-xs text-app-fg/60">Wind</p>
            <p className="font-semibold text-app-fg">
              {wind.speed != null ? Number(wind.speed).toFixed(1) : '—'} m/s
            </p>
          </div>
          <div className="inset-tile px-3 py-2">
            <p className="text-xs text-app-fg/60">Sunrise</p>
            <p className="font-semibold text-app-fg">{formatTime(sys.sunrise)}</p>
          </div>
          <div className="inset-tile px-3 py-2">
            <p className="text-xs text-app-fg/60">Sunset</p>
            <p className="font-semibold text-app-fg">{formatTime(sys.sunset)}</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
