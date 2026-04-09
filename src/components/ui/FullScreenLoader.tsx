interface FullScreenLoaderProps {
  label?: string;
  hint?: string;
}

export default function FullScreenLoader({
  label = 'Loading...',
  hint,
}: FullScreenLoaderProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050507] px-4">

      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: 'color-mix(in srgb, var(--workspace-accent) 12%, transparent)' }} />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full blur-[100px]"
        style={{ background: 'color-mix(in srgb, var(--workspace-primary) 8%, transparent)' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 animate-[fade-in_0.6s_ease-out]">

        {/* Logo card */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[22px] shadow-2xl"
          style={{
            background: 'linear-gradient(145deg, #1a1a1a, #111)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 32px 64px -16px rgba(0,0,0,0.8), 0 0 80px -20px color-mix(in srgb, var(--workspace-accent) 40%, transparent)',
          }}
        >
          {/* Spinning accent ring */}
          <div
            className="absolute inset-[-2px] rounded-[24px] animate-[spin_3s_linear_infinite]"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, transparent 70%, color-mix(in srgb, var(--workspace-accent) 80%, transparent) 100%)',
              borderRadius: '24px',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              padding: '2px',
            }}
          />
          <img
            src="/workedin-logos/22-icon-square-dark.svg"
            alt="WorkedIn"
            className="h-14 w-14 object-contain rounded-[10px]"
          />
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            {label}
          </h1>
          {hint && (
            <p className="max-w-[260px] text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {hint}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-40 h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full animate-[progress-slide_1.8s_ease-in-out_infinite]"
            style={{ background: 'linear-gradient(90deg, transparent, var(--workspace-accent), transparent)', width: '60%' }}
          />
        </div>
      </div>

      <style>{`
        @keyframes progress-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(280%); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
