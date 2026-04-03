import { Shield, Users, Wallet } from 'lucide-react';

const props = [
  {
    icon: Users,
    title: 'Matched work',
    description:
      'Apply to projects that match your exact skill level and rate. No competing on price - just on quality.',
  },
  {
    icon: Shield,
    title: 'Protected payouts',
    description:
      'Funds are held in escrow before work starts. You get paid the moment the client approves.',
  },
  {
    icon: Wallet,
    title: 'Build reputation',
    description:
      'Show your verified status, portfolio, and reviews. Win trust before you say a word.',
  },
];

export function ValuePropositions() {
  return (
    <section className="py-24" style={{ background: 'var(--surface-bg)' }}>
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-16">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-3"
            style={{ color: 'var(--workspace-primary-mid)' }}
          >
            Why Khedma TN
          </p>
          <h2
            className="font-display font-bold text-4xl tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Built different. For Tunisia.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {props.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border p-8 transition-all duration-200 hover:-translate-y-1"
              style={{
                background: 'var(--card-bg)',
                borderColor: 'var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--workspace-primary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)' }}
              >
                <p.icon className="w-6 h-6" style={{ color: 'var(--workspace-primary)' }} />
              </div>
              <h3
                className="font-display font-bold text-xl mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ValuePropositions;
