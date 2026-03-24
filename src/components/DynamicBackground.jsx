/**
 * Lightweight atmosphere using only Tailwind (no custom CSS file).
 */
export default function DynamicBackground({ slug, isNight }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]" aria-hidden>
      {!isNight && (slug === 'clear' || slug === 'default') && (
        <div className="absolute -right-8 top-6 h-36 w-36 rounded-full bg-yellow-300/25 blur-3xl" />
      )}
      {isNight && (
        <div className="absolute right-10 top-8 h-24 w-24 rounded-full bg-slate-200/10 blur-2xl" />
      )}
      {(slug === 'cloudy' || slug === 'partly-cloudy' || slug === 'fog') && (
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
      )}
    </div>
  );
}
