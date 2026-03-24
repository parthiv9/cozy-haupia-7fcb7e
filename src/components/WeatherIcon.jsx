import { useId } from 'react';

/**
 * Colorful weather icons — distinct hues per element (sun, cloud, rain, etc.).
 * Accepts WMO code (weather.id) or OpenWeatherMap icon string.
 */

const C = {
  sunCore: '#FCD34D',
  sunStroke: '#F59E0B',
  sunRay: '#FBBF24',
  moonFill: '#FEF9C3',
  moonStroke: '#C4B5FD',
  moonCrater: '#E9D5FF',
  cloudTop: '#FFFFFF',
  cloudMid: '#E0F2FE',
  cloudBottom: '#BAE6FD',
  cloudStroke: '#38BDF8',
  cloudShadow: '#7DD3FC',
  fogLine1: '#CBD5E1',
  fogLine2: '#A5B4FC',
  fogLine3: '#94A3B8',
  drop: '#0EA5E9',
  dropLight: '#38BDF8',
  dropDark: '#0369A1',
  snow: '#7DD3FC',
  snowAccent: '#E0E7FF',
  bolt: '#FACC15',
  boltCore: '#FDE047',
  boltStroke: '#CA8A04',
  stormCloud: '#94A3B8',
  stormCloudFill: '#CBD5E1',
  stormStroke: '#64748B',
};

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

const CLOUD_PATH =
  'M 28 58 Q 18 58 14 50 Q 10 42 18 36 Q 20 28 30 26 Q 38 18 50 22 Q 62 18 70 28 Q 82 28 84 40 Q 88 50 78 56 Q 72 62 60 60 Q 52 66 40 62 Q 32 66 28 58 Z';

