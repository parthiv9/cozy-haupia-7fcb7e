import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LocationDetailModal from './components/LocationDetailModal';
import DynamicBackground from './components/DynamicBackground';
import WeatherMap from './components/WeatherMap';
import CityWeather from './components/CityWeather';
import CountryWeather from './components/CountryWeather';
import Forecast from './components/Forecast';
import Details from './components/Details';
import NewsSection from './components/NewsSection';
import Search from './components/Search';
import CurrentWeather from './components/CurrentWeather';
import Favorites from './components/Favorites';
import { AboutPanel } from './components/InfoPanels';
import {
  getWeatherByCoords,
  getWeatherByCity,
  getForecastByCoords,
  getForecastByCity,
  getCitiesByCountry,
  getWeatherBackgroundSlug,
} from './utils/weatherApi';
import { requestLocationPermission } from './utils/locationService';
import { getFavorites, addFavorite } from './utils/storage';

export default function App() {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [currentLoading, setCurrentLoading] = useState(true);
  const [currentError, setCurrentError] = useState(null);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchCity, setSearchCity] = useState(null);
  const [searchCountry, setSearchCountry] = useState(null);
  const [searchCountryName, setSearchCountryName] = useState('');

  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [showLocationDetail, setShowLocationDetail] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [favoritesList, setFavoritesList] = useState(() => getFavorites());

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
        const fallback = await getWeatherByCity('London');
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

  const handleSearch = async (query) => {
    const q = query.trim();
    if (!q) return;
    setSearchLoading(true);
    setSearchCity(null);
    setSearchCountry(null);
    setSearchCountryName('');
    try {
      try {
        const cityData = await getWeatherByCity(q);
        setSearchCity(cityData);
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
        /* try country */
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
        setSearchCity(null);
        setSearchCountry(null);
        setForecastData(null);
      }
    } catch {
      setSearchCity(null);
      setSearchCountry(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = useCallback(async () => {
    setSearchCity(null);
    setSearchCountry(null);
    setSearchCountryName('');
    setNewsHasSearchOverride(false);
    setNewsOverrideCountryCode(null);
    setNewsOverridePending(false);

    // Restore forecast context to current location when available.
    const lat = currentWeather?.coord?.lat;
    const lon = currentWeather?.coord?.lon;
    if (lat != null && lon != null) {
      await loadForecastForCoords(lat, lon);
    }
  }, [currentWeather?.coord?.lat, currentWeather?.coord?.lon, loadForecastForCoords]);

  const handleSelectFavorite = async (f) => {
    try {
      setSearchLoading(true);
      const w = await getWeatherByCoords(f.lat, f.lon);
      w.name = f.name;
      setSearchCity(w);
      setSearchCountry(null);
      setSearchCountryName('');
      await loadForecastForCoords(f.lat, f.lon);
    } catch {
      /* silent */
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSaveSearchCity = () => {
    if (!searchCity?.coord) return;
    const { lat, lon } = searchCity.coord;
    addFavorite({
      name: searchCity.name,
      lat,
      lon,
      country: '',
    });
    setFavoritesList(getFavorites());
  };

  const searchSaved =
    searchCity?.coord &&
    favoritesList.some(
      (f) =>
        Math.abs(f.lat - searchCity.coord.lat) < 0.02 && Math.abs(f.lon - searchCity.coord.lon) < 0.02
    );

  const detailsData = searchCity || searchCountry?.[0] || currentWeather;
  const weatherSlug = getWeatherBackgroundSlug(detailsData?.weather?.[0]);
  const isNightMode = detailsData?.is_day === 0;
  const isNightCurrent = currentWeather?.is_day === 0;
  const themeClass = isNightMode ? 'theme-night' : 'theme-day';

  return (
    <div className={`weather-bg weather-bg--${weatherSlug} ${themeClass} min-h-screen`}>
      <DynamicBackground slug={weatherSlug} isNight={isNightMode} />
      {weatherSlug === 'rain' && <div className="rain-layer" aria-hidden="true" />}
      {weatherSlug === 'snow' && <div className="snow-layer" aria-hidden="true" />}
      {weatherSlug === 'thunderstorm' && <div className="storm-flash" aria-hidden="true" />}
      <div className="weather-bg-content">
        <Navbar
          currentWeather={currentWeather}
          currentLoading={currentLoading}
          currentError={currentError}
          onRetryLocation={loadCurrentLocation}
          onCurrentLocationClick={() => setShowLocationDetail(true)}
          onOpenMap={() => setMapOpen(true)}
          onOpenFavorites={() => setFavoritesOpen(true)}
          onOpenAbout={() => setAboutOpen(true)}
          isNight={isNightCurrent}
        />

        <WeatherMap open={mapOpen} onClose={() => setMapOpen(false)} />
        <Favorites
          open={favoritesOpen}
          onClose={() => setFavoritesOpen(false)}
          onSelectCity={handleSelectFavorite}
          favorites={favoritesList}
          onFavoritesChange={setFavoritesList}
        />
        <AboutPanel open={aboutOpen} onClose={() => setAboutOpen(false)} />

        <AnimatePresence>
          {showLocationDetail && currentWeather && (
            <LocationDetailModal
              key="location-detail"
              data={currentWeather}
              isNight={isNightCurrent}
              onClose={() => setShowLocationDetail(false)}
            />
          )}
        </AnimatePresence>

        <main id="home" className="mx-auto max-w-6xl space-y-8 px-3 py-6 sm:px-6 sm:py-8">
          <motion.section
            id="search"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            aria-labelledby="search-section-heading"
            className="rounded-2xl border border-white/30 bg-white/40 p-4 shadow-glass backdrop-blur-2xl sm:p-5"
          >
            <h2
              id="search-section-heading"
              className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-dark/55 sm:text-sm"
            >
              Search
            </h2>
            <Search onSearch={handleSearch} onClear={clearSearch} loading={searchLoading} />
          </motion.section>

          {searchCity ? (
            <CityWeather
              data={searchCity}
              onSaveFavorite={handleSaveSearchCity}
              isSaved={!!searchSaved}
            />
          ) : (
            <CurrentWeather
              data={currentWeather}
              loading={currentLoading}
              error={currentError}
              onRetry={loadCurrentLocation}
              onOpenDetail={() => currentWeather && setShowLocationDetail(true)}
              isNight={isNightCurrent}
            />
          )}

          <CountryWeather countryName={searchCountryName} cities={searchCountry} />

          <Forecast forecastData={forecastData} loading={forecastLoading} isNight={isNightMode} />

          <Details data={detailsData} />

          <NewsSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}
