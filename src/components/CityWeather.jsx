import { motion } from 'framer-motion';
import { Droplets, Star, Sunrise, Sunset, Wind } from 'lucide-react';
import WeatherIcon from './WeatherIcon';
import { computeIsNight } from '../utils/dayNight';

const ICON_STROKE = 2;

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MetricTile({ Icon, label, value, iconClassName = 'text-sky-600 app-night:text-sky-400' }) {
  return (
    <div className="inset-tile rounded-2xl p-3 sm:p-3.5">
      <div className="flex items-start gap-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/40 bg-white/35 shadow-sm backdrop-blur-sm app-night:border-white/15 app-night:bg-white/12"
          aria-hidden
        >
          <Icon className={`h-4 w-4 ${iconClassName}`} strokeWidth={ICON_STROKE} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-app-fg/55 sm:text-xs">{label}</p>
          <p className="mt-0.5 break-words text-sm font-bold tabular-nums text-app-fg sm:text-base">{value}</p>
        </div>
      </div>
    </div>
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
                <Star
                  className="h-5 w-5 shrink-0 fill-amber-500 text-amber-500"
                  strokeWidth={ICON_STROKE}
                  aria-hidden
                />
                Saved
              </>
            ) : (
              <>
                <Star className="h-5 w-5 shrink-0 text-app-fg/60" strokeWidth={ICON_STROKE} aria-hidden />
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
                  <Star
                    className="h-5 w-5 fill-amber-500 text-amber-500"
                    strokeWidth={ICON_STROKE}
                    aria-hidden
                  />
                </span>
              )}
            </div>
            <p className="capitalize text-app-fg/70">{w?.description || '—'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            Icon={Droplets}
            label="Humidity"
            value={main.humidity != null ? `${Math.round(main.humidity)}%` : '—'}
          />
          <MetricTile
            Icon={Wind}
            label="Wind"
            value={wind.speed != null ? `${Number(wind.speed).toFixed(1)} m/s` : '—'}
          />
          <MetricTile
            Icon={Sunrise}
            label="Sunrise"
            value={formatTime(sys.sunrise)}
            iconClassName="text-amber-600 app-night:text-amber-400"
          />
          <MetricTile
            Icon={Sunset}
            label="Sunset"
            value={formatTime(sys.sunset)}
            iconClassName="text-orange-600 app-night:text-orange-400"
          />
        </div>
      </div>
    </motion.section>
  );
}
