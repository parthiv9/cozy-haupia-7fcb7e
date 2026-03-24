/**
 * Browser Geolocation service for current location weather.
 * Tuned for mobile: longer timeout, fallback to lower accuracy, clear errors.
 */

const OPTIONS_HIGH = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 300000,
};

const OPTIONS_FAST = {
  enableHighAccuracy: false,
  timeout: 15000,
  maximumAge: 60000,
};

function getCurrentPositionWithOptions(options) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    if (!window.isSecureContext) {
      reject(
        new Error(
          'Location requires a secure connection (HTTPS). Open this site via https:// or use the search bar.'
        )
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export function getCurrentPosition() {
  return getCurrentPositionWithOptions(OPTIONS_HIGH).catch((err) => {
    if (err.code === err.TIMEOUT || err.code === 3) {
      return getCurrentPositionWithOptions(OPTIONS_FAST);
    }
    throw err;
  });
}

export function getGeolocationErrorMessage(err) {
  if (!err || typeof err.code === 'undefined') {
    return err?.message || 'Could not get location';
  }
  switch (err.code) {
    case 1: // PERMISSION_DENIED
      return 'Location access was denied. Allow location in your browser or device settings, then tap "Use my location".';
    case 2: // POSITION_UNAVAILABLE
      return 'Location is unavailable. Tap "Use my location" to try again or search for a city.';
    case 3: // TIMEOUT
      return 'Location request timed out. Tap "Use my location" to try again or search for a city.';
    default:
      return err.message || 'Could not get location';
  }
}

export function requestLocationPermission() {
  return getCurrentPosition().then(
    (pos) => ({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
    (err) => {
      throw Object.assign(err, { userMessage: getGeolocationErrorMessage(err) });
    }
  );
}
