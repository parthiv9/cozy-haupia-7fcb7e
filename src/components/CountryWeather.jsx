import { motion } from 'framer-motion';
import WeatherIcon from './WeatherIcon';
import { computeIsNight } from '../utils/dayNight';

export default function CountryWeather({ countryName, cities }) {
  if (!countryName || !cities?.length) return null;

  return (
    <motion.section
      id="country-weather"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl glass-card p-6 sm:p-8"
    >
      <h2 className="mb-4 text-lg font-semibold text-app-fg">
        Major cities — {countryName}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cities.map((city, i) => {
          const w = city.weather?.[0];
          const temp = city.main?.temp ?? '—';
          return (
            <motion.div
              key={city.name + i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="inset-tile p-4"
            >
              <p className="font-semibold text-app-fg">{city.name}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="temp-display-sm">{typeof temp === 'number' ? Math.round(temp) : temp}°C</span>
                <WeatherIcon weather={w} className="h-10 w-10" isNight={computeIsNight(city)} />
              </div>
              <p className="mt-1 text-sm capitalize text-app-fg/70">
                {w?.description || '—'}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
