import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/i18n';

export function CTASection() {
  const navigate = useNavigate();
  const { tx } = useTranslation();

  return (
    <section className="py-24" style={{ background: 'var(--page-bg)' }}>
      <div className="container mx-auto px-6 lg:px-8 max-w-4xl text-center">
        <div
          className="rounded-3xl border p-16"
          style={{
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--workspace-primary) 15%, transparent) 0%, color-mix(in srgb, var(--workspace-primary) 8%, transparent) 100%)',
            borderColor: 'color-mix(in srgb, var(--workspace-primary) 20%, transparent)',
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-4"
            style={{ color: 'var(--workspace-primary-mid)' }}
          >
            {tx('ctaSection.badge')}
          </p>
          <h2
            className="font-display font-bold text-4xl sm:text-5xl tracking-tight mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            {tx('ctaSection.title')}
          </h2>
          <p
            className="text-lg mb-10 max-w-xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            {tx('ctaSection.subtitle')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: 'var(--workspace-primary)', fontSize: '1rem' }}
            >
              {tx('ctaSection.primary')} <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/jobs/new')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold transition-all hover:-translate-y-0.5 border"
              style={{
                color: 'var(--text-primary)',
                borderColor: 'var(--border-strong)',
                background: 'var(--card-bg)',
                fontSize: '1rem',
              }}
            >
              {tx('ctaSection.secondary')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
