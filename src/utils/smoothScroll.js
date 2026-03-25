import { scheduleAfterPaint } from './scheduleUIWork';

/** @returns {boolean} */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

/** `'smooth'` only when the user has not asked for reduced motion. */
export function getScrollBehavior() {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}

/**
 * @param {string} id Element id without `#`
 * @param {ScrollLogicalPosition} [block]
 */
export function scrollToAnchorId(id, block = 'start') {
  if (typeof document === 'undefined' || !id) return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: getScrollBehavior(), block });
}

/**
 * Updates the hash (no extra history entry) and scrolls, for in-page anchors after closing overlays.
 * @param {string} href e.g. `#forecast`
 */
export function navigateToHash(href) {
  if (typeof window === 'undefined' || !href || !href.startsWith('#')) return;
  const id = href.slice(1);
  const path = `${window.location.pathname}${window.location.search || ''}${href}`;
  // Two frames: commit URL change, then scroll — avoids forced layout in the same turn as clicks.
  scheduleAfterPaint(() => {
    window.history.replaceState(null, '', path);
    scheduleAfterPaint(() => scrollToAnchorId(id));
  });
}
