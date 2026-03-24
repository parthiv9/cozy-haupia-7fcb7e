import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LocationDetailModal from '../components/LocationDetailModal';
import DynamicBackground from '../components/DynamicBackground';
import WeatherMap from '../components/WeatherMap';
import CityWeather from '../components/CityWeather';
import CountryWeather from '../components/CountryWeather';
import Forecast from '../components/Forecast';
import Details from '../components/Details';
import NewsSection from '../components/NewsSection';
import SearchBar from '../components/SearchBar';
import CurrentLocation from '../components/CurrentLocation';
import WeatherCard from '../components/WeatherCard';
import SavedCities from '../components/SavedCities';
import { AboutPanel } from '../components/InfoPanels';
import {
  getWeatherByCoords,
  getWeatherByCity,
  getForecastByCoords,
  getCountryCodeFromCoords,
  getWeatherBackgroundSlug,
} from '../utils/api';
import { useLocation } from '../hooks/useLocation';
import { useWeather } from '../hooks/useWeather';
import { getFavorites, addFavorite } from '../utils/storage';
import { weatherCardGradient } from '../utils/weatherGradients';
import { useIsNight } from '../hooks/useIsNight';

function normalizeNewsRegion(code) {
  const c = String(code || 'in').toLowerCase();
  if (c === 'us') return 'us';
  if (c === 'gb' || c === 'uk') return 'gb';
  if (c === 'au') return 'au';
  return 'in';
}

