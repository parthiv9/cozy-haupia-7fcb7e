import { getPlaceNameFromCoords, getWeatherByCoords } from './weatherApi';

/**
 * Reverse geocode + current weather for map click popup.
 */
export async function fetchWeatherForMapPoint(lat, lon) {
  try {
    const [name, weather] = await Promise.all([
      getPlaceNameFromCoords(lat, lon),
      getWeatherByCoords(lat, lon),
    ]);
    return {
      name: name || weather.name || 'Selected point',
      weather: { ...weather, name: name || weather.name },
    };
  } catch {
    return null;
  }
}
