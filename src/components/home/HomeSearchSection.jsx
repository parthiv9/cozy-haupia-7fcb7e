import { motion } from 'framer-motion';
import SearchBar from '../SearchBar';

const MOTION = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

export default function HomeSearchSection({ onSearch, onClear, loading }) {
  return (
    <motion.section
      id="search"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={MOTION}
      aria-labelledby="search-section-heading"
      className="w-full overflow-visible rounded-2xl border border-white/35 bg-white/20 p-4 shadow-lg backdrop-blur-xl sm:p-5"
    >
      <h2
        id="search-section-heading"
        className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/80 sm:text-sm"
      >
        Search
      </h2>
      <SearchBar onSearch={onSearch} onClear={onClear} loading={loading} />
    </motion.section>
  );
}
