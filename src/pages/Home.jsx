import { useState, useEffect, useCallback, startTransition } from 'react';
import { AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LocationDetailModal from '../components/LocationDetailModal';
import WeatherMap from '../components/WeatherMap';
import CityWeather from '../components/CityWeather';
import CountryWeather from '../components/CountryWeather';
import Forecast from '../components/Forecast';
import Details from '../components/Details';
import NewsSection from '../components/NewsSection';
import SavedCities from '../components/SavedCities';
import { AboutPanel } from '../components/InfoPanels';
import {
  HomeWeatherFrame,
  HomeGlassPanel,
  HomeSearchSection,
  HomeCurrentLocationSection,
  HomeSectionDivider,
} from '../components/home';
import {
  getWeatherByCoords,
  getWeatherByCity,
  getForecastByCoords,
  getCountryCodeFromCoords,
  getWeatherBackgroundSlug,
} from '../utils/api';
import { normalizeNewsRegion } from '../utils/newsRegion';
import { createInitialHomeState } from './homeState';
import { useLocation } from '../hooks/useLocation';
import { useWeather } from '../hooks/useWeather';
import { getFavorites, addFavorite } from '../utils/storage';
import { weatherCardGradient } from '../utils/weatherGradients';
import { useIsNight } from '../hooks/useIsNight';
import { scheduleAfterPaint } from '../utils/scheduleUIWork';

export default function Home() {
  const { coords, error: locError, loading: locLoading, refresh: refreshLocation } = useLocation();
  const { loadByCoords, searchQuery, loading: wxSearchLoading } = useWeather();

  const [state, setState] = useState(createInitialHomeState);

  const {
    currentWeather,
    currentLoading,
    currentError,
    newsLocCode,
    searchLoading,
    searchCity,
    searchCountry,
    searchCountryName,
    forecastData,
    forecastLoading,
    showLocationDetail,
    mapOpen,
    savedOpen,
    aboutOpen,
    favoritesList,
  } = state;

  /* Load weather when GPS coords resolve */
  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, currentLoading: true, currentError: null }));
      const r = await loadByCoords(coords.lat, coords.lon);
      if (cancelled) return;
      if (r.current) {
        setState((s) => ({
          ...s,
          currentWeather: r.current,
          forecastData: r.forecast,
          currentLoading: false,
        }));
      } else {
        setState((s) => ({
          ...s,
          currentError: 'Could not load weather',
          currentLoading: false,
        }));
      }
      try {
        const cc = await getCountryCodeFromCoords(coords.lat, coords.lon);
        if (!cancelled) setState((s) => ({ ...s, newsLocCode: normalizeNewsRegion(cc) }));
      } catch {
        if (!cancelled) setState((s) => ({ ...s, newsLocCode: 'in' }));
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
      setState((s) => ({ ...s, currentLoading: true }));
      if (locError) setState((s) => ({ ...s, currentError: locError }));
      try {
        const w = await getWeatherByCity('London');
        if (cancelled) return;
        setState((s) => ({ ...s, currentWeather: w, currentError: null }));
        const lat = w.coord?.lat;
        const lon = w.coord?.lon;
        if (lat != null && lon != null) {
          const f = await getForecastByCoords(lat, lon);
          if (!cancelled) setState((s) => ({ ...s, forecastData: f }));
        }
        if (!cancelled) setState((s) => ({ ...s, newsLocCode: 'gb' }));
      } catch {
        if (!cancelled) {
          setState((s) => ({ ...s, currentWeather: null, forecastData: null }));
        }
      } finally {
        if (!cancelled) setState((s) => ({ ...s, currentLoading: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coords, locLoading, locError]);

  const loadForecastForCoords = useCallback(async (lat, lon) => {
    setState((s) => ({ ...s, forecastLoading: true }));
    try {
      const data = await getForecastByCoords(lat, lon);
      setState((s) => ({ ...s, forecastData: data }));
    } catch {
      setState((s) => ({ ...s, forecastData: null }));
    } finally {
      setState((s) => ({ ...s, forecastLoading: false }));
    }
  }, []);

  const handleSearch = async (query) => {
    const q = query.trim();
    if (!q) return;
    setState((s) => ({
      ...s,
      searchLoading: true,
      searchCity: null,
      searchCountry: null,
      searchCountryName: '',
    }));
    try {
      const result = await searchQuery(q);
      if (result.type === 'city') {
        setState((s) => ({
          ...s,
          searchCity: result.city,
          forecastData: result.forecast,
        }));
        return;
      }
      if (result.type === 'country') {
        setState((s) => ({
          ...s,
          searchCountry: result.cities,
          searchCountryName: result.countryName,
        }));
        const first = result.cities[0];
        const lat = first?.coord?.lat;
        const lon = first?.coord?.lon;
        if (lat != null && lon != null) await loadForecastForCoords(lat, lon);
        else setState((s) => ({ ...s, forecastData: result.forecast }));
        return;
      }
      setState((s) => ({ ...s, forecastData: null }));
    } finally {
      setState((s) => ({ ...s, searchLoading: false }));
    }
  };

  const clearSearch = useCallback(async () => {
    let coord = null;
    setState((s) => {
      coord = s.currentWeather?.coord;
      return { ...s, searchCity: null, searchCountry: null, searchCountryName: '' };
    });
    const lat = coord?.lat;
    const lon = coord?.lon;
    if (lat != null && lon != null) await loadForecastForCoords(lat, lon);
  }, [loadForecastForCoords]);

  const handleSelectSaved = async (f) => {
    try {
      setState((s) => ({ ...s, searchLoading: true }));
      const w = await getWeatherByCoords(f.lat, f.lon);
      w.name = f.name;
      setState((s) => ({
        ...s,
        searchCity: w,
        searchCountry: null,
        searchCountryName: '',
      }));
      await loadForecastForCoords(f.lat, f.lon);
    } catch {
      /* silent */
    } finally {
      setState((s) => ({ ...s, searchLoading: false }));
    }
  };

  const handleSaveSearchCity = () => {
    if (!searchCity?.coord) return;
    const { lat, lon } = searchCity.coord;
    addFavorite({ name: searchCity.name, lat, lon, country: '' });
    setState((s) => ({ ...s, favoritesList: getFavorites() }));
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

  const openMapModal = useCallback(() => {
    scheduleAfterPaint(() =>
      startTransition(() => setState((s) => ({ ...s, mapOpen: true })))
    );
  }, []);
  const openSavedModal = useCallback(() => {
    scheduleAfterPaint(() =>
      startTransition(() => setState((s) => ({ ...s, savedOpen: true })))
    );
  }, []);
  const openAboutModal = useCallback(() => {
    scheduleAfterPaint(() =>
      startTransition(() => setState((s) => ({ ...s, aboutOpen: true })))
    );
  }, []);
  const openLocationDetailModal = useCallback(() => {
    if (!currentWeather) return;
    scheduleAfterPaint(() =>
      startTransition(() => setState((s) => ({ ...s, showLocationDetail: true })))
    );
  }, [currentWeather]);

  return (
    <HomeWeatherFrame weatherSlug={weatherSlug} isNight={isNightMode} gradientClassName={grad}>
      <Navbar
        onOpenMap={openMapModal}
        onOpenSaved={openSavedModal}
        onOpenAbout={openAboutModal}
      />

      <WeatherMap open={mapOpen} onClose={() => setState((s) => ({ ...s, mapOpen: false }))} centerLat={mapLat} centerLng={mapLng} />
      <SavedCities
        open={savedOpen}
        onClose={() => setState((s) => ({ ...s, savedOpen: false }))}
        onSelectCity={handleSelectSaved}
        favorites={favoritesList}
        onFavoritesChange={(next) => setState((s) => ({ ...s, favoritesList: next }))}
      />
      <AboutPanel open={aboutOpen} onClose={() => setState((s) => ({ ...s, aboutOpen: false }))} />

      <AnimatePresence>
        {showLocationDetail && currentWeather && (
          <LocationDetailModal
            key="location-detail"
            data={currentWeather}
            onClose={() => setState((s) => ({ ...s, showLocationDetail: false }))}
          />
        )}
      </AnimatePresence>

      <main id="home" className="flex w-full flex-1 flex-col items-center gap-6 sm:gap-8">
        <HomeSearchSection
          onSearch={handleSearch}
          onClear={clearSearch}
          loading={searchLoading || wxSearchLoading}
        />

        {!searchCity ? (
          <HomeCurrentLocationSection
            currentWeather={currentWeather}
            currentLoading={currentLoading}
            locLoading={locLoading}
            currentError={currentError}
            onRetry={refreshLocation}
            onOpenDetail={openLocationDetailModal}
            isNightCurrent={isNightCurrent}
          />
        ) : (
          <CityWeather data={searchCity} onSaveFavorite={handleSaveSearchCity} isSaved={!!searchSaved} />
        )}

        <CountryWeather countryName={searchCountryName} cities={searchCountry} />

        <Forecast forecastData={forecastData} loading={forecastLoading} locationWeather={detailsData} />

        <Details data={detailsData} />

        <HomeSectionDivider />

        <HomeGlassPanel title="Weather Map">
          <WeatherMap embedded open={false} onClose={() => {}} centerLat={mapLat} centerLng={mapLng} />
        </HomeGlassPanel>

        <HomeGlassPanel title="Saved Cities" className="mt-6">
          <SavedCities
            embedded
            onSelectCity={handleSelectSaved}
            favorites={favoritesList}
            onFavoritesChange={(next) => setState((s) => ({ ...s, favoritesList: next }))}
          />
        </HomeGlassPanel>

        <div className="w-full">
          <NewsSection locationCountryCode={newsLocCode} />
        </div>
      </main>
      <Footer />
    </HomeWeatherFrame>
  );
}
