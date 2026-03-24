import { useState, useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSearchSuggestions } from '../utils/weatherApi';

const DEBOUNCE_MS = 300;

/**
 * Navbar search: debounced suggestions, keyboard nav, compact glass styling.
 */
export default function Search({
  onSearch,
  loading,
  className = '',
  layout = 'navbar',
  onClearSearch,
  searchActive = false,
}) {
  const layoutCls =
    layout === 'bar' ? 'block w-full max-w-none' : 'hidden min-w-0 max-w-xl flex-1 md:block';
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const ref = useRef(null);
  const suggestionsListId = useId().replace(/:/g, '');
  const recognitionRef = useRef(null);
  const voiceTranscriptRef = useRef('');

  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
    setVoiceSupported(!!SpeechRecognition);
  }, []);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      const list = await getSearchSuggestions(query);
      setSuggestions(list);
      setOpen(list.length > 0);
      setHi(-1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function outside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    setOpen(false);
    const q = query.trim();
    if (!q) {
      onClearSearch?.();
      return;
    }
    onSearch(q);
  };

  const handleClearSearch = () => {
    setQuery('');
    setOpen(false);
    setHi(-1);
    onClearSearch?.();
  };

  const pick = (item) => {
    const term = item.value + (item.country ? `, ${item.country}` : '');
    setQuery(term);
    setOpen(false);
    onSearch(term);
  };

  const onKeyDown = (e) => {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Escape') setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHi((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHi((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && hi >= 0 && suggestions[hi]) {
      e.preventDefault();
      pick(suggestions[hi]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHi(-1);
    }
  };

  const suggestionsOpen = open && suggestions.length > 0;

  const showClear = Boolean(searchActive && onClearSearch);
  const inputPadRight =
    voiceSupported && showClear ? 'pr-[4.75rem]' : voiceSupported ? 'pr-11' : showClear ? 'pr-11' : 'pr-4';

  const startVoiceSearch = () => {
    if (loading || !voiceSupported) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      recognitionRef.current?.abort?.();
    } catch {
      /* ignore */
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    voiceTranscriptRef.current = '';

    setIsListening(true);
    setOpen(false);
    setHi(-1);

    recognition.onresult = (event) => {
      let line = '';
      for (let i = 0; i < event.results.length; i += 1) {
        const res = event.results[i];
        line += res?.[0]?.transcript ? String(res[0].transcript) : '';
      }
      const t = line.trim();
      voiceTranscriptRef.current = t;
      if (t) setQuery(t);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const q = voiceTranscriptRef.current.trim();
      if (q) onSearch(q);
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <form
      ref={ref}
      onSubmit={submit}
      className={`relative mx-0 min-w-0 px-2 sm:mx-2 ${layoutCls} ${className}`.trim()}
    >
      <div className="relative z-[120] isolate min-w-0 w-full">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search city or country…"
          disabled={loading}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={suggestionsOpen}
          aria-haspopup="listbox"
          aria-controls={suggestionsOpen ? suggestionsListId : undefined}
          className={`relative z-0 w-full rounded-2xl border py-2.5 pl-10 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-500/25 ${inputPadRight} ${
            suggestionsOpen
              ? 'border-slate-200/90 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-400/70'
              : 'border-white/45 bg-white/55 text-app-fg backdrop-blur-xl placeholder:text-app-fg/45 focus:border-sky-400/60'
          }`}
        />
        <svg
          className={`pointer-events-none absolute left-3 top-1/2 z-0 h-4 w-4 -translate-y-1/2 ${
            suggestionsOpen ? 'text-slate-400' : 'text-app-fg/40'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {showClear && (
          <button
            type="button"
            onClick={handleClearSearch}
            aria-label="Clear search and show your location"
            title="Back to your location"
            className={`absolute top-1/2 z-[1] -translate-y-1/2 rounded-lg border p-1.5 shadow-sm transition ${
              voiceSupported ? 'right-10' : 'right-2'
            } ${
              suggestionsOpen
                ? 'border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50'
                : 'border-white/45 bg-white/50 text-app-fg hover:bg-white/70'
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {voiceSupported && (
          <button
            type="button"
            onClick={startVoiceSearch}
            disabled={loading || isListening}
            aria-label={isListening ? 'Listening — speak a city or country' : 'Search by voice'}
            title={
              isListening
                ? 'Listening…'
                : 'Voice search — speak a city or country (Chrome / Edge recommended)'
            }
            className={`absolute right-2 top-1/2 z-[1] -translate-y-1/2 rounded-lg border p-1.5 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
              suggestionsOpen
                ? 'border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50'
                : 'border-white/45 bg-white/50 text-app-fg hover:bg-white/70'
            }`}
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className={`h-4 w-4 flex-shrink-0 ${isListening ? 'animate-pulse text-sky-600' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <path d="M12 19v4" />
            </svg>
          </button>
        )}
        <AnimatePresence>
          {open && suggestions.length > 0 && (
            <motion.ul
              id={suggestionsListId}
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
                    aria-selected={i === hi}
                    onClick={() => pick(item)}
                    onMouseEnter={() => setHi(i)}
                    className={`search-suggestions-item ${i === hi ? 'is-highlighted' : ''}`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
