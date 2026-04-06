import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
  ariaLabel?: string;
  srText?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  animation = 'pulse',
  ariaLabel = 'Loading content',
  srText = 'Loading...',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-md';
      case 'text':
      default:
        return 'rounded';
    }
  };

  const getDefaultSize = () => {
    if (variant === 'circular') {
      return { width: '40px', height: '40px' };
    }
    if (variant === 'text') {
      return { width: '100%', height: '1em' };
    }
    return { width: '100%', height: '100px' };
  };

  const defaultSize = getDefaultSize();
  const style = {
    width: width ?? defaultSize.width,
    height: height ?? defaultSize.height,
    backgroundColor: 'var(--color-background-muted)',
    borderRadius: 'var(--radius-md)',
  };

  const animationClass = animation === 'pulse' ? 'animate-pulse' : animation === 'wave' ? 'skeleton-wave' : '';

  return (
    <div
      className={`${getVariantStyles()} ${animationClass} ${className}`}
      style={style}
      role="status"
      aria-label={ariaLabel}
    >
      <span className="sr-only">{srText}</span>
    </div>
  );
};

// Skeleton group for multiple skeletons
interface SkeletonGroupProps {
  count?: number;
  spacing?: number;
  children?: React.ReactNode;
  className?: string;
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  count = 3,
  spacing = 8,
  children,
  className = '',
}) => {
  if (children) {
    return (
      <div className={`flex flex-col ${className}`} style={{ gap: `${spacing}px` }}>
        {children}
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`} style={{ gap: `${spacing}px` }}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} />
      ))}
    </div>
  );
};

export default Skeleton;
