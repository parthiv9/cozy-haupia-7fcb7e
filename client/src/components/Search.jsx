import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSearchSuggestions } from '../utils/weatherApi';
import { getAppConfig } from '../config/loadConfig';

export default function Search({ onSearch, onClear, loading }) {
  const debounceMs = getAppConfig()?.ui?.debounceSearchMs ?? 300;
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
    setVoiceSupported(!!SpeechRecognition);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup any in-flight recognition on unmount.
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
      setShowSuggestions(false);
      return;
    }
    const t = setTimeout(async () => {
      const list = await getSearchSuggestions(query);
      setSuggestions(list);
      setShowSuggestions(list.length > 0);
      setHighlightIndex(-1);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);

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

  const startVoiceSearch = () => {
    if (loading) return;
    if (!voiceSupported) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Reset any existing session.
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

    setIsListening(true);
    setShowSuggestions(false);
    setSuggestions([]);
    setHighlightIndex(-1);

    let lastFinalTranscript = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const res = event.results[i];
        const transcript = res?.[0]?.transcript ? String(res[0].transcript) : '';
        if (res.isFinal) {
          if (transcript) lastFinalTranscript = transcript;
        } else {
          interim += transcript;
        }
      }

      const combined = (lastFinalTranscript || interim).trim();
      if (combined) setQuery(combined);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const finalQ = lastFinalTranscript.trim();
      if (finalQ) onSearch(finalQ);
    };

    recognition.start();
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
    <form
      ref={containerRef}
      onSubmit={handleSubmit}
      className="relative w-full min-w-0"
      role="search"
    >
      <input
        type="text"
        value={query}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          if (!next.trim()) onClear?.();
        }}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search city or country…"
        className="w-full rounded-xl border border-white/40 bg-white/50 py-2 pl-3 pr-11 text-sm text-text-dark shadow-inner backdrop-blur-md placeholder:text-text-dark/45 focus:border-primary-end focus:outline-none focus:ring-2 focus:ring-primary-end/25 sm:py-2.5 sm:pl-4 sm:text-base"
        disabled={loading}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
      />

      <button
        type="button"
        onClick={startVoiceSearch}
        disabled={loading || !voiceSupported}
        aria-label={isListening ? 'Listening for voice input' : 'Start voice search'}
        title={voiceSupported ? 'Voice search' : 'Voice search not supported in this browser'}
        className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-white/40 bg-white/60 px-2 py-1 text-text-dark shadow-inner transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={`h-5 w-5 ${isListening ? 'animate-pulse' : ''}`}
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
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-[80] mt-1 max-h-56 overflow-auto rounded-xl border border-white/40 bg-white/95 py-1 shadow-xl backdrop-blur-xl"
          >
            {suggestions.map((item, i) => (
              <li key={`${item.label}-${i}`}>
                <button
                  type="button"
                  onClick={() => pickSuggestion(item)}
                  onMouseEnter={() => setHighlightIndex(i)}
                  className={`w-full px-3 py-2 text-left text-sm sm:px-4 sm:py-2.5 ${
                    i === highlightIndex
                      ? 'bg-primary-end/15 text-text-dark'
                      : 'text-text-dark hover:bg-white/80'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </form>
  );
}
