/**
 * Extra surface effects on top of DynamicBackground for select conditions.
 * Kept separate so other full-bleed weather layouts can reuse the same treatment.
 */
export default function WeatherAtmosphereOverlays({ slug }) {
  return (
    <>
      {slug === 'rain' && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-35"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.06) 2px, rgba(255,255,255,0.06) 4px)',
          }}
          aria-hidden
        />
      )}
      {slug === 'snow' && (
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
      {slug === 'thunderstorm' && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] animate-pulse bg-violet-200/10"
          aria-hidden
        />
      )}
    </>
  );
}
