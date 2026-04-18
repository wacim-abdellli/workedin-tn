import React from 'react';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'w-3 h-3 border-[1.5px]',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
  xl: 'w-12 h-12 border-[3px]',
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  return (
    <div
      className={`${sizeMap[size]} rounded-full border-t-transparent animate-spin ${className}`}
      style={{
        borderColor: 'var(--color-border-default)',
        borderTopColor: 'transparent',
        borderRightColor: 'var(--color-brand-primary)',
        animationDuration: 'var(--animation-duration-slower)',
        animationTimingFunction: 'var(--animation-easing-linear)',
      }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading</span>
    </div>
  );
};

export default Spinner;
