/**
 * Modern line-art weather icons — clean outlines, minimal style (illustrated look).
 * Accepts WMO code (weather.id) or OpenWeatherMap icon string.
 */

const WMO_TO_ICON = {
  0: 'clear',
  1: 'partly-cloudy',
  2: 'partly-cloudy',
  3: 'cloudy',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  56: 'drizzle',
  57: 'drizzle',
  61: 'rain',
  63: 'rain',
  65: 'rain',
  66: 'rain',
  67: 'rain',
  71: 'snow',
  73: 'snow',
  75: 'snow',
  77: 'snow',
  80: 'rain',
  81: 'rain',
  82: 'rain',
  85: 'snow',
  86: 'snow',
  95: 'thunderstorm',
  96: 'thunderstorm',
  99: 'thunderstorm',
};

function getIconName(weather) {
  if (!weather) return 'clear';
  const id = weather.id ?? weather;
  if (typeof id === 'number' && WMO_TO_ICON[id] != null) return WMO_TO_ICON[id];
  const icon = weather.icon || weather;
  if (typeof icon === 'string') {
    if (icon.startsWith('01')) return 'clear';
    if (icon.startsWith('02') || icon.startsWith('03')) return 'partly-cloudy';
    if (icon.startsWith('04') || icon.startsWith('50')) return icon.startsWith('50') ? 'fog' : 'cloudy';
    if (icon.startsWith('09') || icon.startsWith('10')) return icon.startsWith('10') ? 'rain' : 'drizzle';
    if (icon.startsWith('11')) return 'thunderstorm';
    if (icon.startsWith('13')) return 'snow';
  }
  return 'clear';
}

// Use fixed, vibrant colors instead of inheriting text color
const COLORS = {
  sun: '#fbbf24', // amber-300
  sunGlow: '#f97316', // orange-500
  cloud: '#60a5fa', // blue-400
  fog: '#94a3b8', // slate-400
  rain: '#38bdf8', // sky-400
  drizzle: '#22c55e', // green-500
  snow: '#e5e7eb', // gray-200
  thunder: '#a855f7', // purple-500
  lightningFill: '#c4b5fd', // violet-300
};

const stroke = COLORS.cloud;
const sw = 2;
const swThin = 1.5;

