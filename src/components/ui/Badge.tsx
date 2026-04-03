import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children: ReactNode;
}

const styles: Record<NonNullable<BadgeProps['variant']>, { background: string; color: string }> = {
  default: { background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' },
  success: { background: 'rgba(16,185,129,0.16)', color: 'rgb(110, 231, 183)' },
  warning: { background: 'rgba(212,160,23,0.18)', color: 'rgb(245, 222, 161)' },
  danger: { background: 'rgba(239,68,68,0.16)', color: 'rgb(252, 165, 165)' },
  info: { background: 'color-mix(in srgb, var(--workspace-primary) 18%, transparent)', color: 'var(--workspace-primary-mid)' },
};

export default function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
      style={styles[variant]}
    >
      {children}
    </span>
  );
}
