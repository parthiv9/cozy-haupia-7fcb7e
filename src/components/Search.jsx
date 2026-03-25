import { useState, useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Search as SearchGlyph, X } from 'lucide-react';
import { getSearchSuggestions } from '../utils/weatherApi';

const ICON_STROKE = 2;

const DEBOUNCE_MS = 300;

/** Navbar search: debounced suggestions, keyboard nav, compact glass styling. */
export default function Search({
  onSearch,
  loading,
  className = '',
  layout = 'navbar',
  onClearSearch,
  searchActive = false,
  onMobileHeaderClose,
  onQuerySync,
  autoFocus = false,
}) {
  const layoutCls =
    layout === 'bar'
      ? 'block w-full max-w-none'
      : layout === 'navbarMobileExpanded'
        ? 'block w-full min-w-0 max-w-none flex-1 px-0'
        : 'hidden min-w-0 max-w-xl flex-1 md:block';
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const ref = useRef(null);
  const queryRef = useRef('');
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
    queryRef.current = query;
    onQuerySync?.(query);
  }, [query, onQuerySync]);

  useEffect(() => {
    if (!autoFocus || layout !== 'navbarMobileExpanded') return;
    const t = requestAnimationFrame(() => {
      const el = ref.current?.querySelector?.('input[type="search"]');
      el?.focus?.();
    });
    return () => cancelAnimationFrame(t);
  }, [autoFocus, layout]);

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
      if (layout === 'navbarMobileExpanded') onMobileHeaderClose?.();
      return;
    }
    onSearch(q);
  };

  const handleClearSearch = () => {
    setQuery('');
    setOpen(false);
    setHi(-1);
    onClearSearch?.();
    if (layout === 'navbarMobileExpanded') onMobileHeaderClose?.();
  };

  const pick = (item) => {
    const term = item.value + (item.country ? `, ${item.country}` : '');
    setQuery(term);
    setOpen(false);
    onSearch(term);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (open && suggestions.length > 0) {
        setOpen(false);
        setHi(-1);
        e.preventDefault();
        return;
      }
      if (layout === 'navbarMobileExpanded' && !query.trim()) {
        e.preventDefault();
        onMobileHeaderClose?.();
      }
      return;
    }
    if (!open || suggestions.length === 0) {
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
      id={layout === 'navbarMobileExpanded' ? 'navbar-search-mobile' : undefined}
      onSubmit={submit}
      className={`relative mx-0 min-w-0 px-2 sm:mx-2 ${layoutCls} ${className}`.trim()}
    >
      <div className="relative z-[120] isolate min-w-0 w-full">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => {
            if (layout !== 'navbarMobileExpanded' || !onMobileHeaderClose) return;
            window.setTimeout(() => {
              if (!ref.current || ref.current.contains(document.activeElement)) return;
              if (!queryRef.current.trim()) onMobileHeaderClose();
            }, 180);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search city or country…"
          disabled={loading}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={suggestionsOpen}
          aria-haspopup="listbox"
          aria-controls={suggestionsOpen ? suggestionsListId : undefined}
          className={`app-navbar-search-field relative z-0 w-full rounded-full border py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 ${inputPadRight} ${
            suggestionsOpen
              ? 'app-navbar-search-field--suggestions-open border-slate-200/90 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-400/70'
              : 'backdrop-blur-xl'
          }`}
        />
        <SearchGlyph
          className={`pointer-events-none absolute left-3 top-1/2 z-0 h-4 w-4 -translate-y-1/2 ${
            suggestionsOpen ? 'text-slate-400' : 'app-navbar-search-glyph'
          }`}
          strokeWidth={ICON_STROKE}
          aria-hidden
        />
        {showClear && (
          <button
            type="button"
            onClick={handleClearSearch}
            aria-label="Clear search and show your location"
            title="Back to your location"
            className={`absolute top-1/2 z-[1] -translate-y-1/2 rounded-lg border p-1.5 transition ${
              voiceSupported ? 'right-10' : 'right-2'
            } ${
              suggestionsOpen
                ? 'border-slate-200/90 bg-white text-slate-600 shadow-sm hover:bg-slate-50'
                : 'app-navbar-search-inline-btn shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
            }`}
          >
            <X className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />
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
            className={`absolute right-2 top-1/2 z-[1] -translate-y-1/2 rounded-lg border p-1.5 transition disabled:cursor-not-allowed disabled:opacity-50 ${
              suggestionsOpen
                ? 'border-slate-200/90 bg-white text-slate-600 shadow-sm hover:bg-slate-50'
                : 'app-navbar-search-inline-btn shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
            }`}
          >
            <Mic
              aria-hidden
              className={`h-4 w-4 flex-shrink-0 ${
                isListening
                  ? suggestionsOpen
                    ? 'animate-pulse text-sky-600'
                    : 'animate-pulse text-sky-600 app-navbar-search-mic--listening-darkfield'
                  : ''
              }`}
              strokeWidth={ICON_STROKE}
            />
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
