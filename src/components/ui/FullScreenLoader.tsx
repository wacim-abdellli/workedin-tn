interface FullScreenLoaderProps {
  label?: string;
  hint?: string;
  mode?: 'freelancer' | 'client' | 'admin';
}

const LOGO_PURPLE = new URL('../../../workedin-logos/20-icon-square-purple.svg', import.meta.url).href;
const LOGO_AMBER = new URL('../../../workedin-logos/13-icon-square-amber.svg', import.meta.url).href;

function detectWorkspaceMode(): 'freelancer' | 'client' | 'admin' {
  // First, check if there's a workspace class already applied to the document
  if (document.documentElement.classList.contains('workspace-client') || 
      document.body.classList.contains('workspace-client')) {
    return 'client';
  }
  if (document.documentElement.classList.contains('workspace-admin') || 
      document.body.classList.contains('workspace-admin')) {
    return 'admin';
  }
  
  // Check localStorage for active_mode
  try {
    const storedProfile = localStorage.getItem('profile');
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      if (profile?.active_mode === 'client') return 'client';
      if (profile?.active_mode === 'freelancer') return 'freelancer';
    }
  } catch {
    // Ignore localStorage errors
  }
  
  // Check URL pathname as last resort
  const pathname = window.location.pathname;
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/client') || pathname.startsWith('/jobs/new') || pathname.startsWith('/find-freelancers')) {
    return 'client';
  }
  if (pathname.startsWith('/freelancer') || pathname.startsWith('/jobs')) {
    return 'freelancer';
  }
  
  return 'freelancer';
}

export default function FullScreenLoader({
  label = 'Preparing your workspace',
  hint = 'Loading the latest dashboard state, activity, and shortcuts.',
  mode,
}: FullScreenLoaderProps) {
  const workspaceMode = mode || detectWorkspaceMode();
  const isClient = workspaceMode === 'client';
  const workspaceClass = workspaceMode === 'admin' ? 'workspace-admin' : isClient ? 'workspace-client' : '';
  
  const logo = isClient ? LOGO_AMBER : LOGO_PURPLE;
  const glowColor = isClient ? 'rgba(245,158,11,0.06)' : 'rgba(147,51,234,0.06)';
  const accentGradient = isClient 
    ? 'linear-gradient(90deg, transparent, #f59e0b, transparent)'
    : 'linear-gradient(90deg, transparent, #9333ea, transparent)';
  const progressGradient = isClient
    ? 'linear-gradient(90deg, transparent, #f59e0b, #fbbf24)'
    : 'linear-gradient(90deg, transparent, #9333ea, #a855f7)';
  const dotColor = isClient ? 'bg-amber-400' : 'bg-purple-400';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg-base)] ${workspaceClass}`} role="status" aria-label={label}>
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          left: '50%', top: '50%',
        }}
      />

      {/* Card */}
      <div className="relative z-10 flex flex-col items-center text-center bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-[28px] px-10 py-12 w-full max-w-[360px] shadow-xl">
        {/* Top accent line */}
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-20 h-0.5 rounded-full"
          style={{ background: accentGradient }}
        />

        {/* Logo */}
        <div className="mb-7 flex items-center justify-center w-[72px] h-[72px] rounded-[20px] bg-[var(--color-bg-muted)] border border-[var(--color-border-default)] shadow-md">
          <img src={logo} alt="WorkedIn" width={44} height={44} decoding="async" style={{ objectFit: 'contain' }} />
        </div>

        {/* Label */}
        <h1 className="text-[18px] font-bold text-[var(--color-text-primary)] tracking-tight leading-snug mb-2.5">
          {label}
        </h1>

        {/* Hint */}
        <p className="text-[13px] text-[var(--color-text-tertiary)] leading-relaxed mb-9 max-w-[260px]">
          {hint}
        </p>

        {/* Progress bar */}
        <div className="w-full h-0.5 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
          <div className="h-full w-[45%] rounded-full"
            style={{
              background: progressGradient,
              animation: 'wi-slide 1.6s ease-in-out infinite',
            }}
          />
        </div>

        {/* Dots */}
        <div className="flex items-center gap-1.5 mt-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`w-1 h-1 rounded-full ${dotColor}`}
              style={{ opacity: 0.3, animation: `wi-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes wi-slide {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(280%); }
        }
        @keyframes wi-pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}

