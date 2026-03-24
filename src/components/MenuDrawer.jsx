import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { useDayNight } from '../context/DayNightContext';
import { appName } from '../config/loadAppConfig';

import CameraSection from './CameraSection';
import UploadSection from './UploadSection';
import ContactsSection from './ContactsSection';

/**
 * Sidebar: camera, gallery upload, device contacts (Contact Picker).
 * Footer keeps map / saved cities modal / about.
 */
export default function MenuDrawer({ open, onClose, onOpenMap, onOpenSaved, onOpenAbout }) {
  const { isNight } = useDayNight();
  const brand = appName();

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

  const panel = isNight
    ? 'border-white/10 bg-slate-950/92 text-slate-100 shadow-2xl backdrop-blur-xl'
    : 'border-slate-200/80 bg-white/92 text-slate-900 shadow-2xl backdrop-blur-xl';

  const headerBorder = isNight ? 'border-white/10' : 'border-slate-200/80';
  const muted = isNight ? 'text-slate-400' : 'text-slate-500';
  const linkCard = isNight
    ? 'border-white/10 bg-white/[0.06] hover:bg-white/[0.1]'
    : 'border-slate-200/70 bg-white/70 hover:bg-sky-50/80';
  const closeBtn = isNight
    ? 'border-white/15 bg-white/10 text-slate-100 hover:bg-white/15'
    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50';
  const footerBtn = isNight
    ? 'border-white/15 bg-white/[0.08] text-slate-100 hover:bg-white/[0.12]'
    : 'border-slate-200/80 bg-white/80 text-slate-900 hover:bg-white';

  const headerActions = useMemo(
    () => [
      { key: 'map', label: 'Weather map', onClick: () => onOpenMap?.(), emoji: '🌍' },
      { key: 'saved', label: 'Saved cities', onClick: () => onOpenSaved?.(), emoji: '⭐' },
      { key: 'about', label: 'About', onClick: () => onOpenAbout?.(), emoji: 'ℹ️' },
    ],
    [onOpenAbout, onOpenSaved, onOpenMap]
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
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[85] bg-slate-950/50 backdrop-blur-sm"
            role="presentation"
            aria-hidden
            onClick={onClose}
          />

          <motion.aside
            key="menu-panel"
            initial={{ x: '-105%' }}
            animate={{ x: 0 }}
            exit={{ x: '-105%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`fixed left-0 top-0 z-[90] flex h-[100dvh] w-full max-w-md flex-col border-r ${panel}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-drawer-title"
          >
            <div className={`flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-5 ${headerBorder}`}>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#000000]">Menu</p>
                <h2 id="menu-drawer-title" className="mt-0.5 text-xl font-bold tracking-tight">
                  {brand}
                </h2>
                <p className="mt-1 text-xs text-[#000000]">Permissions, media, and contacts.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`flex-shrink-0 rounded-xl border p-2.5 transition ${closeBtn}`}
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4">
              <nav className={`mb-4 rounded-2xl border p-3 ${linkCard}`} aria-label="Dashboard shortcuts">
                <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${muted}`}>Dashboard</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    { href: '#home', label: 'Home' },
                    { href: '#forecast', label: 'Forecast' },
                    { href: '#weather-details', label: 'Details' },
                  ].map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={onClose}
                      className={`flex min-h-[44px] items-center justify-center rounded-xl border px-3 text-sm font-semibold transition ${
                        isNight
                          ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
                          : 'border-slate-200/80 bg-white/90 hover:bg-sky-50'
                      }`}
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
                <div className="mt-4 space-y-3">
                  <CameraSection isNight={isNight} />
                  <UploadSection isNight={isNight} />
                  <ContactsSection isNight={isNight} />
                </div>
              </nav>

              <p className={`mt-2 rounded-2xl border px-3 py-2 text-[11px] leading-relaxed ${muted} ${isNight ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200/60 bg-slate-50/80'}`}>
                Camera may ask for access. Contacts use your system contact list when the browser supports it — allow
                contact access if prompted, or enable it in site settings if access was denied.
              </p>
            </div>

            <div className={`border-t px-4 py-3 sm:px-5 ${headerBorder}`}>
              <div className="flex flex-wrap gap-2">
                {headerActions.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => {
                      a.onClick();
                      onClose();
                    }}
                    className={`flex min-h-[44px] min-w-[6.5rem] flex-1 items-center justify-center gap-1 rounded-2xl border px-3 py-2.5 text-xs font-semibold transition sm:text-sm ${footerBtn}`}
                  >
                    <span aria-hidden>{a.emoji}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    target
  );
}
