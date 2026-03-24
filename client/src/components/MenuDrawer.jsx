import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

import CameraSection from './CameraSection';
import UploadSection from './UploadSection';
import ContactsSection from './ContactsSection';

export default function MenuDrawer({
  open,
  onClose,
  onOpenMap,
  onOpenFavorites,
  onOpenAbout,
  currentWeather,
}) {
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);
  const contactsRef = useRef(null);

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

  const target = typeof document !== 'undefined' ? document.body : null;
  if (!target) return null;

  const headerActions = useMemo(
    () => [
      { key: 'map', label: 'Weather map', onClick: () => onOpenMap?.(), emoji: '🌍' },
      { key: 'favorites', label: 'Saved cities', onClick: () => onOpenFavorites?.(), emoji: '⭐' },
      { key: 'about', label: 'About', onClick: () => onOpenAbout?.(), emoji: 'ℹ️' },
    ],
    [onOpenAbout, onOpenFavorites, onOpenMap]
  );

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/45 backdrop-blur-[3px]"
            role="presentation"
            onClick={onClose}
          />

          <motion.aside
            key="menu-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 top-0 z-[70] flex h-full w-full max-w-sm flex-col border-r border-white/20 bg-white/90 shadow-2xl backdrop-blur-2xl"
            aria-label="Menu drawer"
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Menu</p>
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

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <div ref={cameraRef}>
                <CameraSection />
              </div>
              <div ref={uploadRef}>
                <UploadSection />
              </div>
              <div ref={contactsRef}>
                <ContactsSection />
              </div>
            </div>

            <div className="border-t border-slate-200/80 px-4 py-3">
              <div className="flex gap-2">
                {headerActions.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => {
                      a.onClick();
                      onClose();
                    }}
                    className="flex-1 rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-sm font-semibold text-text-dark shadow-inner transition hover:bg-white/90"
                  >
                    <span aria-hidden className="mr-2">
                      {a.emoji}
                    </span>
                    {a.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-400">Pro Max · Glass UI · Permissions</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    target
  );
}

