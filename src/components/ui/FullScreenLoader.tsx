import { Loader2 } from 'lucide-react';
import { Logo } from './Logo';

interface FullScreenLoaderProps {
  label?: string;
  hint?: string;
}

export default function FullScreenLoader({
  label = 'Loading...',
  hint,
}: FullScreenLoaderProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-50 px-4 dark:bg-zinc-950">
      {/* Subtle Dynamic Workspace Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color-mix(in_srgb,var(--workspace-accent)_8%,transparent)] blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center animate-[fade-in_0.5s_ease-out]">
        <div className="relative mb-8 flex h-[88px] w-[88px] items-center justify-center rounded-[24px] border border-gray-200 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:border-white/5 dark:bg-zinc-900/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          {/* Subtle spinning ring border */}
          <div className="absolute -inset-px rounded-[24px] border border-t-[color-mix(in_srgb,var(--workspace-accent)_50%,transparent)] border-r-transparent border-b-transparent border-l-transparent animate-[spin_4s_linear_infinite]" />
          
          <Logo variant="mark" size="lg" />
        </div>

        <div className="flex flex-col items-center space-y-2.5 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {label}
          </h1>
          {hint && (
            <p className="max-w-[280px] text-sm text-gray-500 dark:text-zinc-400">
              {hint}
            </p>
          )}
          
          <div className="pt-6">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'color-mix(in srgb, var(--workspace-accent) 60%, transparent)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
