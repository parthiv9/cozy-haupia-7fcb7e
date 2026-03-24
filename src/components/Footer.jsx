import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="app-footer mt-16 border-t border-white/20 bg-white/30 py-8 backdrop-blur-md"
    >
      <div className="mx-auto max-w-6xl px-4 text-center text-sm text-app-fg/80 sm:px-6">
        <p className="font-semibold">SkyCast © 2026</p>
      </div>
    </motion.footer>
  );
}
