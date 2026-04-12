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
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: '#0a0a0a' }}
    >
      {/* Subtle radial glow behind card */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          left: '50%',
          top: '50%',
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 flex flex-col items-center text-center"
        style={{
          background: '#111',
          border: '1px solid #1f1f1f',
          borderRadius: 28,
          padding: '48px 40px 40px',
          width: '100%',
          maxWidth: 360,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: 80,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)',
            top: -1,
          }}
        />

        {/* Logo */}
        <div
          className="mb-7 flex items-center justify-center"
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <img
            src={LOGO_AMBER}
            alt="WorkedIn"
            width={44}
            height={44}
            decoding="async"
            style={{ objectFit: 'contain' }}
          />
        </div>

        {/* Label */}
        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.3px',
            marginBottom: 10,
            lineHeight: 1.3,
          }}
        >
          {label}
        </h1>

        {/* Hint */}
        <p
          style={{
            fontSize: 13,
            color: '#555',
            lineHeight: 1.65,
            marginBottom: 36,
            maxWidth: 260,
          }}
        >
          {hint}
        </p>

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: 2,
            background: '#1e1e1e',
            borderRadius: 99,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: '45%',
              borderRadius: 99,
              background: 'linear-gradient(90deg, transparent, #f59e0b, #fbbf24)',
              animation: 'wi-slide 1.6s ease-in-out infinite',
            }}
          />
        </div>

        {/* Dots */}
        <div className="flex items-center gap-1.5 mt-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: '#f59e0b',
                opacity: 0.3,
                animation: `wi-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
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
