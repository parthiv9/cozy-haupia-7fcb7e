import CurrentLocation from '../CurrentLocation';
import WeatherCard from '../WeatherCard';

/**
 * GPS / fallback current location block plus the three summary metric cards.
 */
export default function HomeCurrentLocationSection({
  currentWeather,
  currentLoading,
  locLoading,
  currentError,
  onRetry,
  onOpenDetail,
  isNightCurrent,
}) {
  return (
    <>
      <CurrentLocation
        data={currentWeather}
        loading={currentLoading || locLoading}
        error={currentError}
        onRetry={onRetry}
        onOpenDetail={onOpenDetail}
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
  );
}
