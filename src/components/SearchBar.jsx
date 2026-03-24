import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSearchSuggestions } from '../utils/api';
import { DEBOUNCE_SEARCH_MS } from '../utils/helpers';

export default function SearchBar({ onSearch, onClear, loading }) {
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
    const t = window.setTimeout(async () => {
      const list = await getSearchSuggestions(query);
      setSuggestions(list);
      setShowSuggestions(list.length > 0);
      setHighlightIndex(-1);
    }, DEBOUNCE_SEARCH_MS);
    return () => window.clearTimeout(t);
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

  const startVoiceSearch = () => {
    if (loading) return;
    if (!voiceSupported) return;
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

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
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
    <form ref={containerRef} onSubmit={handleSubmit} className="relative w-full min-w-0" role="search">
      <div className="relative z-[120] isolate min-w-0 w-full">
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
          className="relative z-0 w-full rounded-xl border border-white/40 bg-white/30 p-3 pl-4 pr-12 text-base text-white shadow-inner outline-none ring-offset-0 backdrop-blur-md placeholder:text-white transition focus:border-white/60 focus:ring-2 focus:ring-white/30 sm:py-3 sm:pl-5 sm:text-lg"
          disabled={loading}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showSuggestions && suggestions.length > 0}
        />

        <button
          type="button"
          onClick={startVoiceSearch}
          disabled={loading || !voiceSupported}
          aria-label={isListening ? 'Listening for voice input' : 'Start voice search'}
          title={
            voiceSupported
              ? 'Voice search (microphone)'
              : 'Voice search needs a browser with Speech Recognition (e.g. Chrome, Edge)'
          }
          className="absolute right-2 top-1/2 z-[1] -translate-y-1/2 rounded-lg border border-white/35 bg-white/25 p-2 text-white shadow-sm transition hover:bg-white/35 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className={`h-5 w-5 flex-shrink-0 ${isListening ? 'animate-pulse' : ''}`}
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
    </form>
  );
}
