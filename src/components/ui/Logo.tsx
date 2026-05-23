import { useWorkspaceStore } from '@/lib/workspaceState';
import { useAuth } from '@/contexts/AuthContext';

interface LogoProps {
  variant?: 'full' | 'mark' | 'pill';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  mode?: 'client' | 'freelancer' | 'auto' | 'black'; // Added 'black' for loading/favicon
  titleStyle?: 'default' | 'capsule' | 'minimal'; // Keep for backward compatibility but not used
}

const SIZE_CONFIG = {
  xs: { iconSize: 26, fontSize: 13, gap: 6 },
  sm: { iconSize: 34, fontSize: 16, gap: 8 },
  md: { iconSize: 42, fontSize: 20, gap: 10 },
  lg: { iconSize: 54, fontSize: 26, gap: 12 },
};

// Same square format, proper color files
const LOGO_ICON_AMBER = new URL('../../../workedin-logos/13-icon-square-amber.svg', import.meta.url).href;
const LOGO_ICON_PURPLE = new URL('../../../workedin-logos/20-icon-square-purple.svg', import.meta.url).href;
const LOGO_ICON_BLACK = new URL('../../../workedin-logos/22-icon-square-dark.svg', import.meta.url).href;

export function Logo({
  variant = 'full',
  size = 'md',
  className = '',
  mode = 'auto',
}: LogoProps) {
  const cfg = SIZE_CONFIG[size];
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const { profile } = useAuth();

  // Resolve mode: auto-detect from context or use explicit mode
  const resolvedMode = mode === 'auto'
    ? (activeWorkspace === 'freelancer' || profile?.user_type === 'freelancer' ? 'freelancer' : 'client')
    : mode;

  // Select icon based on mode
  const iconSrc = resolvedMode === 'black' 
    ? LOGO_ICON_BLACK 
    : resolvedMode === 'freelancer'
    ? LOGO_ICON_PURPLE
    : LOGO_ICON_AMBER;
  const accentClass = resolvedMode === 'freelancer' ? 'text-purple-400' : 'text-amber-400';

  // Icon-only variant (for loading, favicons, etc.)
  if (variant === 'mark') {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center ${className}`} aria-label="WorkedIn">
        <img
          src={iconSrc}
          alt="WorkedIn"
          width={cfg.iconSize}
          height={cfg.iconSize}
          className="block object-contain"
        />
      </span>
    );
  }

  // Pill variant (compact with icon + text)
  if (variant === 'pill') {
    return (
      <span className={`inline-flex shrink-0 items-center gap-2 ${className}`} aria-label="WorkedIn">
        <img
          src={iconSrc}
          alt=""
          height={cfg.iconSize}
          className="block object-contain"
          style={{ height: cfg.iconSize, width: 'auto' }}
        />
        <span className="inline-flex items-baseline gap-0.5 font-sans whitespace-nowrap" dir="ltr">
          <span
            className="font-semibold text-foreground"
            style={{ fontSize: cfg.fontSize * 0.9, letterSpacing: '0.02em' }}
          >Worked</span>
          <span
            className={`font-black ${accentClass}`}
            style={{ fontSize: cfg.fontSize * 1.1, letterSpacing: '0.05em' }}
          >In</span>
        </span>
      </span>
    );
  }

  // Full variant (icon + text)
  return (
    <span className={`inline-flex shrink-0 items-center ${className}`} aria-label="WorkedIn" style={{ gap: `${cfg.gap}px` }}>
      <img
        src={iconSrc}
        alt=""
        height={cfg.iconSize}
        className="block object-contain"
        style={{ height: cfg.iconSize, width: 'auto' }}
      />
      <span className="inline-flex items-baseline gap-0.5 font-sans whitespace-nowrap" dir="ltr">
        <span
          className="font-semibold text-foreground"
          style={{ fontSize: cfg.fontSize * 0.9, letterSpacing: '0.02em' }}
        >Worked</span>
        <span
          className={`font-black ${accentClass}`}
          style={{ fontSize: cfg.fontSize * 1.1, letterSpacing: '0.05em' }}
        >In</span>
      </span>
    </span>
  );
}
