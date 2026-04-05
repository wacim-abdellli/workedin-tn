import type { ReactNode } from 'react';
import { Check, Sparkles } from 'lucide-react';

import { useTranslation } from '../../i18n';

interface WizardStep {
    id: number;
    title: string;
    description?: string;
}

interface JobWizardLayoutProps {
    currentStep: number;
    steps: WizardStep[];
    title: string;
    description: string;
    meta?: ReactNode;
    children: ReactNode;
}

export default function JobWizardLayout({
    currentStep,
    steps,
    title,
    description,
    meta,
    children,
}: JobWizardLayoutProps) {
    const { tx } = useTranslation();

    const current = steps[currentStep - 1];
    const completion = Math.round((currentStep / steps.length) * 100);

    return (
        <div className="mx-auto max-w-6xl space-y-5 lg:space-y-6">
            <section
                className="radius-shell overflow-hidden border p-6 transition-all duration-300 hover:-translate-y-0.5 sm:p-8 lg:p-9"
                style={{
                    borderColor: 'color-mix(in srgb, var(--brand-accent) 20%, var(--border))',
                    background: 'radial-gradient(circle at top left, color-mix(in srgb, var(--brand-accent) 12%, transparent), transparent 28%), radial-gradient(circle at top right, color-mix(in srgb, #f59e0b 8%, transparent), transparent 24%), linear-gradient(145deg, color-mix(in srgb, var(--card-bg) 96%, white), color-mix(in srgb, var(--surface-bg) 94%, white))',
                    boxShadow: '0 36px 90px -52px color-mix(in srgb, var(--brand-accent) 30%, transparent)',
                }}
            >
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_320px]">
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] shadow-sm"
                            style={{
                                borderColor: 'color-mix(in srgb, var(--brand-accent) 24%, transparent)',
                                background: 'color-mix(in srgb, var(--brand-accent) 10%, var(--card-bg))',
                                color: 'var(--brand-accent)',
                            }}>
                            <Sparkles className="h-3.5 w-3.5" />
                            {tx('jobs.new.wizard.badge', undefined, 'Project posting flow')}
                        </div>

                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
                                {title}
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-7 sm:text-base" style={{ color: 'var(--text-secondary)' }}>
                                {description}
                            </p>
                        </div>

                        {meta ? (
                            <div className="flex flex-wrap items-center gap-3">{meta}</div>
                        ) : null}
                    </div>

                    <div className="rounded-[1.9rem] border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_60px_-44px_var(--workspace-primary-shadow,rgba(109,40,217,0.35))]"
                        style={{
                            borderColor: 'color-mix(in srgb, var(--brand-accent) 18%, var(--border))',
                            background: 'color-mix(in srgb, var(--card-bg) 88%, transparent)',
                            boxShadow: '0 20px 40px -32px rgba(15,23,42,0.45)',
                        }}>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--brand-accent)' }}>
                            {tx('jobs.new.wizard.currentPhase', undefined, 'Current phase')}
                        </p>
                        <h2 className="mt-3 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {current?.title}
                        </h2>
                        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                            {current?.description || tx('jobs.new.stepCounter', { current: currentStep, total: steps.length }, `Step ${currentStep} of ${steps.length}`)}
                        </p>

                        <div className="mt-5 space-y-3">
                            <div className="flex items-center justify-between text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                <span>{tx('jobs.new.wizard.progress', undefined, 'Progress')}</span>
                                <span>{completion}%</span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
                                <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-accent),#f59e0b)] transition-[width] duration-300" style={{ width: `${completion}%` }} />
                            </div>
                            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                                <span>{tx('jobs.new.stepCounter', { current: currentStep, total: steps.length }, `Step ${currentStep} of ${steps.length}`)}</span>
                                <span>{tx('jobs.new.wizard.stepsLeft', { count: steps.length - currentStep }, `${steps.length - currentStep} steps left`)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="premium-panel radius-shell p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-52px_rgba(245,158,11,0.24)] sm:p-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {steps.map((step) => {
                        const isCompleted = step.id < currentStep;
                        const isCurrent = step.id === currentStep;

                        return (
                            <div
                                key={step.id}
                                className="rounded-[1.5rem] border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-26px_rgba(245,158,11,0.2)]"
                                style={isCurrent
                                    ? {
                                        borderColor: 'color-mix(in srgb, var(--brand-accent) 34%, transparent)',
                                        background: 'color-mix(in srgb, var(--brand-accent) 12%, transparent)',
                                        boxShadow: '0 24px 48px -34px color-mix(in srgb, var(--brand-accent) 44%, transparent)',
                                    }
                                    : isCompleted
                                        ? {
                                            borderColor: 'color-mix(in srgb, var(--brand-accent) 30%, transparent)',
                                            background: 'color-mix(in srgb, var(--brand-accent) 10%, transparent)',
                                        }
                                        : {
                                            borderColor: 'var(--border)',
                                            background: 'color-mix(in srgb, var(--card-bg) 85%, transparent)',
                                        }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${isCurrent
                                        ? 'text-white'
                                        : isCompleted
                                            ? 'bg-[color:var(--brand-accent)]/15 text-[color:var(--brand-accent)] dark:bg-[color:var(--brand-accent)]/15 dark:text-[#fbbf24]'
                                        : 'bg-gray-100 text-gray-500 dark:text-gray-400 dark:bg-white/8 dark:text-[#8b8aa0]'}`}
                                        style={isCurrent ? { background: 'linear-gradient(135deg, var(--brand-accent), #f59e0b)' } : undefined}
                                    >
                                        {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                                            {tx('jobs.new.stepCounter', { current: step.id, total: steps.length }, `Step ${step.id} of ${steps.length}`)}
                                        </p>
                                        <p className="text-sm font-semibold" style={{ color: isCurrent || isCompleted ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                            {step.title}
                                        </p>
                                        {step.description ? (
                                            <p className="mt-1 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>
                                                {step.description}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="premium-panel radius-shell overflow-hidden border p-6 shadow-[0_28px_70px_-52px_rgba(15,23,42,0.55)] sm:p-8" style={{ borderColor: 'var(--border)' }}>
                {children}
            </section>
        </div>
    );
}
