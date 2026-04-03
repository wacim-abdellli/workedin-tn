import { UserPlus, Search, CheckCircle, DollarSign } from 'lucide-react';

const steps = [
  { icon: UserPlus, step: '01', title: 'Create your profile', sub: 'Set your skills, rate, and portfolio in minutes.' },
  { icon: Search, step: '02', title: 'Apply to matched jobs', sub: 'Browse projects that fit your expertise.' },
  { icon: CheckCircle, step: '03', title: 'Agree on terms', sub: 'Negotiate directly. No middlemen.' },
  { icon: DollarSign, step: '04', title: 'Get paid securely', sub: 'Funds released via escrow on approval.' },
];

export function HowItWorksSection() {
  return (
    <section className="py-24" style={{ background: 'var(--page-bg)' }}>
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-16">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-3"
            style={{ color: 'var(--workspace-primary-mid)' }}
          >
            How it works
          </p>
          <h2
            className="font-display font-bold text-4xl tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            From signup to paid in 4 steps.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.step} className="relative">
              {i < steps.length - 1 && (
                <div
                  className="hidden lg:block absolute top-8 left-[calc(100%-1rem)] w-full h-px"
                  style={{ background: 'var(--border)' }}
                />
              )}
              <div
                className="rounded-2xl border p-6"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)' }}
                >
                  <s.icon className="w-7 h-7" style={{ color: 'var(--workspace-primary)' }} />
                </div>
                <p
                  className="font-display font-bold text-4xl mb-3 opacity-10"
                  style={{ color: 'var(--workspace-primary)' }}
                >
                  {s.step}
                </p>
                <h3
                  className="font-display font-bold text-lg mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {s.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
