import { motion } from 'framer-motion';
import WeatherIcon from './WeatherIcon';
import Search from './Search';
import { useDayNight } from '../context/DayNightContext';

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

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="app-navbar sticky top-0 z-50 w-full overflow-visible border-b border-white/25 bg-white/45 backdrop-blur-2xl"
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-2 overflow-visible px-3 py-3 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 flex-shrink-0 items-center gap-2 sm:gap-3">
          {onOpenNavMenu && (
            <button
              type="button"
              onClick={onOpenNavMenu}
              className="nav-menu-trigger flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/45 bg-white/45 text-app-fg shadow-sm transition hover:bg-white/65 focus:outline-none focus:ring-2 focus:ring-sky-500/30 sm:h-11 sm:w-11"
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={navMenuOpen}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          )}
          <a
            href="#home"
            className="flex min-w-0 items-center gap-2 text-xl font-bold tracking-tight text-app-fg"
          >
            <span className="text-2xl" aria-hidden>
              🌤️
            </span>
            <span className="truncate">SkyCast</span>
          </a>
        </div>

        {onSearch && (
          <Search
            onSearch={onSearch}
            loading={searchLoading}
            layout="navbar"
            className="min-w-0"
            onClearSearch={onClearSearch}
            searchActive={searchActive}
          />
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
      </nav>
      {onSearch && (
        <div className="overflow-visible border-t border-white/15 bg-white/25 px-3 py-2.5 backdrop-blur-xl md:hidden">
          <Search
            onSearch={onSearch}
            loading={searchLoading}
            layout="bar"
            onClearSearch={onClearSearch}
            searchActive={searchActive}
          />
        </div>
      )}
    </motion.header>
  );
}
