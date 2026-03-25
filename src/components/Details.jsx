import { motion } from 'framer-motion';
import { Droplets, Eye, Gauge, Sun, Thermometer, Wind } from 'lucide-react';

const ICON_STROKE = 2;

function formatVisibility(meters) {
  if (meters == null || !Number.isFinite(Number(meters))) return '—';
  const m = Number(meters);
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

function formatWind(speedMs, deg) {
  const s = speedMs != null && Number.isFinite(Number(speedMs)) ? Number(speedMs) : null;
  const d = deg != null && Number.isFinite(Number(deg)) ? Math.round(Number(deg)) : null;
  if (s == null && d == null) return '—';
  const parts = [];
  if (s != null) parts.push(`${s.toFixed(1)} m/s`);
  if (d != null) parts.push(`${d}°`);
  return parts.join(' · ');
}

const items = [
  {
    key: 'feels',
    label: 'Feels like',
    Icon: Thermometer,
    get: (d) => d.main?.feels_like,
    fmt: (v) => (v != null ? `${Math.round(v)}°C` : '—'),
  },
  {
    key: 'humidity',
    label: 'Humidity',
    Icon: Droplets,
    get: (d) => d.main?.humidity,
    fmt: (v) => (v != null ? `${Math.round(v)}%` : '—'),
  },
  {
    key: 'wind',
    label: 'Wind',
    Icon: Wind,
    get: (d) => d,
    fmt: (d) => formatWind(d.wind?.speed, d.wind?.deg),
  },
  {
    key: 'pressure',
    label: 'Pressure',
    Icon: Gauge,
    get: (d) => d.main?.pressure,
    fmt: (v) => (v != null ? `${Math.round(v)} hPa` : '—'),
  },
  {
    key: 'visibility',
    label: 'Visibility',
    Icon: Eye,
    get: (d) => d.visibility,
    fmt: formatVisibility,
  },
  {
    key: 'uvi',
    label: 'UV index',
    Icon: Sun,
    get: (d) => d.uvi,
    fmt: (v) => (v != null ? String(v) : '—'),
  },
];

export default function Details({ data }) {
  if (!data) return null;

  return (
    <motion.section
      id="weather-details"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="rounded-3xl glass-card-ultra p-5 sm:p-7"
    >
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-app-fg sm:mb-5">Weather details</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {items.map(({ key, label, Icon, get, fmt }, i) => {
          const raw = get(data);
          const value = fmt(raw);
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.04 * i, duration: 0.35 }}
              className="inset-tile-ultra rounded-2xl p-3.5 sm:p-4"
            >
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/35 bg-white/30 shadow-sm backdrop-blur-sm sm:h-10 sm:w-10 app-night:border-white/12 app-night:bg-white/10"
                  aria-hidden
                >
                  <Icon
                    className="h-[18px] w-[18px] text-sky-600 sm:h-5 sm:w-5 app-night:text-sky-400"
                    strokeWidth={ICON_STROKE}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-app-fg/55 sm:text-xs sm:tracking-wide">
                    {label}
                  </p>
                  <p className="mt-1 break-words text-base font-bold tabular-nums leading-snug text-app-fg sm:text-lg">
                    {value}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
