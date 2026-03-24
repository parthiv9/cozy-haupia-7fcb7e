import IllustratedWeatherBackground from './IllustratedWeatherBackground';
import { getWeatherMoodKey } from '../utils/weatherApi';

/**
 * Fixed layers under navbar/content: illustrated scene, mood wash, tint, readability, particles.
 */
export default function WeatherBackgroundLayers({ slug, isNight }) {
  const mood = getWeatherMoodKey(slug);

  return (
    <>
      <IllustratedWeatherBackground slug={slug} isNight={isNight} />
      <div className={`weather-bg-mood weather-bg-mood--${mood}`} aria-hidden />
      <div className={`weather-bg-tint weather-bg-tint--${slug}`} aria-hidden />
      <div className="weather-bg-readability" aria-hidden />

      {!isNight && slug === 'clear' && (
        <div className="weather-effect-sun" aria-hidden>
          <div className="weather-effect-sun__glow" />
          <div className="weather-effect-sun__rays" />
        </div>
      )}
      {!isNight && slug === 'partly-cloudy' && (
        <div className="weather-effect-sun weather-effect-sun--subtle" aria-hidden>
          <div className="weather-effect-sun__glow" />
          <div className="weather-effect-sun__rays" />
        </div>
      )}
      {(slug === 'cloudy' || slug === 'partly-cloudy') && (
        <div className="cloud-drift-layer" aria-hidden>
          <div className="cloud-drift cloud-drift--a" />
          <div className="cloud-drift cloud-drift--b" />
          <div className="cloud-drift cloud-drift--c" />
        </div>
      )}
      {(slug === 'fog' || slug === 'drizzle') && (
        <div className="cloud-drift-layer" aria-hidden>
          <div className="cloud-drift cloud-drift--fog" />
          <div className="cloud-drift cloud-drift--a cloud-drift--dim" />
        </div>
      )}
      {(slug === 'rain' || slug === 'thunderstorm') && <div className="rain-layer" aria-hidden />}
      {slug === 'drizzle' && <div className="rain-layer rain-layer--light" aria-hidden />}
      {slug === 'snow' && <div className="snow-layer" aria-hidden />}
      {slug === 'thunderstorm' && <div className="storm-flash" aria-hidden />}
    </>
  );
}
