import { getFavorites } from '../utils/storage';

export function createInitialHomeState() {
  return {
    currentWeather: null,
    currentLoading: true,
    currentError: null,
    newsLocCode: 'in',
    searchLoading: false,
    searchCity: null,
    searchCountry: null,
    searchCountryName: '',
    forecastData: null,
    forecastLoading: false,
    showLocationDetail: false,
    mapOpen: false,
    savedOpen: false,
    aboutOpen: false,
    favoritesList: getFavorites(),
  };
}
