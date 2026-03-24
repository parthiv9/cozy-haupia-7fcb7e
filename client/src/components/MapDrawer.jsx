import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SECTIONS = [
  {
    title: 'Menu',
    items: [
      { id: 'map', label: 'Weather map', emoji: '🌍', desc: 'Layers & tap for conditions' },
      { id: 'favorites', label: 'Saved cities', emoji: '⭐', desc: 'Quick access from storage' },
      { id: 'about', label: 'About', emoji: 'ℹ️', desc: 'SkyCast' },
    ],
  },
];

export default function MapDrawer({
  open,
  onClose,
  onOpenMap,
  onOpenFavorites,
  onOpenAbout,
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleItem = (id) => {
    if (id === 'map') onOpenMap?.();
    if (id === 'favorites') onOpenFavorites?.();
    if (id === 'about') onOpenAbout?.();
    onClose();
  };

  const target = typeof document !== 'undefined' ? document.body : null;
  if (!target) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/45 backdrop-blur-[3px]"
            role="presentation"
            onClick={onClose}
          />
          <motion.aside
            key="drawer-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 top-0 z-[70] flex h-full w-full max-w-sm flex-col border-r border-white/20 bg-white/90 shadow-2xl backdrop-blur-2xl"
            aria-label="Main menu"
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Menu
                </p>
                <h2 className="text-lg font-bold text-text-dark">SkyCast Ultra</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white p-2 text-text-dark shadow-sm hover:bg-slate-50"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {SECTIONS.map((section) => (
                <div key={section.title} className="mb-6">
                  <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </p>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleItem(item.id)}
                          className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-sky-500/10"
                        >
                          <span className="text-xl" aria-hidden>
                            {item.emoji}
                          </span>
                          <span>
                            <span className="block font-semibold text-text-dark">{item.label}</span>
                            <span className="text-xs text-text-dark/55">{item.desc}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
            <footer className="border-t border-slate-200/80 px-4 py-3 text-center text-[10px] text-slate-400">
              Pro Max · Scalable menu sections
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    target
  );
}
