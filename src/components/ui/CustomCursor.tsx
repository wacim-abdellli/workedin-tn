import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';

export default function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const scale = useMotionValue(1);
  const springX = useSpring(x, { stiffness: 500, damping: 38, mass: 0.3 });
  const springY = useSpring(y, { stiffness: 500, damping: 38, mass: 0.3 });
  const springScale = useSpring(scale, { stiffness: 300, damping: 25 });

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) {
      return undefined;
    }

    const handleMove = (event: MouseEvent) => {
      x.set(event.clientX - 8);
      y.set(event.clientY - 8);
    };

    const handleTarget = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest('a, button, [role="button"], input, textarea, select');
      scale.set(interactive ? 1.9 : 1);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseover', handleTarget);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseover', handleTarget);
    };
  }, [scale, x, y]);

  return (
    <motion.div
      aria-hidden="true"
      className="custom-cursor pointer-events-none fixed left-0 top-0 z-[120] hidden h-4 w-4 rounded-full bg-white dark:bg-gray-800 lg:block"
      style={{ x: springX, y: springY, scale: springScale }}
    />
  );
}
