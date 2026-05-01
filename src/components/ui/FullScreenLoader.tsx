interface FullScreenLoaderProps {
  label?: string;
  hint?: string;
}

const LOGO_AMBER = new URL('../../../workedin-logos/13-icon-square-amber.svg', import.meta.url).href;

export default function FullScreenLoader({
  label = 'Preparing your workspace',
  hint = 'Loading the latest dashboard state, activity, and shortcuts.',
}: FullScreenLoaderProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-bg-base)]">
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          left: '50%', top: '50%',
        }}
      />

      {/* Card */}
      <div className="relative z-10 flex flex-col items-center text-center bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-[28px] px-10 py-12 w-full max-w-[360px] shadow-xl">
        {/* Top accent line */}
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-20 h-0.5 rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }}
        />

        {/* Logo */}
        <div className="mb-7 flex items-center justify-center w-[72px] h-[72px] rounded-[20px] bg-[var(--color-bg-muted)] border border-[var(--color-border-default)] shadow-md">
          <img src={LOGO_AMBER} alt="WorkedIn" width={44} height={44} decoding="async" style={{ objectFit: 'contain' }} />
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
              background: 'linear-gradient(90deg, transparent, #f59e0b, #fbbf24)',
              animation: 'wi-slide 1.6s ease-in-out infinite',
            }}
          />
        </div>

        {/* Dots */}
        <div className="flex items-center gap-1.5 mt-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-amber-400"
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

