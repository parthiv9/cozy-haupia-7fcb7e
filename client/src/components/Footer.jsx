import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="mt-16 border-t border-white/20 bg-white/30 py-8 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-6xl px-4 text-center text-sm text-text-dark/80 sm:px-6">
        <p className="font-medium">SkyCast</p>
        <p className="mt-1">OpenWeatherMap + Open-Meteo · React · Vite · Leaflet</p>
      </div>
    </motion.footer>
  );
}
