import { useRef, type ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';

interface StaggerRevealProps {
  children: ReactNode;
  staggerDelay?: number;  // seconds between each child
  initialDelay?: number;  // seconds before first child
  className?: string;
  threshold?: number;
  once?: boolean;
}

const container = (stagger: number, initial: number) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren: initial,
    },
  },
});

const item = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export { item as staggerItem };

export default function StaggerReveal({
  children,
  staggerDelay = 0.1,
  initialDelay = 0,
  className,
  threshold = 0.1,
  once = true,
}: StaggerRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, amount: threshold, margin: '0px 0px -60px 0px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={container(staggerDelay, initialDelay)}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      {children}
    </motion.div>
  );
}

// Convenience wrapper for individual stagger items
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}
