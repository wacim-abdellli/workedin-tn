import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui';
import { useTranslation } from '@/i18n';

interface AuthShellHighlight {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: 'primary' | 'accent' | 'cyan';
}

interface AuthShellProps {
  badge: string;
  title: string;
  description: string;
  highlights: AuthShellHighlight[];
  topAction?: ReactNode;
  children: ReactNode;
}

export default function AuthShell({ title, description, highlights, topAction, children }: AuthShellProps) {
  const { dir } = useTranslation();

  return (
    <div dir={dir} className="min-h-screen bg-zinc-950 text-white flex flex-col">

      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[var(--workspace-primary)] opacity-[0.07] blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-amber-500 opacity-[0.05] blur-[120px]" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-purple-600 opacity-[0.04] blur-[100px]" />
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-10">
        <Link to="/" className="transition-opacity hover:opacity-80">
          <Logo variant="full" size="lg" titleStyle="capsule" mode="client" />
        </Link>
        {topAction}
      </header>

      {/* Main split layout */}
      <main className="relative z-10 flex flex-1 items-stretch">

        {/* Left panel — hero */}
        <div className="hidden lg:flex flex-col justify-center px-10 xl:px-16 w-[52%] border-r border-white/5">
          <div className="max-w-lg">
            <h1 className="text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight text-white mb-4">
              {title}
            </h1>
            <p className="text-lg text-white/50 leading-relaxed mb-10">
              {description}
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-3 gap-3">
              {highlights.map(({ icon: Icon, title: t, description: d }) => (
                <div
                  key={t}
                  className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-4 hover:border-white/10 hover:bg-white/[0.06] transition-all duration-300"
                >
                  <div className="mb-3 w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[var(--workspace-primary)]/20 transition-colors">
                    <Icon className="w-4 h-4 text-white/60 group-hover:text-[var(--workspace-primary)] transition-colors" />
                  </div>
                  <p className="text-sm font-semibold text-white/80 mb-1">{t}</p>
                  <p className="text-xs text-white/35 leading-relaxed">{d}</p>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {['#f59e0b','#8b5cf6','#06b6d4','#10b981'].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-950 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: c }}>
                    {['A','B','C','D'][i]}
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/40">
                <span className="text-white/70 font-semibold">500+</span> professionals already on WorkedIn
              </p>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-1 items-center justify-center px-6 py-8 lg:px-12">
          <div className="w-full max-w-[420px]">
            {children}
          </div>
        </div>

      </main>
    </div>
  );
}
