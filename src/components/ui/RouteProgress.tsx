import { m, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteProgress() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setVisible(true);
    setKey((value) => value + 1);

    const timer = window.setTimeout(() => setVisible(false), 700);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search, location.hash]);

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <m.div
          key={key}
          aria-hidden="true"
          className="page-progress fixed inset-x-0 top-0 z-[130] h-[3px] origin-left bg-gradient-to-r from-primary-500 via-accent-400 to-primary-500"
          initial={shouldReduceMotion ? { opacity: 0 } : { scaleX: 0, opacity: 1 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { scaleX: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.18 : 0.6, ease: 'easeOut' }}
          style={{ willChange: 'transform, opacity' }}
        />
      )}
    </AnimatePresence>
  );
}
