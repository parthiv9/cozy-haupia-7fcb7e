import { motion } from 'framer-motion';
import WeatherIcon from './WeatherIcon';

export default function WeatherCards({ items, title }) {
  if (!items?.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl glass-card p-6 sm:p-8"
    >
      {title && (
        <h2 className="mb-4 text-lg font-semibold text-text-dark">{title}</h2>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const w = item.weather?.[0];
          const main = item.main || {};
          return (
            <motion.div
              key={item.name + i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i }}
              whileHover={{ y: -4 }}
              className="rounded-xl bg-white/50 p-4"
            >
              <p className="font-semibold text-text-dark">{item.name}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-2xl font-bold text-text-dark">
                  {Math.round(main.temp ?? 0)}°C
                </span>
                <WeatherIcon
                  weather={w}
                  className="h-12 w-12 text-text-dark"
                />
              </div>
              <p className="mt-1 text-sm capitalize text-text-dark/70">
                {w?.description || '—'}
              </p>
              {main.humidity != null && (
                <p className="mt-1 text-xs text-text-dark/60">Humidity {main.humidity}%</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
