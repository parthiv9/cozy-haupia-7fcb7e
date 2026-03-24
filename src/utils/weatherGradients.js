/** Tailwind gradient utility class names for main weather card (day / night). */
const DAY = {
  default: 'from-sky-500 via-blue-500 to-indigo-600',
  clear: 'from-amber-400 via-sky-400 to-blue-600',
  'partly-cloudy': 'from-blue-600 via-sky-400 to-indigo-500',
  cloudy: 'from-slate-600 via-slate-500 to-slate-400',
  rain: 'from-slate-800 via-slate-700 to-slate-600',
  drizzle: 'from-slate-600 via-slate-500 to-slate-400',
  snow: 'from-slate-900 via-slate-600 to-slate-400',
  thunderstorm: 'from-indigo-950 via-violet-900 to-purple-950',
  fog: 'from-slate-500 via-slate-400 to-slate-300',
};

const NIGHT = {
  default: 'from-slate-950 via-slate-900 to-blue-950',
  clear: 'from-slate-950 via-indigo-950 to-slate-900',
  'partly-cloudy': 'from-slate-900 via-blue-950 to-slate-900',
  cloudy: 'from-slate-900 via-slate-800 to-slate-700',
  rain: 'from-slate-950 via-slate-800 to-slate-900',
  drizzle: 'from-slate-900 via-slate-800 to-slate-700',
  snow: 'from-slate-950 via-slate-800 to-slate-600',
  thunderstorm: 'from-slate-950 via-indigo-950 to-violet-950',
  fog: 'from-slate-800 via-slate-700 to-slate-600',
};

export function weatherCardGradient(slug, isNight) {
  const map = isNight ? NIGHT : DAY;
  return map[slug] || map.default;
}
