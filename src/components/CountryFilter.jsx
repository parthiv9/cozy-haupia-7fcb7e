const COUNTRIES = [
  { code: 'in', label: 'India' },
  { code: 'us', label: 'USA' },
  { code: 'gb', label: 'UK' },
  { code: 'au', label: 'Australia' },
];

/**
 * @param {{ value: string, onChange: (code: string) => void, disabled?: boolean }} props
 */
export default function CountryFilter({ value, onChange, disabled = false }) {
  return (
    <div className="flex flex-col gap-1 sm:items-end">
      <label
        htmlFor="weather-news-country"
        className="text-[10px] font-semibold uppercase tracking-wider text-app-fg/50"
      >
        Country
      </label>
      <select
        id="weather-news-country"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-[180px] rounded-xl border border-white/45 bg-white/70 px-3 py-2.5 text-sm font-medium text-app-fg shadow-inner backdrop-blur-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 disabled:opacity-60 app-night:bg-slate-900/50 app-night:border-white/15"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label} ({c.code})
          </option>
        ))}
      </select>
    </div>
  );
}

export { COUNTRIES };
