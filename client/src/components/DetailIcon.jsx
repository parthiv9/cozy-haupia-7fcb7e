/**
 * Line-art icons for weather detail labels (thermometer, wind, droplet, eye, etc.).
 */

const icons = {
  thermometer: (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="#f97316"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id="thermoBulb" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
      </defs>
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
      <circle cx="11.5" cy="17.5" r="2.5" fill="url(#thermoBulb)" stroke="none" />
    </svg>
  ),
  wind: (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="#38bdf8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
      <path d="M12.59 19.41A2 2 0 1 0 14 16H2" />
      <path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2" />
    </svg>
  ),
  droplet: (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="#0ea5e9"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id="dropletFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="url(#dropletFill)" stroke="none" />
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  eye: (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="#6366f1"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" fill="#a5b4fc" />
      <circle cx="12" cy="12" r="1.5" fill="#1e293b" stroke="none" />
    </svg>
  ),
  gauge: (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="#22c55e"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" fill="#dcfce7" stroke="#22c55e" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  compass: (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="#f97316"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" fill="#fff7ed" stroke="#fdba74" />
      <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" fill="#fb923c" stroke="#ea580c" />
    </svg>
  ),
};

export default function DetailIcon({ name, className = '' }) {
  const Icon = icons[name];
  if (!Icon) return null;
  return <span className={`inline-block text-text-dark/70 ${className}`}>{Icon}</span>;
}
