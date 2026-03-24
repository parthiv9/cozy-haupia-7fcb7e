import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAppConfig } from '../config/loadConfig';

export function AboutPanel({ open, onClose }) {
  const cfg = getAppConfig();
  const target = typeof document !== 'undefined' ? document.body : null;
  if (!target) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[185] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            className="max-w-md rounded-3xl border border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-text-dark">About ℹ️</h2>
            <p className="mt-2 text-lg font-semibold text-primary-end">{cfg?.app?.name || 'SkyCast Ultra Pro Max'}</p>
            <p className="mt-1 text-sm text-text-dark/60">{cfg?.app?.tagline || 'Advanced Weather Intelligence'}</p>
            <p className="mt-4 text-sm text-text-dark/65">
              Built with React, Vite, Tailwind, Framer Motion, Leaflet. Weather from OpenWeatherMap (with key) or
              Open-Meteo (fallback). Radar via RainViewer.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-2xl bg-slate-900 py-3 font-semibold text-white"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    target
  );
}
