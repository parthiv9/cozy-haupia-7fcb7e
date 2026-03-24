import { useId, useMemo } from 'react';

/**
 * Vector landscape: warm sky, sun, birds, layered mountains, forest silhouette.
 * Colors shift subtly per weather slug; pairs with semi-transparent tint in CSS.
 */
const SKY = {
  default: ['#ea580c', '#fb923c', '#fde68a', '#7dd3fc'],
  clear: ['#c2410c', '#f97316', '#fcd34d', '#a5f3fc'],
  'partly-cloudy': ['#b45309', '#fbbf24', '#e0f2fe', '#7dd3fc'],
  cloudy: ['#475569', '#64748b', '#94a3b8', '#cbd5e1'],
  rain: ['#1e293b', '#334155', '#475569', '#64748b'],
  drizzle: ['#334155', '#475569', '#64748b', '#94a3b8'],
  snow: ['#0f172a', '#1e3a5f', '#334155', '#cbd5e1'],
  thunderstorm: ['#1e1b4b', '#312e81', '#4c1d95', '#6366f1'],
  fog: ['#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'],
};

const MOUNTAIN = {
  default: ['#93c5fd', '#5eead4', '#0d9488', '#0f172a'],
  clear: ['#7dd3fc', '#2dd4bf', '#0f766e', '#0c1929'],
  'partly-cloudy': ['#7dd3fc', '#38bdf8', '#0e7490', '#0f172a'],
  cloudy: ['#94a3b8', '#64748b', '#475569', '#1e293b'],
  rain: ['#475569', '#334155', '#1e293b', '#0f172a'],
  drizzle: ['#64748b', '#475569', '#334155', '#1e293b'],
  snow: ['#94a3b8', '#cbd5e1', '#e2e8f0', '#1e293b'],
  thunderstorm: ['#4c1d95', '#3730a3', '#1e1b4b', '#0f172a'],
  fog: ['#cbd5e1', '#94a3b8', '#64748b', '#334155'],
};

const SKY_NIGHT = {
  default: ['#020617', '#1e1b4b', '#312e81', '#1e293b'],
  clear: ['#0f172a', '#1e3a5f', '#312e81', '#172554'],
  'partly-cloudy': ['#0c1222', '#1e40af', '#3730a3', '#1e293b'],
  cloudy: ['#0f172a', '#334155', '#475569', '#1e293b'],
  rain: ['#020617', '#0f172a', '#1e293b', '#334155'],
  drizzle: ['#0f172a', '#1e293b', '#334155', '#475569'],
  snow: ['#020617', '#0f172a', '#1e3a5f', '#334155'],
  thunderstorm: ['#020617', '#1e1b4b', '#312e81', '#1e1b4b'],
  fog: ['#1e293b', '#334155', '#475569', '#64748b'],
};

const MOUNTAIN_NIGHT = {
  default: ['#3730a3', '#1e40af', '#0f766e', '#020617'],
  clear: ['#312e81', '#1d4ed8', '#0f766e', '#020617'],
  'partly-cloudy': ['#4338ca', '#2563eb', '#0e7490', '#020617'],
  cloudy: ['#475569', '#334155', '#1e293b', '#020617'],
  rain: ['#334155', '#1e293b', '#0f172a', '#020617'],
  drizzle: ['#475569', '#334155', '#1e293b', '#0f172a'],
  snow: ['#64748b', '#475569', '#334155', '#0f172a'],
  thunderstorm: ['#4c1d95', '#312e81', '#1e1b4b', '#020617'],
  fog: ['#475569', '#334155', '#1e293b', '#0f172a'],
};

function palette(slug, isNight) {
  const s = SKY[slug] ? slug : 'default';
  if (isNight) {
    return { sky: SKY_NIGHT[s], mountain: MOUNTAIN_NIGHT[s] };
  }
  return { sky: SKY[s], mountain: MOUNTAIN[s] };
}

