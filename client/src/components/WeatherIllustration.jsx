/**
 * Illustrated weather background — scenic landscape layer that matches current condition.
 * Mountains, sun/moon, birds, clouds in a soft illustrated style.
 */

export default function WeatherIllustration({ slug, isNight = false }) {
  const isDark = isNight || ['rain', 'thunderstorm', 'snow', 'cloudy', 'drizzle', 'fog'].includes(slug);
  const isClear = slug === 'clear' || slug === 'default';

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 h-full w-full object-cover opacity-40 sm:opacity-50"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id="sky-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#1e293b' : '#fef3c7'} stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="mountain-far" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={isDark ? '#334155' : '#6366f1'} stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="mountain-mid" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={isDark ? '#475569' : '#818cf8'} stopOpacity="0.55" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="mountain-near" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={isDark ? '#64748b' : '#a5b4fc'} stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Sky gradient overlay */}
        <rect width="800" height="600" fill="url(#sky-grad)" />

        {/* Sun / Moon */}
        {slug !== 'thunderstorm' && (
          <g>
            {isNight ? (
              <g>
                {/* Moon with subtle craters */}
                <circle cx="430" cy="120" r="40" fill="#e5e7eb" opacity="0.9" />
                <circle cx="445" cy="110" r="8" fill="#cbd5e1" opacity="0.8" />
                <circle cx="418" cy="132" r="5" fill="#d1d5db" opacity="0.7" />
              </g>
            ) : isClear || slug === 'default' ? (
              <circle
                cx="400"
                cy="140"
                r="55"
                fill="none"
                stroke={isDark ? '#94a3b8' : '#fcd34d'}
                strokeWidth="2"
                opacity="0.7"
              />
            ) : slug === 'partly-cloudy' ? (
              <circle cx="520" cy="120" r="40" fill="none" stroke="#fde047" strokeWidth="1.5" opacity="0.6" />
            ) : null}
          </g>
        )}

        {/* Birds (clear / partly-cloudy / default) */}
        {(isClear || slug === 'partly-cloudy' || slug === 'default') && (
          <g stroke={isDark ? '#64748b' : '#475569'} strokeWidth="1.5" fill="none" opacity="0.5">
            <path d="M150 180 Q160 170 170 180 Q160 190 150 180" />
            <path d="M200 200 Q210 190 220 200 Q210 210 200 200" />
            <path d="M600 160 Q610 150 620 160 Q610 170 600 160" />
          </g>
        )}

        {/* Clouds (soft illustrated) */}
        {slug !== 'clear' && slug !== 'default' && (
          <g fill="none" stroke={isDark ? '#94a3b8' : '#e2e8f0'} strokeWidth="1.5" opacity="0.6">
            <ellipse cx="200" cy="220" rx="60" ry="25" />
            <ellipse cx="250" cy="230" rx="50" ry="22" />
            <ellipse cx="600" cy="180" rx="70" ry="28" />
            <ellipse cx="650" cy="190" rx="55" ry="24" />
          </g>
        )}

        {/* Mountain layers — illustrated silhouette style */}
        <g fill="url(#mountain-far)">
          <path d="M0 600 L0 400 L150 500 L280 380 L400 480 L520 350 L650 450 L800 320 L800 600 Z" />
        </g>
        <g fill="url(#mountain-mid)">
          <path d="M0 600 L80 450 L200 550 L350 420 L500 520 L620 440 L800 500 L800 600 Z" />
        </g>
        <g fill="url(#mountain-near)">
          <path d="M0 600 L120 500 L300 600 L450 480 L600 600 L800 550 L800 600 Z" />
        </g>
      </svg>
    </div>
  );
}
