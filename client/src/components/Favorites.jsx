import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getFavorites, removeFavorite } from '../utils/storage';

export default function Favorites({ open, onClose, onSelectCity, favorites, onFavoritesChange }) {
  const list = favorites ?? getFavorites();

  const handleRemove = (e, id) => {
    e.stopPropagation();
    const next = removeFavorite(id);
    onFavoritesChange?.(next);
  };

  const target = typeof document !== 'undefined' ? document.body : null;
  if (!target) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[190] flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="favorites-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="max-h-[70vh] w-full max-w-md overflow-hidden rounded-3xl border border-white/30 bg-white/95 shadow-2xl backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4">
              <h2 id="favorites-title" className="text-lg font-bold text-text-dark">
                Saved cities
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-text-dark/70 hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {list.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-text-dark/55">
                  No saved cities yet. Search a place and tap ⭐ on the card below.
                </li>
              )}
              {list.map((f) => (
                <li key={f.id} className="mb-1">
                  <div className="flex items-center gap-2 rounded-2xl border border-transparent hover:border-sky-200/60 hover:bg-sky-50/50">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCity?.(f);
                        onClose();
                      }}
                      className="min-w-0 flex-1 px-4 py-3 text-left"
                    >
                      <p className="font-semibold text-text-dark">{f.name}</p>
                      {f.country && <p className="text-xs text-text-dark/50">{f.country}</p>}
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    target
  );
}
