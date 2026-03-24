import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSearchSuggestions } from '../utils/weatherApi';

const DEBOUNCE_MS = 300;

export default function WeatherSearch({ onSearch, loading }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const t = setTimeout(async () => {
      const list = await getSearchSuggestions(query);
      setSuggestions(list);
      setShowSuggestions(list.length > 0);
      setHighlightIndex(-1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    const q = query.trim();
    if (q) onSearch(q);
  };

  const pickSuggestion = (item) => {
    const searchTerm = item.value + (item.country ? `, ${item.country}` : '');
    setQuery(searchTerm);
    setShowSuggestions(false);
    setSuggestions([]);
    onSearch(searchTerm);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Escape') setShowSuggestions(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0 && suggestions[highlightIndex]) {
      e.preventDefault();
      pickSuggestion(suggestions[highlightIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightIndex(-1);
    }
  };

  return (
    <motion.section
      id="search"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="overflow-visible rounded-2xl glass-card p-4 sm:p-6"
    >
      <form ref={containerRef} onSubmit={handleSubmit} className="relative flex flex-col gap-3 sm:flex-row">
        <div className="relative z-[120] isolate min-w-0 flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="London, Tokyo, New York, India, Canada..."
            className={`weather-search-input relative z-0 w-full rounded-xl border px-4 py-3 focus:border-primary-end focus:outline-none focus:ring-2 focus:ring-primary-end/30 ${
              showSuggestions && suggestions.length > 0
                ? 'weather-search-input--suggestions-open border-slate-200/90 bg-white text-slate-900 placeholder:text-slate-400'
                : 'border-white/50 bg-white/60 text-app-fg placeholder:text-app-fg/50'
            }`}
            disabled={loading}
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={showSuggestions && suggestions.length > 0}
          />
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.ul
                role="listbox"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="search-suggestions-dropdown absolute left-0 right-0 top-full z-[121] mt-1.5 max-h-56 overflow-auto rounded-2xl py-1.5"
              >
                {suggestions.map((item, i) => (
                  <li key={`${item.label}-${i}`} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === highlightIndex}
                      onClick={() => pickSuggestion(item)}
                      onMouseEnter={() => setHighlightIndex(i)}
                      className={`search-suggestions-item ${i === highlightIndex ? 'is-highlighted' : ''}`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-xl bg-primary-end px-6 py-3 font-medium text-white shadow-lg transition hover:bg-primary-start disabled:opacity-60"
        >
          {loading ? 'Searching…' : 'Search'}
        </motion.button>
      </form>
    </motion.section>
  );
}
