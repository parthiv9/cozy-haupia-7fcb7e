import { motion } from 'framer-motion';

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
  { key: 'feels', label: 'Feels like', get: (d) => d.main?.feels_like, fmt: (v) => (v != null ? `${Math.round(v)}°C` : '—') },
  { key: 'humidity', label: 'Humidity', get: (d) => d.main?.humidity, fmt: (v) => (v != null ? `${Math.round(v)}%` : '—') },
  { key: 'wind', label: 'Wind', get: (d) => d, fmt: (d) => formatWind(d.wind?.speed, d.wind?.deg) },
  { key: 'pressure', label: 'Pressure', get: (d) => d.main?.pressure, fmt: (v) => (v != null ? `${Math.round(v)} hPa` : '—') },
  { key: 'visibility', label: 'Visibility', get: (d) => d.visibility, fmt: formatVisibility },
  { key: 'uvi', label: 'UV index', get: (d) => d.uvi, fmt: (v) => (v != null ? String(v) : '—') },
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
      className="rounded-3xl glass-card-ultra p-6 sm:p-8"
    >
      <h2 className="mb-5 text-lg font-semibold tracking-tight text-app-fg">Weather details</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ key, label, get, fmt }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.04 * i, duration: 0.35 }}
            className="inset-tile-ultra rounded-2xl p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-app-fg/55">{label}</p>
            <p className="mt-1.5 text-lg font-semibold tabular-nums text-app-fg">{fmt(get(data))}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
