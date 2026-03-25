/**
 * Frosted panel used for embedded map / saved cities blocks on the home page.
 */
export default function HomeGlassPanel({ title, children, className = '' }) {
  return (
    <div
      className={`w-full max-w-md mx-auto bg-white/10 backdrop-blur-xl rounded-3xl p-4 shadow-lg ${className}`.trim()}
    >
      {title ? <h2 className="text-white text-lg font-semibold mb-3">{title}</h2> : null}
      {children}
    </div>
  );
}
