import DynamicBackground from '../DynamicBackground';
import WeatherAtmosphereOverlays from './WeatherAtmosphereOverlays';

const SHELL_CLASSES =
  'relative isolate flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-br shadow-2xl shadow-black/25';

/**
 * Shared chrome for the home dashboard: gradient shell, animated background, condition overlays, content column.
 */
export default function HomeWeatherFrame({ weatherSlug, isNight, gradientClassName, children }) {
  return (
    <div className={`${SHELL_CLASSES} ${gradientClassName}`}>
      <DynamicBackground slug={weatherSlug} isNight={isNight} />
      <WeatherAtmosphereOverlays slug={weatherSlug} />
      <div className="relative z-10 flex flex-1 flex-col gap-6 p-4 sm:p-6">{children}</div>
    </div>
  );
}
