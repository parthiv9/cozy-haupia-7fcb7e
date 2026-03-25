import { motion } from 'framer-motion';
import { Droplets, Eye, Gauge, Sunrise, Sunset, Thermometer, Wind, X } from 'lucide-react';
import WeatherIcon from './WeatherIcon';
import { computeIsNight } from '../utils/dayNight';
import { getWeatherBackgroundSlug } from '../utils/weatherApi';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { modalBackdropTransition, modalPanelSlidePx, modalPanelSpring } from '../config/uiMotion';

const ICON_STROKE = 2;

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MetricTile({ Icon, label, value }) {
  return (
    <div className="inset-tile rounded-2xl p-3 sm:p-3.5">
      <div className="flex items-start gap-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/40 bg-white/35 shadow-sm backdrop-blur-sm sm:h-9 sm:w-9 app-night:border-white/15 app-night:bg-white/12"
          aria-hidden
        >
          <Icon className="h-4 w-4 text-sky-600 sm:h-[18px] sm:w-[18px] app-night:text-sky-400" strokeWidth={ICON_STROKE} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-app-fg/55 sm:text-xs">{label}</p>
          <p className="mt-0.5 break-words text-sm font-bold tabular-nums text-app-fg sm:text-base">{value}</p>
        </div>
      </div>
    </div>
  );
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

export default function LocationDetailModal({ data, onClose }) {
  useBodyScrollLock(Boolean(data));

  if (!data) return null;

  const isNightIcon = computeIsNight(data);

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
      transition={modalBackdropTransition}
      onClick={onClose}
      className="location-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md"
      aria-modal="true"
      role="dialog"
      aria-labelledby="location-detail-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: modalPanelSlidePx }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: modalPanelSlidePx }}
        transition={modalPanelSpring}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
      >
        {/* Blurred weather-matched background */}
        <div
          className="absolute inset-0 blur-2xl scale-110"
          style={{ background: gradient }}
          aria-hidden="true"
        />
        <div className="location-modal-frost absolute inset-0 bg-white/75 backdrop-blur-md" aria-hidden="true" />
        {/* Content */}
        <div className="relative z-10 p-6 text-app-fg">
          <div className="flex items-start justify-between gap-4">
            <h2 id="location-detail-title" className="text-lg font-semibold text-app-fg">
              Current location
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="location-modal-hit rounded-lg p-1.5 text-app-fg/70 transition hover:bg-white/80 hover:text-app-fg"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={ICON_STROKE} aria-hidden />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <WeatherIcon weather={w} className="h-16 w-16 flex-shrink-0 sm:h-20 sm:w-20" isNight={isNightIcon} />
            <div>
              <p className="text-2xl font-bold text-app-fg sm:text-3xl">
                {main.temp != null ? Math.round(main.temp) : '—'}°C
              </p>
              <p className="font-medium text-app-fg/90">{data.name}</p>
              <p className="capitalize text-app-fg/70">{w?.description || '—'}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <MetricTile
              Icon={Thermometer}
              label="Feels like"
              value={main.feels_like != null ? `${Math.round(main.feels_like)}°C` : '—'}
            />
            <MetricTile Icon={Droplets} label="Humidity" value={main.humidity != null ? `${Math.round(main.humidity)}%` : '—'} />
            <MetricTile
              Icon={Wind}
              label="Wind"
              value={wind.speed != null ? `${Number(wind.speed).toFixed(1)} m/s` : '—'}
            />
            <MetricTile
              Icon={Gauge}
              label="Pressure"
              value={main.pressure != null ? `${Math.round(main.pressure)} hPa` : '—'}
            />
            <MetricTile
              Icon={Eye}
              label="Visibility"
              value={data.visibility != null ? `${(data.visibility / 1000).toFixed(1)} km` : '—'}
            />
          </div>

          {sys.sunrise && sys.sunset && (
            <div className="mt-4 border-t border-app-fg/10 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                <div className="flex items-center gap-2.5 text-sm text-app-fg/85">
                  <Sunrise className="h-4 w-4 shrink-0 text-amber-600 app-night:text-amber-400" strokeWidth={ICON_STROKE} aria-hidden />
                  <span>
                    <span className="font-semibold text-app-fg">Sunrise</span>{' '}
                    <span className="tabular-nums text-app-fg/80">{formatTime(sys.sunrise)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-app-fg/85">
                  <Sunset className="h-4 w-4 shrink-0 text-orange-600 app-night:text-orange-400" strokeWidth={ICON_STROKE} aria-hidden />
                  <span>
                    <span className="font-semibold text-app-fg">Sunset</span>{' '}
                    <span className="tabular-nums text-app-fg/80">{formatTime(sys.sunset)}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
