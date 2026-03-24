import { motion } from 'framer-motion';
import WeatherIcon from './WeatherIcon';
import { roundTemp } from '../utils/helpers';

/**
 * Compact glass card for metrics or list tiles.
 */
export default function WeatherCard({
  title,
  subtitle,
  temp,
  value,
  weather,
  isNight = false,
  className = '',
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.35 }}
      className={`rounded-2xl border border-white/30 bg-white/45 p-4 shadow-lg backdrop-blur-xl ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {title && <p className="text-xs font-semibold uppercase tracking-wider text-slate-900/50">{title}</p>}
          {subtitle && <p className="mt-1 truncate text-sm font-medium text-slate-900">{subtitle}</p>}
          {temp != null && (
            <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{roundTemp(temp)}°</p>
          )}
          {temp == null && value != null && value !== '' && (
            <p className="mt-2 text-xl font-bold tabular-nums text-slate-900">{value}</p>
          )}
        </div>
        {weather && <WeatherIcon weather={weather} className="h-14 w-14 flex-shrink-0" isNight={isNight} />}
      </div>
    </motion.div>
  );
}
