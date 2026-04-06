import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
}

const sizeMap = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const variantColorMap = {
  default: 'var(--color-brand-primary)',
  success: 'var(--color-status-success)',
  warning: 'var(--color-status-warning)',
  error: 'var(--color-status-error)',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  className = '',
  animated = true,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const displayLabel = label ?? `${Math.round(percentage)}%`;

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {displayLabel}
          </span>
        </div>
      )}
      <div
        className={`w-full ${sizeMap[size]} overflow-hidden`}
        style={{
          backgroundColor: 'var(--color-background-muted)',
          borderRadius: 'var(--radius-full)',
        }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
      >
        <div
          className={`h-full ${animated ? 'transition-all' : ''}`}
          style={{
            width: `${percentage}%`,
            backgroundColor: variantColorMap[variant],
            borderRadius: 'var(--radius-full)',
            transitionDuration: animated ? 'var(--animation-duration-normal)' : '0ms',
            transitionTimingFunction: 'var(--animation-easing-ease-out)',
          }}
        />
      </div>
    </div>
  );
};

// Indeterminate progress bar for unknown progress
interface IndeterminateProgressProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export const IndeterminateProgress: React.FC<IndeterminateProgressProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div
        className={`w-full ${sizeMap[size]} overflow-hidden relative`}
        style={{
          backgroundColor: 'var(--color-background-muted)',
          borderRadius: 'var(--radius-full)',
        }}
        role="progressbar"
        aria-label="Loading"
        aria-busy="true"
      >
        <div
          className="h-full absolute animate-progress-indeterminate"
          style={{
            width: '40%',
            backgroundColor: variantColorMap[variant],
            borderRadius: 'var(--radius-full)',
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
