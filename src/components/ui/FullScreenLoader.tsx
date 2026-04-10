interface FullScreenLoaderProps {
  label?: string;
  hint?: string;
}

// Bundled like Logo.tsx — /workedin-logos/* is not served from public/ in this repo.
const LOADER_LOGO = new URL('../../../workedin-logos/22-icon-square-dark.svg', import.meta.url).href;

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
        style={{ background: 'color-mix(in srgb, var(--workspace-accent, #d97706) 12%, transparent)' }} />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full blur-[100px]"
        style={{ background: 'color-mix(in srgb, var(--workspace-primary, #b45309) 8%, transparent)' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 animate-[fade-in_0.6s_ease-out]">

        {/* Logo card */}
        <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl"
          style={{
            background: 'transparent',
          }}
        >
          {/* Spinning accent ring */}
          <div
            className="absolute inset-0 rounded-3xl animate-[spin_3s_linear_infinite]"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, transparent 70%, color-mix(in srgb, var(--workspace-accent, #d97706) 60%, transparent) 100%)',
              borderRadius: '24px',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              padding: '2px',
            }}
          />
          <img
            src={LOADER_LOGO}
            alt="WorkedIn"
            className="h-16 w-16 object-contain relative z-10"
            style={{ filter: 'drop-shadow(0 0 20px rgba(217, 119, 6, 0.3))' }}
            width={64}
            height={64}
            decoding="async"
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
            style={{ background: 'linear-gradient(90deg, transparent, var(--workspace-accent, #d97706), transparent)', width: '60%' }}
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
