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
        <div className="mx-auto max-w-6xl space-y-6">
            <section className="radius-shell overflow-hidden border border-[color:var(--workspace-primary)]/18 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.10),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,242,255,0.96))] p-6 shadow-[0_32px_90px_-48px_rgba(109,40,217,0.32)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(167,139,250,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.10),transparent_24%),linear-gradient(145deg,rgba(22,18,32,0.98),rgba(15,13,22,0.98))] sm:p-8">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_320px]">
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-primary-200">
                            <Sparkles className="h-3.5 w-3.5" />
                            {tx('jobs.new.wizard.badge', undefined, 'Project posting flow')}
                        </div>

                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-[#171420] dark:text-white sm:text-4xl">
                                {title}
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5c5971] dark:text-[#aca9bd] sm:text-base">
                                {description}
                            </p>
                        </div>

                        {meta ? (
                            <div className="flex flex-wrap items-center gap-3">{meta}</div>
                        ) : null}
                    </div>

                    <div className="rounded-[1.75rem] border border-[color:var(--workspace-primary)]/15 bg-white/78 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--workspace-primary)]">
                            {tx('jobs.new.wizard.currentPhase', undefined, 'Current phase')}
                        </p>
                        <h2 className="mt-3 text-xl font-semibold text-[#171420] dark:text-white">
                            {current?.title}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">
                            {current?.description || tx('jobs.new.stepCounter', { current: currentStep, total: steps.length }, `Step ${currentStep} of ${steps.length}`)}
                        </p>

                        <div className="mt-5 space-y-3">
                            <div className="flex items-center justify-between text-sm font-medium text-[#353149] dark:text-[#e3def7]">
                                <span>{tx('jobs.new.wizard.progress', undefined, 'Progress')}</span>
                                <span>{completion}%</span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
                                <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--workspace-primary),var(--brand-accent))] transition-[width] duration-300" style={{ width: `${completion}%` }} />
                            </div>
                            <div className="flex items-center justify-between text-xs text-[#8b8aa0]">
                                <span>{tx('jobs.new.stepCounter', { current: currentStep, total: steps.length }, `Step ${currentStep} of ${steps.length}`)}</span>
                                <span>{steps.length - currentStep} {tx('jobs.new.wizard.stepsLeft', undefined, 'steps left')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="premium-panel radius-shell p-4 sm:p-5">
                <div className="grid gap-3 md:grid-cols-4">
                    {steps.map((step) => {
                        const isCompleted = step.id < currentStep;
                        const isCurrent = step.id === currentStep;

                        return (
                            <div
                                key={step.id}
                                className={`rounded-[1.4rem] border p-4 transition-all duration-200 ${isCurrent
                                    ? 'border-[color:var(--workspace-primary)]/28 bg-[color:var(--workspace-primary)]/[0.08] shadow-[0_22px_44px_-30px_rgba(109,40,217,0.55)]'
                                    : isCompleted
                                        ? 'border-[color:var(--brand-accent)]/30 bg-[color:var(--brand-accent)]/[0.08] dark:border-[color:var(--brand-accent)]/20 dark:bg-[color:var(--brand-accent)]/[0.06]'
                                        : 'border-gray-200/80 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]'}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${isCurrent
                                        ? 'text-white'
                                        : isCompleted
                                            ? 'bg-[color:var(--brand-accent)]/15 text-[color:var(--brand-accent)] dark:bg-[color:var(--brand-accent)]/15 dark:text-[#fbbf24]'
                                            : 'bg-gray-100 text-gray-500 dark:bg-white/8 dark:text-[#8b8aa0]'}`}
                                        style={isCurrent ? { background: 'linear-gradient(135deg, var(--workspace-primary), var(--workspace-primary-hover))' } : undefined}
                                    >
                                        {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                                    </div>

                                    <div className="min-w-0">
                                        <p className={`text-sm font-semibold ${isCurrent || isCompleted ? 'text-[#171420] dark:text-white' : 'text-[#57536a] dark:text-[#b8b3ca]'}`}>
                                            {step.title}
                                        </p>
                                        {step.description ? (
                                            <p className="mt-1 text-xs leading-5 text-[#8b8aa0]">
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

            <section className="premium-panel radius-shell overflow-hidden p-6 sm:p-8">
                {children}
            </section>
        </div>
    );
}
