import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getFavoriteCities, removeFavoriteCity } from '../utils/storage';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import {
  modalBackdropTransition,
  modalPanelSlidePx,
  modalPanelSpring,
} from '../config/uiMotion';

/**
 * Saved cities panel (opened from menu). Tap a city → parent loads weather and scrolls home.
 */
export default function SettingsModal({ open, onClose, onSelectSavedCity, listRevision = 0, onListChange }) {
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (open) setCities(getFavoriteCities());
  }, [open, listRevision]);

  const handleRemove = (e, id) => {
    e.stopPropagation();
    removeFavoriteCity(id);
    setCities(getFavoriteCities());
    onListChange?.();
  };

  const target = typeof document !== 'undefined' ? document.body : null;
  if (!target) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="settings-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="saved-cities-modal-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: modalPanelSlidePx }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: modalPanelSlidePx }}
            transition={modalPanelSpring}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[min(90dvh,100%)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/30 bg-white/92 text-slate-900 shadow-2xl backdrop-blur-xl"
          >
            <div className="shrink-0 border-b border-slate-200/80 px-5 py-4">
              <h2 id="saved-cities-modal-title" className="text-xl font-bold">
                Saved cities
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Tap a city to load the home dashboard with forecast and details. Add places with{' '}
                <strong>Save to favorites</strong> after a search.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              <ul className="space-y-1">
                {cities.length === 0 && (
                  <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
                    No saved cities yet. Search for a city, then tap <strong>Save to favorites</strong> on the city card.
                  </li>
                )}
                {cities.map((f) => (
                  <li key={f.id}>
                    <div className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/60 hover:border-sky-200 hover:bg-sky-50/40">
                      <button
                        type="button"
                        onClick={() => onSelectSavedCity?.(f)}
                        className="min-w-0 flex-1 px-4 py-3 text-left"
                      >
                        <p className="font-semibold text-slate-900">{f.name}</p>
                        {f.country ? <p className="text-xs text-slate-500">{f.country}</p> : null}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleRemove(e, f.id)}
                        className="mr-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                        aria-label={`Remove ${f.name}`}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-slate-200/80 px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-slate-800 py-2.5 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    target
  );
}
