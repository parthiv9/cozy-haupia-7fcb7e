const COUNTRIES = [
  { code: 'in', label: 'India' },
  { code: 'us', label: 'USA' },
  { code: 'gb', label: 'UK' },
];

/**
 * @param {{ value: string, onChange: (code: string) => void, disabled?: boolean }} props
 */
export default function CountryFilter({ value, onChange, disabled = false }) {
  return (
    <div className="flex flex-col gap-1 sm:items-end">
      <label htmlFor="weather-news-country" className="text-[10px] font-semibold uppercase tracking-wider text-text-dark/50">
        Country
      </label>
      <select
        id="weather-news-country"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-[160px] rounded-xl border border-white/50 bg-white/70 px-3 py-2 text-sm font-medium text-text-dark shadow-inner backdrop-blur-sm transition focus:border-primary-end focus:outline-none focus:ring-2 focus:ring-primary-end/25 disabled:opacity-60"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export { COUNTRIES };
