import { motion } from 'framer-motion';
import DetailIcon from './DetailIcon';

const items = [
  {
    key: 'feels_like',
    label: 'Feels like',
    icon: 'thermometer',
    format: (v) => (v != null ? `${Math.round(v)}°C` : '—'),
  },
  {
    key: 'humidity',
    label: 'Humidity',
    icon: 'droplet',
    format: (v) => (v != null ? `${Math.round(v)}%` : '—'),
  },
  {
    key: 'windSpeed',
    label: 'Wind',
    icon: 'wind',
    format: (v) => (v != null ? `${Number(v).toFixed(1)} m/s` : '—'),
  },
  {
    key: 'pressure',
    label: 'Pressure',
    icon: 'gauge',
    format: (v) => (v != null ? `${v} hPa` : '—'),
  },
  {
    key: 'visibility',
    label: 'Visibility',
    icon: 'eye',
    format: (v) => {
      if (v == null) return '—';
      const km = v >= 1000 ? (v / 1000).toFixed(1) : Number(v).toFixed(1);
      return `${km} km`;
    },
  },
  {
    key: 'windDeg',
    label: 'Wind direction',
    icon: 'compass',
    format: (v) => (v != null ? `${Math.round(v)}°` : '—'),
  },
];

export default function Details({ data }) {
  if (!data) return null;

  const main = data.main || {};
  const wind = data.wind || {};
  const values = {
    feels_like: main.feels_like,
    humidity: main.humidity,
    windSpeed: wind.speed,
    pressure: main.pressure,
    visibility: data.visibility,
    windDeg: wind.deg,
  };

  return (
    <motion.section
      id="weather-details"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45 }}
      className="rounded-3xl border border-white/30 bg-white/40 p-6 shadow-glass backdrop-blur-2xl sm:p-8"
    >
      <h2 className="mb-5 text-lg font-semibold text-text-dark">Conditions</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ key, label, icon, format }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 * i, duration: 0.35 }}
            whileHover={{ scale: 1.02 }}
            className="rounded-2xl border border-white/25 bg-white/50 p-4 backdrop-blur-md"
          >
            <p className="flex items-center gap-2 text-xs font-medium text-text-dark/55">
              <DetailIcon name={icon} />
              {label}
            </p>
            <p className="mt-2 text-lg font-semibold tabular-nums text-text-dark">{format(values[key])}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
