/**
 * Premium animated atmosphere: sun rays, clouds, rain, lightning, moon & stars by weather + day/night.
 */
export default function DynamicBackground({ slug, isNight }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Day: animated sun rays (clear / default) */}
      {!isNight && (slug === 'clear' || slug === 'default' || slug === 'partly-cloudy') && (
        <div className="sun-rays-premium" />
      )}
      {!isNight && slug === 'clear' && <div className="sun-orb-premium" />}

      {/* Night: stars + moon glow */}
      {isNight && (
        <>
          <div className="stars-field" />
          <div className="moon-glow-premium" />
        </>
      )}

      {/* Cloudy: drifting cloud wisps */}
      {(slug === 'cloudy' || slug === 'partly-cloudy' || slug === 'fog') && (
        <div className="cloud-drift-premium" />
      )}

      {/* Rain / drizzle extra streaks (base rain-layer still on parent) */}
      {(slug === 'rain' || slug === 'drizzle') && <div className="rain-streak-premium" />}
    </div>
  );
}
