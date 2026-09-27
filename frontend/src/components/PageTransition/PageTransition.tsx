import { useLayoutEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Cross-fades route content on navigation and resets scroll to top. */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  if (reduce) return <div key={location.pathname}>{children}</div>;

  // Enter-only fade: the old page unmounts immediately. An exit animation
  // (AnimatePresence popLayout) left stale, invisible pages absolutely
  // positioned in <main>, stretching the document below the footer.
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
