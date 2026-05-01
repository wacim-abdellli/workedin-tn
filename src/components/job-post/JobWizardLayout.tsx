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
    const stepsLeft = Math.max(steps.length - currentStep, 0);

    return (
        <div className="mx-auto w-full max-w-[1200px] px-2 pb-6 sm:px-4 lg:px-6">
            <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:gap-5">
                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <div className="rounded-2xl border border-[#262626] bg-[var(--color-bg-elevated)] p-4 shadow-[0_24px_56px_-44px_rgba(0,0,0,0.9)] sm:p-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
                            <Sparkles className="h-3.5 w-3.5" />
                            {tx('jobs.new.wizard.badge', undefined, 'Project posting flow')}
                        </div>

                        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f59e0b]">
                            {tx('jobs.new.wizard.currentPhase', undefined, 'Current phase')}
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">{current?.title}</h2>
                        <p className="mt-1 text-sm text-[#b3b3b3]">
                            {current?.description || tx('jobs.new.stepCounter', { current: currentStep, total: steps.length }, `Step ${currentStep} of ${steps.length}`)}
                        </p>

                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-xs text-[#b3b3b3]">
                                <span>{tx('jobs.new.wizard.progress', undefined, 'Progress')}</span>
                                <span className="font-semibold text-[var(--color-text-primary)]">{completion}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
                                <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-[width] duration-300" style={{ width: `${completion}%` }} />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-[#7d7d7d]">
                                <span>{tx('jobs.new.stepCounter', { current: currentStep, total: steps.length }, `Step ${currentStep} of ${steps.length}`)}</span>
                                <span>{tx('jobs.new.wizard.stepsLeft', { count: stepsLeft }, `${stepsLeft} steps left`)}</span>
                            </div>
                        </div>

                        <ol className="mt-5 space-y-2">
                            {steps.map((step) => {
                                const isCompleted = step.id < currentStep;
                                const isCurrent = step.id === currentStep;

                                return (
                                    <li
                                        key={step.id}
                                        className={`rounded-xl border p-3 transition-all ${isCurrent
                                            ? 'border-orange-500/45 bg-orange-500/10'
                                            : isCompleted
                                                ? 'border-orange-500/25 bg-orange-500/5'
                                                : 'border-[#262626] bg-[var(--color-bg-base)]'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span
                                                className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${isCurrent
                                                    ? 'bg-orange-500 text-[var(--color-text-primary)]'
                                                    : isCompleted
                                                        ? 'bg-orange-500/20 text-orange-300'
                                                        : 'bg-[var(--color-bg-muted)] text-[#8a8a8a]'
                                                    }`}
                                            >
                                                {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.id}
                                            </span>
                                            <div className="min-w-0">
                                                <p className={`text-sm font-medium ${isCurrent || isCompleted ? 'text-[var(--color-text-primary)]' : 'text-[#b3b3b3]'}`}>
                                                    {step.title}
                                                </p>
                                                {step.description ? (
                                                    <p className="mt-0.5 text-xs leading-5 text-[#7d7d7d]">{step.description}</p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                </aside>

                <div className="min-w-0 space-y-4">
                    <section className="rounded-2xl border border-[#262626] bg-[var(--color-bg-elevated)] p-4 shadow-[0_24px_56px_-44px_rgba(0,0,0,0.9)] sm:p-5">
                        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">{title}</h1>
                        <p className="mt-2 text-sm leading-6 text-[#b3b3b3] sm:text-[15px]">{description}</p>
                        {meta ? <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div> : null}
                    </section>

                    <section className="rounded-2xl border border-[#262626] bg-[var(--color-bg-elevated)] p-4 shadow-[0_24px_56px_-44px_rgba(0,0,0,0.9)] sm:p-5 lg:p-6">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}




