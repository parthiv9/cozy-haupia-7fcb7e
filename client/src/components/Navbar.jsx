import { useState } from 'react';
import { motion } from 'framer-motion';
import WeatherIcon from './WeatherIcon';
import MenuDrawer from './MenuDrawer';

export default function Navbar({
  currentWeather,
  currentLoading,
  currentError,
  onRetryLocation,
  onCurrentLocationClick,
  onOpenMap,
  onOpenFavorites,
  onOpenAbout,
  isNight = false,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const w = currentWeather?.weather?.[0];
  const main = currentWeather?.main || {};
  const hasWeather = currentWeather && !currentError;

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 w-full border-b border-white/25 bg-white/35 backdrop-blur-2xl"
      >
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/45 bg-white/55 text-text-dark shadow-sm transition hover:bg-white/80"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" />
              </svg>
            </button>
            <a
              href="#home"
              className="flex items-center gap-1.5 text-base font-bold tracking-tight text-text-dark sm:text-lg"
            >
              <span className="text-xl sm:text-2xl" aria-hidden>
                ✨
              </span>
              <span className="hidden min-[380px]:inline text-base sm:text-lg">Sky Cast</span>
            </a>
          </div>

          <div
            id="current-weather"
            className={`ml-auto flex items-center gap-2 ${hasWeather ? '' : 'rounded-xl bg-white/45 px-2 py-1 sm:px-3'}`}
          >
            {currentLoading && (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-end border-t-transparent sm:h-6 sm:w-6" />
                <span className="hidden text-xs text-text-dark/70 sm:inline sm:text-sm">Locating…</span>
              </>
            )}
            {currentError && !currentLoading && (
              <>
                <span className="max-w-[100px] truncate text-[10px] text-text-dark/70 sm:max-w-none sm:text-xs">
                  Location off
                </span>
                {onRetryLocation && (
                  <button
                    type="button"
                    onClick={onRetryLocation}
                    className="rounded-lg bg-primary-end px-2 py-1 text-[10px] font-medium text-white sm:text-xs"
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
                className="rounded-lg bg-primary-end px-2 py-1 text-xs font-medium text-white sm:px-3 sm:py-1.5"
              >
                Use location
              </button>
            )}
            {hasWeather && (
              <button
                type="button"
                onClick={onCurrentLocationClick}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/35 bg-white/50 px-2 py-1.5 text-left shadow-sm transition hover:bg-white/70 sm:gap-2.5 sm:px-3 sm:py-2"
                aria-label="Current location details"
              >
                <WeatherIcon
                  weather={w}
                  className="h-8 w-8 flex-shrink-0 sm:h-9 sm:w-9"
                  isNight={isNight}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-dark sm:text-base">
                    {main.temp != null ? `${Math.round(main.temp)}°` : '—'}
                  </p>
                  <p className="truncate text-[10px] text-text-dark/65 sm:text-xs">
                    {currentWeather.name || 'Here'}
                  </p>
                </div>
              </button>
            )}
          </div>
        </nav>
      </motion.header>

      <MenuDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenMap={onOpenMap}
        onOpenFavorites={onOpenFavorites}
        onOpenAbout={onOpenAbout}
        currentWeather={currentWeather}
      />
    </>
  );
}
