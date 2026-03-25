import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { NAV_MENU_SECTIONS } from '../config/navMenuConfig';
import { NavMenuIcon } from '../config/navMenuIcons';
import { useDayNight } from '../context/DayNightContext';
import { appName } from '../config/loadAppConfig';
import { navigateToHash } from '../utils/smoothScroll';
import { drawerBackdropTransition, drawerSpring } from '../config/uiMotion';

const ICON_STROKE = 2;

/**
 * Scalable side drawer — sections from `navMenuConfig.js`, actions from `actionHandlers`.
 */
export default function MapDrawer({ open, onClose, actionHandlers = {} }) {
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
    ? 'border-white/10 bg-slate-950/95 text-slate-100 shadow-2xl backdrop-blur-xl'
    : 'border-slate-200/80 bg-white/95 text-slate-900 shadow-2xl backdrop-blur-xl';

  const headerBorder = isNight ? 'border-white/10' : 'border-slate-200/80';
  const muted = isNight ? 'text-slate-400' : 'text-slate-500';
  const sectionTitle = isNight ? 'text-slate-200' : 'text-slate-800';
  const itemBase = isNight
    ? 'border-white/5 bg-white/[0.04] hover:bg-white/[0.08]'
    : 'border-slate-200/60 bg-slate-50/80 hover:bg-sky-50/90';
  const itemDisabled = isNight ? 'opacity-45 border-white/5' : 'opacity-50 border-slate-100';
  const closeBtn = isNight
    ? 'border-white/15 bg-white/10 text-slate-100 hover:bg-white/15'
    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50';

  const handleItemClick = (item) => {
    if (item.disabled) return;
    if (item.href) {
      onClose();
      return;
    }
    if (item.action) {
      const fn = actionHandlers[item.action];
      if (typeof fn === 'function') fn();
      onClose();
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={drawerBackdropTransition}
            className="fixed inset-0 z-[85] bg-slate-950/45 backdrop-blur-sm"
            role="presentation"
            aria-hidden
            onClick={onClose}
          />

          <motion.aside
            key="drawer-panel"
            initial={{ x: '-105%' }}
            animate={{ x: 0 }}
            exit={{ x: '-105%' }}
            transition={drawerSpring}
            className={`fixed left-0 top-0 z-[90] flex h-full w-full max-w-md flex-col border-r ${panel}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-drawer-title"
          >
            <div className={`flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-5 ${headerBorder}`}>
              <div className="min-w-0">
                <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${muted}`}>Menu</p>
                <h2 id="map-drawer-title" className="mt-0.5 text-xl font-bold tracking-tight">
                  {brand}
                </h2>
                <p className={`mt-1 text-xs ${muted}`}>Weather map and dashboard sections.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`flex-shrink-0 rounded-xl border p-2.5 transition ${closeBtn}`}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" strokeWidth={ICON_STROKE} aria-hidden />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4" aria-label="Main menu">
              <div className="space-y-8">
                {NAV_MENU_SECTIONS.map((section) => (
                  <section key={section.id} aria-labelledby={`drawer-section-${section.id}`}>
                    <div className="mb-2 px-1">
                      <h3 id={`drawer-section-${section.id}`} className={`text-sm font-semibold ${sectionTitle}`}>
                        {section.title}
                      </h3>
                      {section.subtitle && (
                        <p className={`mt-0.5 text-xs font-medium ${muted}`}>{section.subtitle}</p>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {section.items.map((item) => {
                        const isLink = Boolean(item.href) && !item.disabled;
                        const content = (
                          <>
                            {item.icon && (
                              <NavMenuIcon
                                id={item.icon}
                                className={item.disabled ? 'opacity-60' : isNight ? 'text-sky-400' : 'text-sky-600'}
                              />
                            )}
                            <span className="min-w-0 flex-1 text-left">
                              <span className="flex items-center gap-2">
                                <span className="font-semibold">{item.label}</span>
                                {item.badge && (
                                  <span
                                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                      isNight ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-800'
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </span>
                              {item.description && (
                                <span className={`mt-0.5 block text-xs font-normal ${muted}`}>{item.description}</span>
                              )}
                            </span>
                          </>
                        );

                        if (isLink) {
                          return (
                            <li key={item.id}>
                              <a
                                href={item.href}
                                onClick={(e) => {
                                  e.preventDefault();
                                  onClose();
                                  navigateToHash(item.href);
                                }}
                                className={`flex items-start gap-3 rounded-xl border px-3 py-3 transition ${itemBase}`}
                              >
                                {content}
                              </a>
                            </li>
                          );
                        }

                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              disabled={item.disabled}
                              onClick={() => handleItemClick(item)}
                              className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                                item.disabled ? itemDisabled : itemBase
                              } ${!item.disabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                            >
                              {content}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            </nav>

            <footer className={`border-t px-4 py-3 sm:px-5 ${headerBorder}`}>
              <p className={`text-center text-[11px] ${muted}`}>
                Tune defaults in{' '}
                <code className={`rounded px-1 ${isNight ? 'bg-white/10' : 'bg-black/[0.06]'}`}>src/config/config.yaml</code>
              </p>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    target
  );
}
