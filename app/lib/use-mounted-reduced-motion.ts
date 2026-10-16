import { useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";

const noopSubscribe = () => () => {};

/**
 * SSR-safe reduced-motion flag.
 *
 * framer-motion's `useReducedMotion()` has no `matchMedia` on the server, so
 * it returns false during SSR but true on clients that prefer reduced motion.
 * Branching render output on it (variants, classNames) makes server HTML and
 * the first client render disagree → React hydration error.
 *
 * `useSyncExternalStore` with a false server snapshot keeps both renders
 * identical; the reduced branch applies right after hydration. Since values
 * are already final by then there is no visual jump — and the CSS
 * `@media (prefers-reduced-motion)` rules in globals.css remain as backstop
 * for CSS animations.
 */
export function useMountedReducedMotion(): boolean {
    const reduceMotion = useReducedMotion();
    const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
    return mounted && (reduceMotion ?? false);
}
