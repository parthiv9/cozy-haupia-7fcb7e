import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudSun, Menu, Search as SearchIcon } from 'lucide-react';
import WeatherIcon from './WeatherIcon';
import Search from './Search';
import { useDayNight } from '../context/DayNightContext';
import { navigateToHash } from '../utils/smoothScroll';
import { scheduleAfterPaint } from '../utils/scheduleUIWork';

const ICON_STROKE = 2;

export default function Navbar({
  currentWeather,
  currentLoading,
  currentError,
  onRetryLocation,
  onCurrentLocationClick,
  isNight: isNightProp,
  onOpenNavMenu,
  navMenuOpen = false,
  onSearch,
  searchLoading = false,
  onClearSearch,
  searchActive = false,
}) {
  const { isNight: isNightCtx } = useDayNight();
  const isNight = isNightProp ?? isNightCtx;
  const w = currentWeather?.weather?.[0];
  const main = currentWeather?.main || {};
  const hasWeather = currentWeather && !currentError;

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileQueryPrev = useRef('');

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e) => {
      if (e.matches) setMobileSearchOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const closeMobileSearch = useCallback(() => {
    setMobileSearchOpen(false);
    mobileQueryPrev.current = '';
  }, []);

  const handleMobileQuerySync = useCallback(
    (q) => {
      if (!mobileSearchOpen) {
        mobileQueryPrev.current = q;
        return;
      }
      const prev = mobileQueryPrev.current;
      mobileQueryPrev.current = q;
      if (prev.trim() !== '' && q.trim() === '') setMobileSearchOpen(false);
    },
    [mobileSearchOpen]
  );

  const openMobileSearch = () => {
    mobileQueryPrev.current = '';
    scheduleAfterPaint(() => startTransition(() => setMobileSearchOpen(true)));
  };

  const showMobileSearchUi = Boolean(onSearch);
  const hideLogoMobile = showMobileSearchUi && mobileSearchOpen;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="app-navbar sticky top-0 z-[9999] w-full overflow-visible border-b border-white/25 bg-white/45 backdrop-blur-2xl"
    >
      <nav className="mx-auto flex w-full max-w-6xl items-center gap-2 overflow-visible px-3 py-3 sm:gap-3 sm:px-6 md:justify-between">
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          {onOpenNavMenu && (
            <button
              type="button"
              onClick={onOpenNavMenu}
              className="app-navbar-icon-btn flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/45 bg-white/45 text-app-fg shadow-sm transition hover:bg-white/65 focus:outline-none focus:ring-2 focus:ring-sky-500/30 sm:h-11 sm:w-11"
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={navMenuOpen}
            >
              <Menu className="h-5 w-5" strokeWidth={ICON_STROKE} aria-hidden />
            </button>
          )}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              navigateToHash('#home');
            }}
            className={`min-w-0 items-center gap-2 text-xl font-bold tracking-tight text-app-fg transition-opacity duration-200 ease-out motion-reduce:transition-none ${
              hideLogoMobile ? 'hidden md:flex' : 'flex'
            }`}
          >
            <CloudSun className="h-7 w-7 shrink-0 text-app-fg" strokeWidth={ICON_STROKE} aria-hidden />
            <span className="truncate">SkyCast</span>
          </a>
        </div>

        {onSearch && (
          <div className="mx-2 hidden min-w-0 max-w-xl flex-1 md:block">
            <Search
              onSearch={onSearch}
              loading={searchLoading}
              layout="navbar"
              onClearSearch={onClearSearch}
              searchActive={searchActive}
            />
          </div>
        )}

        <AnimatePresence initial={false}>
          {onSearch && mobileSearchOpen ? (
            <motion.div
              key="mobile-search"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0 flex-1 md:hidden"
            >
              <Search
                onSearch={(q) => {
                  onSearch?.(q);
                  setMobileSearchOpen(false);
                }}
                loading={searchLoading}
                layout="navbarMobileExpanded"
                className="!mx-0 !px-0 sm:!mx-0"
                onClearSearch={onClearSearch}
                searchActive={searchActive}
                autoFocus
                onMobileHeaderClose={closeMobileSearch}
                onQuerySync={handleMobileQuerySync}
              />
            </motion.div>
          ) : onSearch ? (
            <div key="mobile-spacer" className="min-w-0 flex-1 md:hidden" aria-hidden />
          ) : null}
        </AnimatePresence>

        <div className="ml-auto flex flex-shrink-0 items-center gap-2">
          {onSearch && (
            <button
              type="button"
              className={`app-navbar-icon-btn flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/45 bg-white/45 text-app-fg shadow-sm transition hover:bg-white/65 focus:outline-none focus:ring-2 focus:ring-sky-500/30 sm:h-11 sm:w-11 md:hidden motion-reduce:transition-none ${
                mobileSearchOpen ? 'hidden' : ''
              }`}
              aria-label="Open search"
              aria-expanded={mobileSearchOpen}
              aria-controls="navbar-search-mobile"
              onClick={openMobileSearch}
            >
              <SearchIcon className="h-5 w-5" strokeWidth={ICON_STROKE} aria-hidden />
            </button>
          )}

          <div
            id="current-weather"
            className={`flex flex-shrink-0 items-center gap-2 ${hasWeather ? '' : 'app-navbar-pill rounded-xl bg-white/55 px-2 py-1.5 sm:px-3 sm:py-2'}`}
          >
            {currentLoading && (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-500 border-t-transparent sm:h-6 sm:w-6" />
                <span className="hidden text-xs text-app-fg/70 sm:inline sm:text-sm">Loading…</span>
              </>
            )}
            {currentError && !currentLoading && (
              <>
                <span className="hidden text-xs text-app-fg/70 sm:inline sm:text-sm">Location</span>
                {onRetryLocation && (
                  <button
                    type="button"
                    onClick={onRetryLocation}
                    className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-2 py-1 text-xs font-medium text-white sm:px-2.5 sm:py-1.5 sm:text-sm"
                  >
                    Retry
                  </button>
                )}
              </>
            )}
            {!currentWeather && !currentLoading && !currentError && onRetryLocation && (
              <button
                type="button"
                onClick={onRetryLocation}
                className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-2 py-1 text-xs font-medium text-white sm:px-2.5 sm:py-1.5 sm:text-sm"
              >
                Locate
              </button>
            )}
            {hasWeather && (
              <button
                type="button"
                onClick={onCurrentLocationClick}
                className="app-navbar-pill flex cursor-pointer items-center gap-2 rounded-xl bg-white/55 px-2 py-1.5 text-left transition hover:bg-white/75 sm:gap-2.5 sm:px-3 sm:py-2"
                aria-label="View detailed weather for current location"
              >
                <WeatherIcon weather={w} className="h-8 w-8 flex-shrink-0 sm:h-9 sm:w-9" isNight={isNight} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-app-fg sm:text-base">
                    {main.temp != null ? `${Math.round(main.temp)}°` : '—'}
                  </p>
                  <p className="hidden max-w-[7rem] truncate text-xs text-app-fg/65 sm:block sm:text-sm">
                    {currentWeather.name || 'Here'}
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>
      </nav>
    </motion.header>
  );
}
