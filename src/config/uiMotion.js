/**
 * Shared Framer Motion presets for dialogs / drawers.
 * With `MotionConfig reducedMotion="user"` in the app root, springs shorten automatically.
 */

/** Material-style deceleration — GPU-friendly when paired with opacity/transform only */
export const EASE_OUT = [0.22, 1, 0.36, 1];

export const modalBackdropTransition = {
  duration: 0.28,
  ease: EASE_OUT,
};

export const modalPanelSpring = {
  type: 'spring',
  damping: 32,
  stiffness: 420,
  mass: 0.88,
};

/** Short exit so the scrim does not outlast the panel */
export const modalPanelExitTransition = {
  duration: 0.2,
  ease: [0.4, 0, 1, 1],
};

export const modalPanelSlidePx = 18;

export const drawerSpring = {
  type: 'spring',
  damping: 30,
  stiffness: 380,
  mass: 0.85,
};

export const drawerBackdropTransition = {
  duration: 0.24,
  ease: EASE_OUT,
};
