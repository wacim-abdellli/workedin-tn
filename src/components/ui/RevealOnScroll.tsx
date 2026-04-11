import { useRef, type ReactNode, type CSSProperties } from 'react';
import { motion, useInView } from 'framer-motion';

type AnimationVariant = 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom' | 'blur';

interface RevealOnScrollProps {
  children: ReactNode;
  variant?: AnimationVariant;
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  style?: CSSProperties;
  once?: boolean;
}

const VARIANTS = {
  'fade-up':    { hidden: { opacity: 0, y: 48 },           visible: { opacity: 1, y: 0 } },
  'fade-down':  { hidden: { opacity: 0, y: -48 },          visible: { opacity: 1, y: 0 } },
  'fade-left':  { hidden: { opacity: 0, x: 48 },           visible: { opacity: 1, x: 0 } },
  'fade-right': { hidden: { opacity: 0, x: -48 },          visible: { opacity: 1, x: 0 } },
  'zoom':       { hidden: { opacity: 0, scale: 0.88 },     visible: { opacity: 1, scale: 1 } },
  'blur':       { hidden: { opacity: 0, filter: 'blur(14px)', y: 24 }, visible: { opacity: 1, filter: 'blur(0px)', y: 0 } },
};

export default function RevealOnScroll({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 0.65,
  threshold = 0.12,
  className,
  style,
  once = true,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, amount: threshold, margin: '0px 0px -60px 0px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      variants={VARIANTS[variant]}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{
        duration,
        delay: delay / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