function SunRays({ cx, cy, r }) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <g>
      {rays.map((deg) => (
        <line
          key={deg}
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - r - 10}
          stroke={C.sunRay}
          strokeWidth={2.5}
          strokeLinecap="round"
          transform={`rotate(${deg} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={r} fill={C.sunCore} stroke={C.sunStroke} strokeWidth={2.25} />
    </g>
  );
}

function Moon({ cx, cy, r }) {
  return (
    <g>
      <path
        fill={C.moonFill}
        stroke={C.moonStroke}
        strokeWidth={2}
        strokeLinejoin="round"
        d={`M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r * 0.65} ${r} 0 1 0 ${cx} ${cy - r} Z`}
      />
      <ellipse cx={cx - r * 0.15} cy={cy - r * 0.25} rx={r * 0.12} ry={r * 0.1} fill={C.moonCrater} opacity={0.55} />
    </g>
  );
}

const icons = {
  clear: ({ isNight }) =>
    isNight ? (
      <Moon cx={52} cy={48} r={22} />
    ) : (
      <SunRays cx={50} cy={48} r={14} />
    ),
  'partly-cloudy': ({ isNight, uid }) => (
    <g>
      <defs>
        <linearGradient id={`${uid}-pc`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.cloudTop} />
          <stop offset="45%" stopColor={C.cloudMid} />
          <stop offset="100%" stopColor={C.cloudBottom} />
        </linearGradient>
      </defs>
      {!isNight && <SunRays cx={68} cy={38} r={11} />}
      {isNight && <Moon cx={72} cy={36} r={12} />}
      <g transform="translate(-6 14) scale(1)">
        <path
          d={CLOUD_PATH}
          fill={`url(#${uid}-pc)`}
          stroke={C.cloudStroke}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path
          d="M 38 52 Q 44 48 52 50"
          fill="none"
          stroke={C.cloudShadow}
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.65}
        />
      </g>
    </g>
  ),
  cloudy: ({ uid }) => (
    <g>
      <defs>
        <linearGradient id={`${uid}-c1`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={C.cloudTop} />
          <stop offset="100%" stopColor="#BFDBFE" />
        </linearGradient>
        <linearGradient id={`${uid}-c2`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#93C5FD" />
        </linearGradient>
      </defs>
      <g transform="translate(4 8) scale(0.95)">
        <path
          d={CLOUD_PATH}
          fill={`url(#${uid}-c1)`}
          stroke="#60A5FA"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </g>
      <g transform="translate(-10 18) scale(0.88)">
        <path
          d={CLOUD_PATH}
          fill={`url(#${uid}-c2)`}
          stroke={C.cloudStroke}
          strokeWidth={1.85}
          strokeLinejoin="round"
        />
      </g>
    </g>
  ),
  fog: () => (
    <g strokeLinecap="round">
      <path d="M 22 38 h 56" stroke={C.fogLine1} strokeWidth={3} opacity={0.95} />
      <path d="M 18 50 h 62" stroke={C.fogLine2} strokeWidth={3} opacity={0.85} />
      <path d="M 24 62 h 52" stroke={C.fogLine3} strokeWidth={3} opacity={0.9} />
      <circle cx="38" cy="44" r="4" fill="#E0E7FF" opacity={0.7} />
      <circle cx="62" cy="56" r="5" fill="#C7D2FE" opacity={0.55} />
    </g>
  ),
  drizzle: ({ uid }) => (
    <g>
      <defs>
        <linearGradient id={`${uid}-dz`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.cloudTop} />
          <stop offset="100%" stopColor="#93C5FD" />
        </linearGradient>
      </defs>
      <g transform="translate(2 4) scale(0.92)">
        <path
          d={CLOUD_PATH}
          fill={`url(#${uid}-dz)`}
          stroke={C.cloudStroke}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </g>
      <line x1="38" y1="68" x2="38" y2="82" stroke={C.dropLight} strokeWidth={3} strokeLinecap="round" />
      <line x1="50" y1="66" x2="50" y2="84" stroke={C.drop} strokeWidth={3.2} strokeLinecap="round" />
      <line x1="62" y1="68" x2="62" y2="82" stroke={C.dropDark} strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  rain: ({ uid }) => (
    <g>
      <defs>
        <linearGradient id={`${uid}-rn`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
      <g transform="translate(2 2) scale(0.95)">
        <path
          d={CLOUD_PATH}
          fill={`url(#${uid}-rn)`}
          stroke="#3B82F6"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </g>
      <line x1="34" y1="64" x2="30" y2="80" stroke={C.dropLight} strokeWidth={3.2} strokeLinecap="round" />
      <line x1="46" y1="62" x2="43" y2="80" stroke={C.drop} strokeWidth={3.4} strokeLinecap="round" />
      <line x1="58" y1="64" x2="54" y2="80" stroke={C.dropDark} strokeWidth={3.2} strokeLinecap="round" />
      <line x1="70" y1="62" x2="67" y2="80" stroke={C.dropLight} strokeWidth={3.2} strokeLinecap="round" />
    </g>
  ),
  snow: () => (
    <g strokeLinecap="round">
      <path
        d="M 50 28 v 44 M 32 50 h 36 M 40 38 l 20 24 M 60 38 L 40 62 M 40 38 l 20 24 M 60 62 L 40 38"
        fill="none"
        stroke={C.snow}
        strokeWidth={2.4}
      />
      <path
        d="M 50 28 v 44 M 32 50 h 36"
        fill="none"
        stroke={C.snowAccent}
        strokeWidth={1.5}
        opacity={0.9}
      />
      <circle cx={50} cy={50} r={4} fill="#BFDBFE" stroke="#38BDF8" strokeWidth={1.5} />
    </g>
  ),
  thunderstorm: () => (
    <g>
      <g transform="translate(2 0) scale(0.9)">
        <path
          d={CLOUD_PATH}
          fill={C.stormCloudFill}
          stroke={C.stormStroke}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path
          d="M 36 50 Q 48 44 62 50"
          fill="none"
          stroke="#475569"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.5}
        />
      </g>
      <polygon
        fill={C.boltCore}
        stroke={C.boltStroke}
        strokeWidth={1.8}
        strokeLinejoin="round"
        points="56,46 44,64 54,64 46,82 66,58 56,58 62,46"
      />
    </g>
  ),
};

export default function WeatherIcon({ weather, className = 'h-20 w-20', size, isNight = false }) {
  const name = getIconName(weather);
  const Render = icons[name] || icons.clear;
  const uid = useId().replace(/:/g, '');

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      <Render isNight={isNight} uid={uid} />
    </svg>
  );
}
