import { motion } from 'framer-motion';
import WeatherIcon from './WeatherIcon';
import DetailIcon from './DetailIcon';
import { getWeatherBackgroundSlug } from '../utils/weatherApi';

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const WEATHER_GRADIENTS = {
  default: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 50%, #7DD3FC 100%)',
  clear: 'linear-gradient(160deg, #1e3a5f 0%, #2563eb 25%, #38bdf8 55%, #fbbf24 85%, #f59e0b 100%)',
  'partly-cloudy': 'linear-gradient(165deg, #1e40af 0%, #3b82f6 30%, #93c5fd 60%, #e0e7ff 100%)',
  cloudy: 'linear-gradient(180deg, #475569 0%, #64748b 35%, #94a3b8 70%, #cbd5e1 100%)',
  rain: 'linear-gradient(180deg, #1e293b 0%, #334155 30%, #475569 60%, #64748b 100%)',
  drizzle: 'linear-gradient(180deg, #334155 0%, #475569 40%, #64748b 75%, #94a3b8 100%)',
  snow: 'linear-gradient(180deg, #0f172a 0%, #1e293b 25%, #334155 55%, #64748b 85%, #cbd5e1 100%)',
  thunderstorm: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 30%, #312e81 55%, #3730a3 80%, #4c1d95 100%)',
  fog: 'linear-gradient(180deg, #64748b 0%, #94a3b8 35%, #cbd5e1 65%, #e2e8f0 100%)',
};

export default function LocationDetailModal({ data, onClose, isNight = false }) {
  if (!data) return null;

  const w = data.weather?.[0];
  const main = data.main || {};
  const wind = data.wind || {};
  const sys = data.sys || {};
  const slug = getWeatherBackgroundSlug(w);
  const gradient = WEATHER_GRADIENTS[slug] || WEATHER_GRADIENTS.default;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md"
      aria-modal="true"
      role="dialog"
      aria-labelledby="location-detail-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'tween', duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
      >
        {/* Blurred weather-matched background */}
        <div
          className="absolute inset-0 blur-2xl scale-110"
          style={{ background: gradient }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-white/75 backdrop-blur-md" aria-hidden="true" />
        {/* Content */}
        <div className="relative z-10 p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id="location-detail-title" className="text-lg font-semibold text-text-dark">
              SkyCast Ultra — your location
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-dark/70 transition hover:bg-white/80 hover:text-text-dark"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <WeatherIcon
              weather={w}
              className="h-16 w-16 flex-shrink-0 text-text-dark sm:h-20 sm:w-20"
              isNight={isNight}
            />
            <div>
              <p className="text-2xl font-bold text-text-dark sm:text-3xl">
                {main.temp != null ? Math.round(main.temp) : '—'}°C
              </p>
              <p className="font-medium text-text-dark/90">{data.name}</p>
              <p className="capitalize text-text-dark/70">{w?.description || '—'}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/60 px-3 py-2.5">
              <p className="flex items-center gap-2 text-xs text-text-dark/60">
                <DetailIcon name="thermometer" /> Feels like
              </p>
              <p className="font-semibold">{main.feels_like != null ? Math.round(main.feels_like) : '—'}°C</p>
            </div>
            <div className="rounded-xl bg-white/60 px-3 py-2.5">
              <p className="flex items-center gap-2 text-xs text-text-dark/60">
                <DetailIcon name="droplet" /> Humidity
              </p>
              <p className="font-semibold">{main.humidity ?? '—'}%</p>
            </div>
            <div className="rounded-xl bg-white/60 px-3 py-2.5">
              <p className="flex items-center gap-2 text-xs text-text-dark/60">
                <DetailIcon name="wind" /> Wind
              </p>
              <p className="font-semibold">{wind.speed != null ? Number(wind.speed).toFixed(1) : '—'} m/s</p>
            </div>
            <div className="rounded-xl bg-white/60 px-3 py-2.5">
              <p className="flex items-center gap-2 text-xs text-text-dark/60">
                <DetailIcon name="gauge" /> Pressure
              </p>
              <p className="font-semibold">{main.pressure ?? '—'} hPa</p>
            </div>
            <div className="rounded-xl bg-white/60 px-3 py-2.5">
              <p className="flex items-center gap-2 text-xs text-text-dark/60">
                <DetailIcon name="eye" /> Visibility
              </p>
              <p className="font-semibold">{data.visibility != null ? (data.visibility / 1000).toFixed(1) : '—'} km</p>
            </div>
          </div>

          {sys.sunrise && sys.sunset && (
            <div className="mt-4 flex gap-4 border-t border-text-dark/10 pt-4 text-sm text-text-dark/80">
              <span>Sunrise {formatTime(sys.sunrise)}</span>
              <span>Sunset {formatTime(sys.sunset)}</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