export default function Home() {
  const { coords, error: locError, loading: locLoading, refresh: refreshLocation } = useLocation();
  const { loadByCoords, searchQuery, loading: wxSearchLoading } = useWeather();

  const [currentWeather, setCurrentWeather] = useState(null);
  const [currentLoading, setCurrentLoading] = useState(true);
  const [currentError, setCurrentError] = useState(null);
  const [newsLocCode, setNewsLocCode] = useState('in');

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchCity, setSearchCity] = useState(null);
  const [searchCountry, setSearchCountry] = useState(null);
  const [searchCountryName, setSearchCountryName] = useState('');

  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [showLocationDetail, setShowLocationDetail] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [favoritesList, setFavoritesList] = useState(() => getFavorites());

  /* Load weather when GPS coords resolve */
  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    (async () => {
      setCurrentLoading(true);
      setCurrentError(null);
      const r = await loadByCoords(coords.lat, coords.lon);
      if (cancelled) return;
      if (r.current) {
        setCurrentWeather(r.current);
        setForecastData(r.forecast);
      } else {
        setCurrentError('Could not load weather');
      }
      setCurrentLoading(false);
      try {
        const cc = await getCountryCodeFromCoords(coords.lat, coords.lon);
        if (!cancelled) setNewsLocCode(normalizeNewsRegion(cc));
      } catch {
        if (!cancelled) setNewsLocCode('in');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coords, loadByCoords]);

  /* Fallback when no GPS */
  useEffect(() => {
    if (locLoading || coords) return;
    let cancelled = false;
    (async () => {
      setCurrentLoading(true);
      if (locError) setCurrentError(locError);
      try {
        const w = await getWeatherByCity('London');
        if (cancelled) return;
        setCurrentWeather(w);
        setCurrentError(null);
        const lat = w.coord?.lat;
        const lon = w.coord?.lon;
        if (lat != null && lon != null) {
          const f = await getForecastByCoords(lat, lon);
          if (!cancelled) setForecastData(f);
        }
        if (!cancelled) setNewsLocCode('gb');
      } catch {
        if (!cancelled) {
          setCurrentWeather(null);
          setForecastData(null);
        }
      } finally {
        if (!cancelled) setCurrentLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coords, locLoading, locError]);

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
      const result = await searchQuery(q);
      if (result.type === 'city') {
        setSearchCity(result.city);
        setForecastData(result.forecast);
        return;
      }
      if (result.type === 'country') {
        setSearchCountry(result.cities);
        setSearchCountryName(result.countryName);
        const first = result.cities[0];
        const lat = first?.coord?.lat;
        const lon = first?.coord?.lon;
        if (lat != null && lon != null) await loadForecastForCoords(lat, lon);
        else setForecastData(result.forecast);
        return;
      }
      setForecastData(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = useCallback(async () => {
    setSearchCity(null);
    setSearchCountry(null);
    setSearchCountryName('');
    const lat = currentWeather?.coord?.lat;
    const lon = currentWeather?.coord?.lon;
    if (lat != null && lon != null) await loadForecastForCoords(lat, lon);
  }, [currentWeather?.coord?.lat, currentWeather?.coord?.lon, loadForecastForCoords]);

  const handleSelectSaved = async (f) => {
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
    addFavorite({ name: searchCity.name, lat, lon, country: '' });
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
  const isNightMode = useIsNight(detailsData);
  const isNightCurrent = useIsNight(currentWeather);

  const mapLat = coords?.lat ?? currentWeather?.coord?.lat ?? null;
  const mapLng = coords?.lon ?? currentWeather?.coord?.lon ?? null;

  const grad = weatherCardGradient(weatherSlug, isNightMode);

  return (
    <div
      className={`relative isolate flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-br shadow-2xl shadow-black/25 min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-9rem)] ${grad}`}
    >
      <DynamicBackground slug={weatherSlug} isNight={isNightMode} />
      {weatherSlug === 'rain' && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-35"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.06) 2px, rgba(255,255,255,0.06) 4px)',
          }}
          aria-hidden
        />
      )}
      {weatherSlug === 'snow' && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.5), transparent), radial-gradient(2px 2px at 70% 60%, rgba(255,255,255,0.4), transparent)',
            backgroundSize: '120% 120%',
          }}
          aria-hidden
        />
      )}
      {weatherSlug === 'thunderstorm' && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] animate-pulse bg-violet-200/10"
          aria-hidden
        />
      )}
      <div className="relative z-10 flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <Navbar
          onOpenMap={() => setMapOpen(true)}
          onOpenSaved={() => setSavedOpen(true)}
          onOpenAbout={() => setAboutOpen(true)}
        />

        <WeatherMap open={mapOpen} onClose={() => setMapOpen(false)} centerLat={mapLat} centerLng={mapLng} />
        <SavedCities
          open={savedOpen}
          onClose={() => setSavedOpen(false)}
          onSelectCity={handleSelectSaved}
          favorites={favoritesList}
          onFavoritesChange={setFavoritesList}
        />
        <AboutPanel open={aboutOpen} onClose={() => setAboutOpen(false)} />

        <AnimatePresence>
          {showLocationDetail && currentWeather && (
            <LocationDetailModal
              key="location-detail"
              data={currentWeather}
              onClose={() => setShowLocationDetail(false)}
            />
          )}
        </AnimatePresence>

        <main
          id="home"
          className="flex w-full flex-1 flex-col items-center gap-6 sm:gap-8"
        >
          <motion.section
            id="search"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            aria-labelledby="search-section-heading"
            className="w-full overflow-visible rounded-2xl border border-white/35 bg-white/20 p-4 shadow-lg backdrop-blur-xl sm:p-5"
          >
            <h2
              id="search-section-heading"
              className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/80 sm:text-sm"
            >
              Search
            </h2>
            <SearchBar
              onSearch={handleSearch}
              onClear={clearSearch}
              loading={searchLoading || wxSearchLoading}
            />
          </motion.section>

          {!searchCity ? (
            <>
              <CurrentLocation
                data={currentWeather}
                loading={currentLoading || locLoading}
                error={currentError}
                onRetry={refreshLocation}
                onOpenDetail={() => currentWeather && setShowLocationDetail(true)}
                isNight={isNightCurrent}
              />
              {currentWeather && !currentLoading && (
                <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                  <WeatherCard
                    title="Feels like"
                    subtitle="Apparent temperature"
                    temp={currentWeather.main?.feels_like}
                    weather={currentWeather.weather?.[0]}
                    isNight={isNightCurrent}
                    delay={0}
                  />
                  <WeatherCard
                    title="Humidity"
                    subtitle="Relative"
                    value={
                      currentWeather.main?.humidity != null ? `${Math.round(currentWeather.main.humidity)}%` : '—'
                    }
                    weather={currentWeather.weather?.[0]}
                    isNight={isNightCurrent}
                    delay={0.05}
                  />
                  <WeatherCard
                    title="Wind"
                    subtitle="Surface"
                    value={
                      currentWeather.wind?.speed != null ? `${Number(currentWeather.wind.speed).toFixed(1)} m/s` : '—'
                    }
                    weather={currentWeather.weather?.[0]}
                    isNight={isNightCurrent}
                    delay={0.1}
                  />
                </div>
              )}
            </>
          ) : (
            <CityWeather
              data={searchCity}
              onSaveFavorite={handleSaveSearchCity}
              isSaved={!!searchSaved}
            />
          )}

          <CountryWeather countryName={searchCountryName} cities={searchCountry} />

          <Forecast forecastData={forecastData} loading={forecastLoading} locationWeather={detailsData} />

          <Details data={detailsData} />

          {/* Divider */}
          <div className="h-[1px] bg-white/20 w-full my-6"></div>

          {/* Weather Map Section */}
          <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-xl rounded-3xl p-4 shadow-lg">
            <h2 className="text-white text-lg font-semibold mb-3">Weather Map</h2>
            <WeatherMap
              embedded
              open={false}
              onClose={() => {}}
              centerLat={mapLat}
              centerLng={mapLng}
            />
          </div>

          {/* Saved Cities Section */}
          <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-xl rounded-3xl p-4 shadow-lg mt-6">
            <h2 className="text-white text-lg font-semibold mb-3">Saved Cities</h2>
            <SavedCities
              embedded
              onSelectCity={handleSelectSaved}
              favorites={favoritesList}
              onFavoritesChange={setFavoritesList}
            />
          </div>

          <div className="w-full">
            <NewsSection locationCountryCode={newsLocCode} />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
