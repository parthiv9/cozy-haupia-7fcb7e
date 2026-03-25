import { useState, useEffect, useCallback, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DayNightProvider } from './context/DayNightContext';
import { useIsNight } from './hooks/useIsNight';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NewsSection from './components/NewsSection';
import LocationDetailModal from './components/LocationDetailModal';
import MenuDrawer from './components/MenuDrawer';
import CurrentWeather from './components/CurrentWeather';
import CityWeather from './components/CityWeather';
import CountryWeather from './components/CountryWeather';
import Forecast from './components/Forecast';
import Details from './components/Details';
import WeatherMap from './components/WeatherMap';
import SettingsModal from './components/SettingsModal';
import SavedCities from './components/SavedCities';
import WeatherBackgroundLayers from './components/WeatherBackgroundLayers';
import {
  getWeatherByCoords,
  getWeatherByCity,
  getForecastByCoords,
  getForecastByCity,
  getCitiesByCountry,
  getWeatherBackgroundSlug,
  getWeatherMoodClass,
} from './utils/weatherApi';
import { requestLocationPermission } from './utils/locationService';
import { addFavoriteCity, getFavoriteCities, isFavoriteCityMatch } from './utils/storage';
import { appConfig, appName } from './config/loadAppConfig';
import { navigateToHash } from './utils/smoothScroll';
import { scheduleAfterPaint } from './utils/scheduleUIWork';

