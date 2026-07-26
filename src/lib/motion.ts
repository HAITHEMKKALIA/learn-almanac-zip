// Academy — motion utilities & variants (Framer Motion)
// Respects prefers-reduced-motion automatically.
import { useReducedMotion, type Variants, type Transition } from "framer-motion";

export const useReducedMotionSafe = (): boolean => !!useReducedMotion();

const ease: Transition["ease"] = [0.22, 1, 0.36, 1];

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.5, ease } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 24 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.55, ease } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.35, ease } },
};

export const staggerContainer: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const staggerItem: Variants = slideUp;

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.2, ease } },
};

export const cardHover = {
  whileHover: { y: -4, transition: { duration: 0.2, ease } },
  whileTap:   { scale: 0.99 },
};

export const glowPulse: Variants = {
  hidden: { opacity: 0.5 },
  show:   { opacity: [0.5, 0.9, 0.5], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } },
};
