/**
 * Runs `fn` on the next animation frame so the current event handler can return quickly
 * (helps Chrome "handler took …ms" warnings for heavy React updates).
 */
export function scheduleAfterPaint(fn) {
  if (typeof window === 'undefined') {
    queueMicrotask(fn);
    return;
  }
  requestAnimationFrame(fn);
}