export default function IllustratedWeatherBackground({ slug = 'default', isNight = false }) {
  const uid = useId().replace(/:/g, '');
  const { sky, mountain } = useMemo(() => palette(slug, isNight), [slug, isNight]);
  const skyId = `sky-${uid}`;
  const showCelestial = slug !== 'rain' && slug !== 'thunderstorm' && slug !== 'snow';
  const sunDim = slug === 'cloudy' || slug === 'fog' || slug === 'drizzle' ? 0.45 : 1;
  const showClouds = slug === 'partly-cloudy' || slug === 'cloudy' || slug === 'drizzle' || slug === 'fog';
  const cloudOpacity = isNight ? (slug === 'cloudy' ? 0.4 : 0.22) : slug === 'cloudy' ? 0.55 : 0.35;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <svg
        className="h-full w-full min-h-[100dvh]"
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={skyId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={sky[0]} />
            <stop offset="32%" stopColor={sky[1]} />
            <stop offset="58%" stopColor={sky[2]} />
            <stop offset="82%" stopColor={sky[3]} />
          </linearGradient>
        </defs>

        <rect width="390" height="844" fill={`url(#${skyId})`} />

        {showClouds && (
          <g opacity={cloudOpacity}>
            <ellipse cx="280" cy="200" rx="52" ry="28" fill="rgba(255,255,255,0.35)" />
            <ellipse cx="310" cy="210" rx="38" ry="22" fill="rgba(255,255,255,0.28)" />
            <ellipse cx="95" cy="260" rx="48" ry="26" fill="rgba(255,255,255,0.25)" />
            <ellipse cx="120" cy="268" rx="32" ry="18" fill="rgba(255,255,255,0.2)" />
          </g>
        )}

        {isNight && showCelestial && (
          <g opacity={0.9} transform="translate(-28 72)">
            <circle cx="68" cy="68" r="42" fill="rgba(99, 102, 241, 0.12)" />
            <path
              fill="#EEF2FF"
              stroke="#C7D2FE"
              strokeWidth="1.5"
              d="M 68 36 A 32 32 0 1 1 68 100 A 21 32 0 1 0 68 36 Z"
            />
          </g>
        )}

        {!isNight && showCelestial && (
          <g opacity={sunDim} transform="translate(-42 88)">
            <circle cx="72" cy="72" r="36" fill="rgba(255,255,255,0.92)" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <line
                key={deg}
                x1="72"
                y1="72"
                x2="72"
                y2="24"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="3"
                strokeLinecap="round"
                transform={`rotate(${deg} 72 72)`}
              />
            ))}
          </g>
        )}

        {isNight && (
          <g fill="#E2E8F0" opacity={0.5}>
            <circle cx="320" cy="120" r="1.2" />
            <circle cx="260" cy="96" r="0.9" />
            <circle cx="200" cy="140" r="1" />
            <circle cx="340" cy="180" r="0.8" />
            <circle cx="150" cy="180" r="1.1" />
          </g>
        )}

        <g
          opacity={isNight ? 0.28 : 0.55}
          stroke={isNight ? '#6366f1' : '#1e3a8a'}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        >
          <path d="M118 252c6-4 12-4 18 0" />
          <path d="M142 258c5-3 10-3 15 0" />
          <path d="M164 254c4-3 8-3 12 0" />
        </g>

        <path d="M0 520 Q60 455 120 495 T240 475 T390 510 L390 844 L0 844 Z" fill={mountain[0]} opacity="0.85" />
        <path d="M0 560 Q100 500 180 540 T320 515 T390 545 L390 844 L0 844 Z" fill={mountain[1]} opacity="0.9" />
        <path d="M0 610 Q140 540 220 585 T390 565 L390 844 L0 844 Z" fill={mountain[2]} />
        <path
          d="M0 668 L12 612 L22 658 L34 598 L46 652 L58 605 L70 648 L82 592 L94 638 L106 600 L118 655 L130 615 L142 662 L154 608 L166 648 L178 618 L190 668 L202 625 L214 658 L226 602 L238 652 L250 618 L262 662 L274 608 L286 642 L298 620 L310 658 L322 605 L334 648 L346 618 L358 655 L370 628 L382 662 L390 640 L390 844 L0 844 Z"
          fill={mountain[3]}
        />
      </svg>
    </div>
  );
}
