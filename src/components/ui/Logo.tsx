// src/components/ui/Logo.tsx
// Concept C — Trust Shield with K letterform
// Uses inline SVG — no external files needed, works everywhere

interface LogoProps {
  variant?: 'full' | 'mark' | 'pill';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

// Shield mark with K letterform (Concept C — Trust)
function LogoMark({ violet, amber, innerViolet, size }: { violet: string; amber: string; innerViolet: string; size: number }) {
  const h = size;
  const w = Math.round(size * 0.93);
  
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 100 108"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Shield outer — violet */}
      <path d="M50 4 L88 18 L88 56 Q88 84 50 104 Q12 84 12 56 L12 18 Z" fill={violet} />
      
      {/* Shield inner — darker violet */}
      <path d="M50 13 L80 25 L80 56 Q80 77 50 94 Q20 77 20 56 L20 25 Z" fill={innerViolet} />
      
      {/* Amber accent band — symbolizes trust earned */}
      <path d="M25 74 Q37 86 50 94 Q63 86 75 74 Z" fill={amber} opacity="0.9" />
      
      {/* K letterform stem — white/primary */}
      <rect x="37" y="30" width="10" height="44" rx="5" fill="rgba(255,255,255,0.95)" />
      
      {/* K upper arm — freelancer reaches up (white) */}
      <path d="M47 52 L73 30" stroke="rgba(255,255,255,0.95)" strokeWidth="10" strokeLinecap="round" fill="none" />
      
      {/* K lower arm — client reaches down (amber) */}
      <path d="M47 52 L73 74" stroke={amber} strokeWidth="10" strokeLinecap="round" fill="none" />
      
      {/* Connection dot at K joint — trust point */}
      <circle cx="47" cy="52" r="6" fill={amber} />
    </svg>
  );
}

const SIZE_CONFIG = {
  xs: { markH: 20, fontSize: 12, gap: 5,  pillH: 22 },
  sm: { markH: 28, fontSize: 16, gap: 7,  pillH: 28 },
  md: { markH: 36, fontSize: 20, gap: 9,  pillH: 36 },
  lg: { markH: 48, fontSize: 26, gap: 12, pillH: 48 },
};

export function Logo({ variant = 'full', size = 'md', className = '' }: LogoProps) {
  const cfg = SIZE_CONFIG[size];

  // Colors — locked brand colors
  const violet = '#5B21B6';        // Light theme primary
  const innerViolet = '#4C1D95';   // Darker violet inner
  const amber = '#D97706';          // Accent color
  const amberLight = '#FCD34D';     // Light theme accent

  if (variant === 'mark') {
    return (
      <span className={`inline-flex items-center justify-center ${className}`} aria-label="Khedma TN">
        <LogoMark violet={violet} amber={amber} innerViolet={innerViolet} size={cfg.markH} />
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
        <LogoMark 
          violet="rgba(255,255,255,0.15)" 
          amber={amberLight} 
          innerViolet="rgba(255,255,255,0.08)"
          size={cfg.markH * 0.72} 
        />
        <span
          style={{
            fontFamily: "'Outfit','DM Sans',system-ui,sans-serif",
            fontWeight: 800,
            fontSize: cfg.fontSize * 0.8,
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
            fontWeight: 800,
            fontSize: cfg.fontSize * 0.8,
            letterSpacing: '-0.02em',
            color: amberLight,
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
      <LogoMark violet={violet} amber={amber} innerViolet={innerViolet} size={cfg.markH} />
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
        <span
          style={{
            fontFamily: "'Outfit','DM Sans',system-ui,sans-serif",
            fontWeight: 800,
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
            fontWeight: 800,
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