export default function App() {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [currentLoading, setCurrentLoading] = useState(true);
  const [currentError, setCurrentError] = useState(null);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchedCity, setSearchedCity] = useState(null);
  const [searchCountry, setSearchCountry] = useState(null);
  const [searchCountryName, setSearchCountryName] = useState('');

  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [showLocationDetail, setShowLocationDetail] = useState(false);
  const [weatherMapOpen, setWeatherMapOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** Bumps when favorites change so Settings → Saved cities list refreshes */
  const [savedListRevision, setSavedListRevision] = useState(0);
  const [favoritesList, setFavoritesList] = useState(() => getFavoriteCities());

  const loadCurrentLocation = useCallback(async () => {
    setCurrentLoading(true);
    setCurrentError(null);
    try {
      const { lat, lon } = await requestLocationPermission();
      const data = await getWeatherByCoords(lat, lon);
      setCurrentWeather(data);
      const forecast = await getForecastByCoords(lat, lon);
      setForecastData(forecast);
    } catch (err) {
      setCurrentError(err.userMessage || err.message || 'Could not get location');
      try {
        const fallbackCity = appConfig?.defaults?.fallback_city || 'London';
        const fallback = await getWeatherByCity(fallbackCity);
        setCurrentWeather(fallback);
        setCurrentError(null);
        const lat = fallback.coord?.lat;
        const lon = fallback.coord?.lon;
        if (lat != null && lon != null) {
          const forecast = await getForecastByCoords(lat, lon);
          setForecastData(forecast);
        }
      } catch {
        setCurrentWeather(null);
        setForecastData(null);
      }
    } finally {
      setCurrentLoading(false);
      setForecastLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentLocation();
  }, [loadCurrentLocation]);

  useEffect(() => {
    setFavoritesList(getFavoriteCities());
  }, [savedListRevision]);

  const loadForecastForCoords = useCallback(async (lat, lon) => {
    setForecastLoading(true);
    try {
      const data = await getForecastByCoords(lat, lon);
      setForecastData(data);
    } catch {
      setForecastData(null);
    } finally {
      setForecastLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchedCity(null);
    setSearchCountry(null);
    setSearchCountryName('');
    setSearchLoading(false);
    const lat = currentWeather?.coord?.lat;
    const lon = currentWeather?.coord?.lon;
    if (lat != null && lon != null) {
      loadForecastForCoords(lat, lon);
    }
  }, [currentWeather, loadForecastForCoords]);

  const handleSearch = async (query) => {
    const q = query.trim();
    if (!q) {
      clearSearch();
      return;
    }
    setSearchLoading(true);
    setSearchedCity(null);
    setSearchCountry(null);
    setSearchCountryName('');
    try {
      try {
        const cityData = await getWeatherByCity(q);
        setSearchedCity(cityData);
        const lat = cityData.coord?.lat;
        const lon = cityData.coord?.lon;
        if (lat != null && lon != null) {
          loadForecastForCoords(lat, lon);
        } else {
          const forecast = await getForecastByCity(cityData.name);
          setForecastData(forecast);
        }
        return;
      } catch {
        // try country
      }
      const countryCities = await getCitiesByCountry(q);
      if (countryCities?.length) {
        setSearchCountry(countryCities);
        setSearchCountryName(q);
        const first = countryCities[0];
        const lat = first?.coord?.lat;
        const lon = first?.coord?.lon;
        if (lat != null && lon != null) loadForecastForCoords(lat, lon);
      } else {
        setSearchedCity(null);
        setSearchCountry(null);
        setForecastData(null);
      }
    } catch {
      setSearchedCity(null);
      setSearchCountry(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSaveFavorite = (data) => {
    if (!data?.name) return;
    addFavoriteCity({
      name: data.name,
      lat: data.coord?.lat,
      lon: data.coord?.lon,
      country: data.sys?.country,
    });
    setSavedListRevision((n) => n + 1);
  };

  /** Menu → Settings → saved city: home + full weather / forecast / details for that place */
  const applySavedCityWeather = async (f) => {
    setSettingsOpen(false);
    setNavMenuOpen(false);
    setSearchCountry(null);
    setSearchCountryName('');
    navigateToHash('#home');

    if (f.lat != null && f.lon != null) {
      setSearchLoading(true);
      try {
        const w = await getWeatherByCoords(f.lat, f.lon);
        setSearchedCity({ ...w, name: f.name });
        await loadForecastForCoords(f.lat, f.lon);
      } catch {
        await handleSearch(f.name);
      } finally {
        setSearchLoading(false);
      }
    } else {
      await handleSearch(f.name);
    }
  };

  /** Dashboard “details” follow search / country / current. */
  const detailsData = searchedCity || searchCountry?.[0] || currentWeather;

  /** Sky, tints, particles, and day/night for the same location as the dashboard (search / country / current). */
  const weatherSlug = getWeatherBackgroundSlug(detailsData?.weather?.[0]);
  const isNightChrome = useIsNight(detailsData);

  useEffect(() => {
    document.documentElement.style.colorScheme = isNightChrome ? 'dark' : 'light';
    return () => {
      document.documentElement.style.colorScheme = '';
    };
  }, [isNightChrome]);

  const mapLat = detailsData?.coord?.lat ?? null;
  const mapLng = detailsData?.coord?.lon ?? null;

  const brand = appName();

  const searchedCityIsFavorite =
    searchedCity &&
    isFavoriteCityMatch({
      name: searchedCity.name,
      lat: searchedCity.coord?.lat,
      lon: searchedCity.coord?.lon,
    });

  const searchActive = Boolean(searchedCity || searchCountry?.length);

  const openNavMenu = useCallback(() => {
    scheduleAfterPaint(() => startTransition(() => setNavMenuOpen(true)));
  }, []);
  const openWeatherMapModal = useCallback(() => {
    scheduleAfterPaint(() => startTransition(() => setWeatherMapOpen(true)));
  }, []);
  const openLocationDetail = useCallback(() => {
    scheduleAfterPaint(() => startTransition(() => setShowLocationDetail(true)));
  }, []);
  const openSettingsModal = useCallback(() => {
    scheduleAfterPaint(() => startTransition(() => setSettingsOpen(true)));
  }, []);
  const openAboutPanel = useCallback(() => {
    scheduleAfterPaint(() => startTransition(() => setAboutOpen(true)));
  }, []);

  return (
    <DayNightProvider isNight={isNightChrome}>
      <div
        className={`weather-app weather-bg weather-bg--${weatherSlug} ${getWeatherMoodClass(weatherSlug)} min-h-screen ${isNightChrome ? 'app-night' : 'app-day'}`}
      >
        <WeatherBackgroundLayers slug={weatherSlug} isNight={isNightChrome} />
        <div className="weather-bg-content">
          <Navbar
            currentWeather={currentWeather}
            currentLoading={currentLoading}
            currentError={currentError}
            onRetryLocation={loadCurrentLocation}
            onCurrentLocationClick={openLocationDetail}
            isNight={isNightChrome}
            onOpenNavMenu={openNavMenu}
            navMenuOpen={navMenuOpen}
            onSearch={handleSearch}
            searchLoading={searchLoading}
            onClearSearch={clearSearch}
            searchActive={searchActive}
          />
          <AnimatePresence>
            {showLocationDetail && currentWeather && (
              <LocationDetailModal
                key="location-detail"
                data={currentWeather}
                onClose={() => setShowLocationDetail(false)}
              />
            )}
          </AnimatePresence>

          <main id="home" className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
            {searchedCity ? (
              <CityWeather
                data={searchedCity}
                onSaveFavorite={handleSaveFavorite}
                isFavorite={Boolean(searchedCityIsFavorite)}
              />
            ) : (
              <CurrentWeather
                data={currentWeather}
                loading={currentLoading}
                error={currentError}
                onOpenDetail={openLocationDetail}
                onRetry={loadCurrentLocation}
                isNight={isNightChrome}
              />
            )}

            <CountryWeather countryName={searchCountryName} cities={searchCountry} />

            <Forecast forecastData={forecastData} loading={forecastLoading} locationWeather={detailsData} />

            <Details data={detailsData} />

            {/* Weather Map */}
            <div className="w-full mt-6 overflow-visible px-3 sm:px-4">
              <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-xl">
                <p className="text-sm font-semibold text-white">Weather Map</p>
                <button
                  type="button"
                  onClick={openWeatherMapModal}
                  className="rounded-xl border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25"
                >
                  Open Full Map
                </button>
              </div>
              <WeatherMap
                embedded
                open={false}
                onClose={() => {}}
                centerLat={mapLat}
                centerLng={mapLng}
              />
            </div>

            {/* Saved Cities */}

            <div className="w-full max-w-md mx-auto mt-6">
              <SavedCities
                embedded
                onSelectCity={applySavedCityWeather}
                favorites={favoritesList}
                onFavoritesChange={(next) => {
                  setFavoritesList(next);
                  setSavedListRevision((n) => n + 1);
                }}
              />
            </div>
          </main>
          <div className="mx-auto max-w-6xl px-4 pb-8 pt-2 sm:px-6">
            <NewsSection defaultCountryCode="in" />
          </div>
          <Footer />
        </div>

        <MenuDrawer
          open={navMenuOpen}
          onClose={() => setNavMenuOpen(false)}
          onOpenMap={openWeatherMapModal}
          onOpenSaved={openSettingsModal}
          onOpenAbout={openAboutPanel}
        />

        <WeatherMap
          open={weatherMapOpen}
          onClose={() => setWeatherMapOpen(false)}
          centerLat={mapLat}
          centerLng={mapLng}
        />

        <AnimatePresence>
          {aboutOpen && (
            <motion.div
              key="about"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-md"
              role="dialog"
              aria-modal="true"
              aria-label="About"
              onClick={() => setAboutOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-md rounded-3xl border border-white/30 bg-white/90 p-6 text-slate-900 shadow-2xl backdrop-blur-xl"
              >
                <h2 className="text-xl font-bold">{brand}</h2>
                <p className="mt-2 text-sm text-slate-600">{appConfig?.app?.tagline}</p>
                <p className="mt-4 text-sm text-slate-600">
                  Live data via Open-Meteo (no key required). Add{' '}
                  <code className="rounded bg-slate-100 px-1">VITE_OPENWEATHER_API_KEY</code> for map tiles.
                </p>
                <button
                  type="button"
                  onClick={() => setAboutOpen(false)}
                  className="mt-6 w-full rounded-2xl bg-sky-600 py-2.5 text-sm font-semibold text-white"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSelectSavedCity={applySavedCityWeather}
          listRevision={savedListRevision}
          onListChange={() => setSavedListRevision((n) => n + 1)}
        />
      </div>
    </DayNightProvider>
  );
}
