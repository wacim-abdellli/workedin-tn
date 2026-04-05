// src/components/ui/Logo.tsx
// Drop-in logo component for Khedma TN
// Uses inline SVG — no external files needed, no img tags, no broken paths

import React from 'react';

interface LogoProps {
  variant?: 'full' | 'mark' | 'pill';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

// Mark-only SVG paths (the two chevrons + center diamond)
function LogoMark({ violet, amber, size }: { violet: string; amber: string; size: number }) {
  const h = size;
  const w = Math.round(size * 0.8);
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 32 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Left chevron — violet */}
      <polygon points="0,20 10,4 16,4 8,20 16,36 10,36" fill={violet} />
      {/* Right chevron — amber */}
      <polygon points="32,20 22,4 28,4 32,20 28,36 22,36" fill={amber} />
      {/* Center diamond top — violet */}
      <polygon points="14,14 18,14 16,20" fill={violet} />
      {/* Center diamond bottom — amber */}
      <polygon points="14,26 18,26 16,20" fill={amber} />
    </svg>
  );
}

const SIZE_CONFIG = {
  xs: { markH: 20, fontSize: 14, gap: 6,  pillH: 22, pillW: 90  },
  sm: { markH: 28, fontSize: 18, gap: 8,  pillH: 28, pillW: 110 },
  md: { markH: 36, fontSize: 22, gap: 10, pillH: 36, pillW: 140 },
  lg: { markH: 48, fontSize: 28, gap: 14, pillH: 48, pillW: 190 },
};

export function Logo({ variant = 'full', size = 'md', className = '' }: LogoProps) {
  const cfg = SIZE_CONFIG[size];

  // Colors — always use the fixed brand colors, not CSS variables,
  // because SVG fill doesn't inherit CSS custom properties reliably
  // The wordmark text uses CSS variable so it adapts to dark/light
  const violet = '#7C3AED';
  const amber  = '#D97706';

  if (variant === 'mark') {
    return (
      <span className={`inline-flex items-center ${className}`} aria-label="Khedma TN">
        <LogoMark violet={violet} amber={amber} size={cfg.markH} />
      </span>
    );
  }

  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 rounded-full ${className}`}
        style={{
          background: '#5B21B6',
          height: cfg.pillH,
        }}
        aria-label="Khedma TN"
      >
        <LogoMark violet="rgba(255,255,255,0.9)" amber="#FCD34D" size={cfg.markH * 0.65} />
        <span
          style={{
            fontFamily: "'Outfit','DM Sans',system-ui,sans-serif",
            fontWeight: 700,
            fontSize: cfg.fontSize * 0.6,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            lineHeight: 1,
          }}
        >
          khedma
        </span>
        <span
          style={{
            fontFamily: "'Outfit','DM Sans',system-ui,sans-serif",
            fontWeight: 700,
            fontSize: cfg.fontSize * 0.6,
            letterSpacing: '-0.02em',
            color: '#FCD34D',
            lineHeight: 1,
          }}
        >
          tn
        </span>
      </span>
    );
  }

  // variant === 'full' — horizontal lockup
  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ gap: cfg.gap }}
      aria-label="Khedma TN"
    >
      <LogoMark violet={violet} amber={amber} size={cfg.markH} />
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
        <span
          style={{
            fontFamily: "'Outfit','DM Sans',system-ui,sans-serif",
            fontWeight: 700,
            fontSize: cfg.fontSize,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}
        >
          khedma
        </span>
        <span
          style={{
            fontFamily: "'Outfit','DM Sans',system-ui,sans-serif",
            fontWeight: 700,
            fontSize: cfg.fontSize,
            letterSpacing: '-0.03em',
            color: amber,
            lineHeight: 1,
          }}
        >
          tn
        </span>
      </span>
    </span>
  );
}
