import React from 'react';

interface DashWidgetProps {
  title: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}

export function DashWidget({ title, icon, action, children }: DashWidgetProps) {
  return (
    <div
      className="rounded-[1.4rem] border overflow-hidden transition-all duration-200"
      style={{
        background: 'var(--dash-card)',
        borderColor: 'var(--dash-border)',
        borderTop: '2px solid transparent',
        boxShadow: 'var(--shadow-md)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderTopColor = 'var(--workspace-primary)';
        e.currentTarget.style.borderColor = 'var(--dash-border-hover)';
        e.currentTarget.style.background = 'var(--dash-card-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderTopColor = 'transparent';
        e.currentTarget.style.borderColor = 'var(--dash-border)';
        e.currentTarget.style.background = 'var(--dash-card)';
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'var(--dash-border)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl"
            style={{
              background: 'color-mix(in srgb, var(--workspace-primary) 14%, transparent)',
              color: 'var(--workspace-primary)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {icon}
          </span>
          <span
            className="font-display font-semibold text-sm uppercase tracking-wider"
            style={{ color: 'color-mix(in srgb, var(--workspace-primary-mid) 58%, var(--text-primary))' }}
          >
            {title}
          </span>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs font-medium transition-colors"
            style={{ color: 'var(--workspace-primary-hover)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--workspace-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--workspace-primary-hover)';
            }}
          >
            {action.label} →
          </button>
        )}
      </div>

      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