const icons = {
  clear: (isNight) => (
    <g strokeLinecap="round" strokeLinejoin="round">
      {isNight ? (
        <>
          {/* moon */}
          <circle cx="52" cy="44" r="14" fill="#e5e7eb" />
          <circle cx="57" cy="40" r="4" fill="#cbd5e1" />
          {/* subtle stars */}
          <circle cx="30" cy="30" r="1.4" fill="#fee2e2" />
          <circle cx="70" cy="26" r="1.6" fill="#fef9c3" />
          <circle cx="24" cy="52" r="1.2" fill="#bfdbfe" />
        </>
      ) : (
        <>
          {/* glowing sun */}
          <circle cx="50" cy="50" r="18" fill={COLORS.sun} />
          <circle cx="50" cy="50" r="12" fill="none" stroke={COLORS.sunGlow} strokeWidth={sw} />
          {/* rays */}
          <path
            d="M50 20v-6M50 80v6M20 50h-6M80 50h6M32 32l-4.5-4.5M68 68l4.5 4.5M68 32l4.5-4.5M32 68l-4.5 4.5"
            stroke={COLORS.sunGlow}
            strokeWidth={swThin}
          />
        </>
      )}
    </g>
  ),
  'partly-cloudy': (isNight) => (
    <g strokeLinecap="round" strokeLinejoin="round">
      {isNight ? (
        <>
          {/* moon peeking above clouds */}
          <circle cx="64" cy="34" r="9" fill="#e5e7eb" />
          <circle cx="68" cy="30" r="3" fill="#cbd5e1" />
        </>
      ) : (
        <>
          {/* sun */}
          <circle cx="62" cy="38" r="9" fill={COLORS.sun} />
          <path
            d="M62 28v-4M62 52v4M52 38h-4M72 38h4M55 31l-3-3M69 45l3 3M69 31l3-3M55 45l-3 3"
            stroke={COLORS.sunGlow}
            strokeWidth={1.4}
          />
        </>
      )}
      {/* soft blue cloud */}
      <path
        d="M30 60 Q42 50 56 54 Q70 60 82 56 Q90 54 92 58"
        fill="none"
        stroke={COLORS.cloud}
        strokeWidth={swThin}
      />
      <path
        d="M26 64 Q40 56 52 60 Q66 66 78 64"
        fill="none"
        stroke={COLORS.cloud}
        strokeWidth={swThin}
      />
    </g>
  ),
  cloudy: (isNight) => (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* layered colorful clouds; slightly dimmer at night */}
      <path
        d="M26 58 Q40 46 58 50 Q76 58 90 54"
        fill="none"
        stroke={isNight ? '#4f46e5' : COLORS.cloud}
        strokeWidth={swThin + 0.5}
      />
      <path
        d="M22 64 Q38 54 56 58 Q74 66 88 62"
        fill="none"
        stroke={isNight ? '#6366f1' : '#a5b4fc'}
        strokeWidth={swThin}
      />
      <path
        d="M30 68 Q44 60 64 64 Q80 70 92 68"
        fill="none"
        stroke={isNight ? '#7dd3fc' : '#7dd3fc'}
        strokeWidth={swThin}
      />
    </g>
  ),
  fog: () => (
    <g strokeLinecap="round" opacity="0.9">
      <rect
        x="10"
        y="30"
        width="80"
        height="40"
        rx="12"
        fill="url(#fogGradient)"
        opacity="0.75"
      />
      <path d="M18 38h64M18 50h58M18 62h64" stroke={COLORS.fog} strokeWidth={2.2} />
    </g>
  ),
  drizzle: () => (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* mint cloud */}
      <path
        d="M34 44 Q50 36 70 40 Q86 46 92 44"
        fill="none"
        stroke={COLORS.drizzle}
        strokeWidth={sw}
      />
      {/* soft drizzle drops */}
      <path d="M36 56v10" stroke="#4ade80" strokeWidth={sw} />
      <path d="M48 54v12" stroke="#22c55e" strokeWidth={sw} />
      <path d="M60 56v10" stroke="#16a34a" strokeWidth={sw} />
    </g>
  ),
  rain: () => (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* deep blue cloud */}
      <path
        d="M26 42 Q46 32 70 38 Q88 46 94 42"
        fill="none"
        stroke={COLORS.rain}
        strokeWidth={sw}
      />
      <path
        d="M22 48 Q44 38 64 42 Q82 50 90 48"
        fill="none"
        stroke="#0ea5e9"
        strokeWidth={swThin + 0.3}
      />
      {/* raindrops */}
      <path d="M32 56v16" stroke="#38bdf8" strokeWidth={sw} />
      <path d="M46 54v18" stroke="#0ea5e9" strokeWidth={sw} />
      <path d="M60 56v16" stroke="#06b6d4" strokeWidth={sw} />
      <path d="M74 54v18" stroke="#22d3ee" strokeWidth={sw} />
    </g>
  ),
  snow: () => (
    <g strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="50" r="22" fill={COLORS.snow} />
      <circle cx="50" cy="50" r="18" fill="#e0f2fe" opacity="0.7" />
      <path
        d="M50 22v56M22 50h56M34 34l32 32M66 34L34 66"
        fill="none"
        stroke="#60a5fa"
        strokeWidth={swThin}
      />
      <path
        d="M50 26v48M26 50h48M38 38l24 24M62 38L38 62"
        fill="none"
        stroke="#3b82f6"
        strokeWidth={1.4}
      />
    </g>
  ),
  thunderstorm: () => (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* moody violet cloud */}
      <path
        d="M28 38 Q50 30 75 38 Q92 46 94 40"
        fill="none"
        stroke={COLORS.thunder}
        strokeWidth={sw}
      />
      <path
        d="M24 46 Q44 38 66 42 Q84 50 90 46"
        fill="none"
        stroke="#6366f1"
        strokeWidth={swThin + 0.3}
      />
      {/* lightning bolt */}
      <path
        d="M52 46 L46 58 L51 58 L44 74 L58 58 L53 58 L59 46 Z"
        fill={COLORS.lightningFill}
        stroke={COLORS.thunder}
        strokeWidth={1.6}
      />
    </g>
  ),
};

export default function WeatherIcon({ weather, className = 'h-20 w-20', size, isNight = false }) {
  const name = getIconName(weather);
  const render = icons[name] || icons.clear;
  const IconContent = render(isNight);
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {/* shared gradients */}
      <defs>
        <linearGradient id="fogGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e5e7eb" />
          <stop offset="50%" stopColor="#cbd5f5" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
      </defs>
      {IconContent}
    </svg>
  );
}
